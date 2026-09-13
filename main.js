const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, safeStorage } = require('electron');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const envCandidates = [
  path.join(app.getPath('userData'), '.env'),
  path.join(__dirname, '.env'),
  path.join(app.getPath('desktop'), 'master-chief-hologram', '.env')
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}

const execFileAsync = promisify(execFile);
const CODEX_BIN = process.env.CODEX_BIN || '/Applications/ChatGPT.app/Contents/Resources/codex';
const APP_VERSION = require('./package.json').version;
const { validateChatPayload, validateMessages, safeProviderError, validSecret } = require('./security');
const { createCredentialStore } = require('./credential-store');
const { getToolRegistry, normalizeApprovals, setToolApproval } = require('./tool-registry');
const { createRagIndex } = require('./rag-index');
const { voiceSelfTest } = require('./voice-diagnostics');

let mainWindow;
let tray;
let activeChild = null;
let credentialStore;
function credentials() { return credentialStore || (credentialStore = createCredentialStore({ safeStorage, filePath: path.join(app.getPath('userData'), 'credentials.json') })); }
let activeAbortController = null;
let toolApprovals;
function approvalFile() { return path.join(app.getPath('userData'), 'tool-approvals.json'); }
function loadToolApprovals() { if (toolApprovals) return toolApprovals; try { toolApprovals = normalizeApprovals(JSON.parse(fs.readFileSync(approvalFile(), 'utf8'))); } catch { toolApprovals = normalizeApprovals({}); } return toolApprovals; }
function saveToolApprovals() { fs.mkdirSync(path.dirname(approvalFile()), { recursive: true }); fs.writeFileSync(approvalFile(), JSON.stringify(loadToolApprovals(), null, 2), { mode: 0o600 }); }
const ragIndex = createRagIndex(path.join(app.getPath('userData'), 'local-index.json'));

function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 800,
    minWidth: 380,
    minHeight: 640,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: true,
    backgroundColor: '#06111e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.once('ready-to-show', showWindow);
  mainWindow.loadFile('index.html');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.on('closed', () => { mainWindow = null; });
}

async function checkJson(url, headers = {}) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  } catch (error) {
    return { error };
  }
}

async function providerStatus() {
  const status = {
    version: APP_VERSION,
    assets: { hasIdleVideo: fs.existsSync(path.join(__dirname, 'assets', 'hologram-idle.mp4')) },
    codex: { state: 'unavailable', label: 'Codex unavailable' },
    openai: { state: 'missing', label: 'OpenAI key missing' },
    grok: { state: 'missing', label: 'Grok key missing' },
    github: { state: 'missing', label: 'GitHub token missing' }
    ,ollama: { state: 'missing', label: 'Ollama unavailable' }
    ,huggingface: { state: 'missing', label: 'Hugging Face endpoint not configured' }
    ,voice: { state: 'cloud', label: 'Voice · cloud transcription' }
  };

  if (fs.existsSync(CODEX_BIN)) {
    try {
      const { stdout } = await execFileAsync(CODEX_BIN, ['--version'], { timeout: 10000 });
      status.codex = { state: 'ready', label: stdout.trim() || 'Codex ready' };
    } catch (error) {
      status.codex = { state: 'error', label: 'Codex could not start' };
    }
  }

  const store = credentials(); store.migrate('openai', 'OPENAI_API_KEY'); store.migrate('xai', 'XAI_API_KEY'); store.migrate('github', 'GITHUB_TOKEN'); status.credentials = store.status();
  const openaiKey = store.get('openai', 'OPENAI_API_KEY');
  if (validSecret(openaiKey, /^sk-[^\s]{12,}$/)) {
    const result = await checkJson('https://api.openai.com/v1/models', {
      Authorization: `Bearer ${openaiKey}`
    });
    status.openai = result.error
      ? { state: 'error', label: 'OpenAI network error' }
      : result.response.ok
        ? { state: 'ready', label: 'OpenAI authenticated' }
        : { state: 'error', label: result.response.status === 401 ? 'OpenAI key invalid' : `OpenAI error ${result.response.status}` };
  }

  const xaiKey = store.get('xai', 'XAI_API_KEY');
  if (validSecret(xaiKey, /^xai-[^\s]{12,}$/)) {
    const result = await checkJson('https://api.x.ai/v1/models', {
      Authorization: `Bearer ${xaiKey}`
    });
    status.grok = result.error
      ? { state: 'error', label: 'Grok network error' }
      : result.response.ok
        ? { state: 'ready', label: 'Grok authenticated' }
        : { state: 'error', label: result.response.status === 401 ? 'Grok key invalid' : `Grok error ${result.response.status}` };
  }

  const githubToken = store.get('github', 'GITHUB_TOKEN');
  if (githubToken) {
    const result = await checkJson('https://api.github.com/user', {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'master-chief-hologram'
    });
    status.github = result.error
      ? { state: 'error', label: 'GitHub network error' }
      : result.response.ok
        ? { state: 'ready', label: `GitHub: ${result.body.login}` }
        : { state: 'error', label: 'GitHub token invalid' };
  }

  const ollamaUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const ollama = await checkJson(`${ollamaUrl}/api/tags`);
  if (!ollama.error && ollama.response.ok) {
    const count = Array.isArray(ollama.body.models) ? ollama.body.models.length : 0;
    status.ollama = { state: 'ready', label: `Ollama · ${count} model${count === 1 ? '' : 's'}` };
  } else if (process.env.OLLAMA_BASE_URL) status.ollama = { state: 'error', label: 'Ollama connection error' };

  const hfUrl = (process.env.HF_BASE_URL || '').replace(/\/$/, '');
  const hfKey = (process.env.HF_API_KEY || '').trim();
  if (hfUrl && hfKey) {
    const hf = await checkJson(`${hfUrl}/models`, { Authorization: `Bearer ${hfKey}` });
    status.huggingface = hf.error ? { state: 'error', label: 'Hugging Face network error' } : hf.response.ok ? { state: 'ready', label: 'Hugging Face endpoint ready' } : { state: 'error', label: `Hugging Face error ${hf.response.status}` };
  }

  const voice = await localWhisperConfig();
  if (voice.ready) status.voice = { state: 'ready', label: `Voice · local whisper.cpp (${path.basename(voice.bin)})`, detail: 'Offline ASR ready.' };
  else if (!voice.bin) status.voice = { state: 'unavailable', label: 'Voice · install whisper.cpp', detail: 'Set WHISPER_CPP_BIN to whisper-cli.' };
  else if (!voice.model) status.voice = { state: 'missing', label: 'Voice · choose a whisper model', detail: 'Set WHISPER_CPP_MODEL to a GGML model file.' };
  else if (!voice.modelExists) status.voice = { state: 'missing', label: 'Voice · whisper model not found', detail: `Model path: ${voice.model}` };
  else if (!voice.ffmpeg) status.voice = { state: 'missing', label: 'Voice · install ffmpeg', detail: 'ffmpeg is required for browser audio conversion.' };
  else status.voice = { state: 'error', label: 'Voice · local ASR unavailable', detail: 'Use cloud transcription or complete local setup.' };

  return status;
}

async function localWhisperConfig() {
  const configuredBin = (process.env.WHISPER_CPP_BIN || '').trim();
  let bin = configuredBin;
  if (!bin) {
    try { bin = (await execFileAsync('which', ['whisper-cli'], { timeout: 3000 })).stdout.trim(); } catch {}
    if (!bin) { try { bin = (await execFileAsync('which', ['main'], { timeout: 3000 })).stdout.trim(); } catch {} }
  }
  const model = (process.env.WHISPER_CPP_MODEL || '').trim();
  let ffmpeg = '';
  try { ffmpeg = (await execFileAsync('which', ['ffmpeg'], { timeout: 3000 })).stdout.trim(); } catch {}
  const binExists = Boolean(bin && fs.existsSync(bin));
  const modelExists = Boolean(model && fs.existsSync(model));
  return { bin: binExists ? bin : '', model, modelExists, ffmpeg: Boolean(ffmpeg && fs.existsSync(ffmpeg)), ready: Boolean(binExists && modelExists && ffmpeg) };
}

async function transcribeWithWhisper(bytes, contentType) {
  const config = await localWhisperConfig();
  if (!config.ready) return null;
  const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'master-chief-voice-'));
  const input = path.join(tempDir, `command.${contentType === 'audio/mp4' ? 'm4a' : contentType === 'audio/ogg' ? 'ogg' : 'webm'}`);
  const wav = path.join(tempDir, 'command.wav');
  try {
    fs.writeFileSync(input, bytes);
    // MediaRecorder generally produces WebM/MP4; use an already-installed ffmpeg only when needed.
    let audioFile = input;
    if (contentType !== 'audio/wav' && contentType !== 'audio/x-wav') {
      try { await execFileAsync('ffmpeg', ['-y', '-i', input, '-ar', '16000', '-ac', '1', '-f', 'wav', wav], { timeout: 30000 }); audioFile = wav; }
      catch { return null; }
    }
    const result = await execFileAsync(config.bin, ['-m', config.model, '-f', audioFile, '--no-prints'], { timeout: 120000, maxBuffer: 1024 * 1024 });
    const text = String(result.stdout || '').replace(/^\s*\[[^\]]+\]\s*/gm, '').trim();
    return text || null;
  } finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
}

// Discover local models without exposing credentials to the renderer. Failure is
// intentionally represented as an empty catalog so the built-in fallback remains usable.
async function modelCatalog() {
  const catalog = { ollama: [], huggingface: [] };
  const ollamaUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const ollama = await checkJson(`${ollamaUrl}/api/tags`);
  if (!ollama.error && ollama.response.ok && Array.isArray(ollama.body.models)) {
    catalog.ollama = ollama.body.models.map(model => String(model.name || model.model || '')).filter(Boolean);
  }
  const configured = (process.env.HF_MODEL || '').trim();
  if (configured) catalog.huggingface.push(configured);
  return catalog;
}

function conversationText(messages) {
  return messages.slice(-16).map(message => {
    const speaker = message.role === 'assistant' ? 'MASTER CHIEF' : 'COMMANDER';
    return `${speaker}: ${String(message.content).slice(0, 8000)}`;
  }).join('\n\n');
}

function runCodex(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(CODEX_BIN, args, { cwd: __dirname, stdio: ['pipe', 'pipe', 'pipe'] });
    activeChild = child;
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Codex timed out after five minutes.'));
    }, 300000);

    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', code => {
      activeChild = null;
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr.trim() || `Codex exited with status ${code}.`));
    });
    child.stdin.end();
  });
}

async function callCodex({ messages, masterMode }) {
  if (!fs.existsSync(CODEX_BIN)) throw new Error('Codex is not installed with the ChatGPT desktop app.');
  const tempDir = fs.mkdtempSync('/tmp/master-chief-codex-');
  const outputFile = path.join(tempDir, 'response.txt');
  const systemPrompt = masterMode ? `You are Master Chief, the user's program-control assistant. Apply Context Manager first, PAPM second, then use cases, specialist routing, implementation, verification, and the upgrade standby. Preserve intent and privacy.` : 'You are a clear, helpful desktop AI assistant.';
  const prompt = `${systemPrompt}\n\nCURRENT CONVERSATION\n${conversationText(messages)}\n\nRespond to the Commander as Master Chief.`;

  try {
    await runCodex([
      'exec', '--ephemeral', '--skip-git-repo-check',
      '--sandbox', 'read-only', '--cd', __dirname,
      '--output-last-message', outputFile, prompt
    ]);
    const reply = fs.readFileSync(outputFile, 'utf8').trim();
    if (!reply) throw new Error('Codex returned an empty response.');
    return { reply, label: 'Codex Desktop' };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function callOpenAI({ messages, masterMode }) {
  const systemPrompt = masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy; route complex work through planning, specialists, implementation, and verification.' : 'You are a clear, helpful desktop AI assistant.';
  const key = credentials().get('openai', 'OPENAI_API_KEY');
  if (!validSecret(key, /^sk-[^\s]{12,}$/)) throw new Error('A valid OPENAI_API_KEY is missing from .env.');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5.6-sol', instructions: systemPrompt,
      input: messages.slice(-16), max_output_tokens: 1600
    }),
    signal: AbortSignal.timeout(300000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || `OpenAI error ${response.status}`);
  const reply = body.output_text || body.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
  if (!reply) throw new Error('OpenAI returned an empty response.');
  return { reply, label: 'OpenAI · GPT-5.6 Sol' };
}

function emitChatEvent(event, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('chat-event', { event, ...payload });
}

async function streamCompatible({ url, key, model, messages, systemPrompt, label, provider }) {
  activeAbortController = new AbortController();
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-16)], stream: true }), signal: activeAbortController.signal });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error?.message || body.error || `${provider} error ${response.status}`); }
  if (!response.body) throw new Error(`${provider} returned no stream.`);
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let reply = '';
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buffer += decoder.decode(value, { stream: true }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() || '';
      for (const line of lines) { const raw = line.trim(); if (!raw.startsWith('data:')) continue; const data = raw.slice(5).trim(); if (data === '[DONE]') continue;
        let json; try { json = JSON.parse(data); } catch { continue; }
        const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text || '';
        if (delta) { reply += delta; emitChatEvent('delta', { delta, provider }); }
      }
    }
  } finally { reader.releaseLock(); activeAbortController = null; }
  if (!reply.trim()) throw new Error(`${provider} returned an empty response.`);
  emitChatEvent('done', { reply, label }); return { reply, label };
}

async function callGrok({ messages, masterMode }) {
  const systemPrompt = masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy; route complex work through planning, specialists, implementation, and verification.' : 'You are a clear, helpful desktop AI assistant.';
  const key = (process.env.XAI_API_KEY || '').trim();
  if (!validSecret(key, /^xai-[^\s]{12,}$/)) throw new Error('A valid XAI_API_KEY has not been added to .env.');
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-16)],
      stream: false, temperature: 0.7
    }),
    signal: AbortSignal.timeout(300000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || `Grok error ${response.status}`);
  const reply = body.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Grok returned an empty response.');
  return { reply, label: 'Grok · xAI' };
}

async function callOllama({ messages, masterMode, model: requestedModel }) {
  const base = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = requestedModel || process.env.OLLAMA_MODEL || 'llama3.2';
  const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.' }, ...messages.slice(-16)], stream: false }), signal: AbortSignal.timeout(300000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Ollama error ${response.status}`);
  const reply = body.message?.content;
  if (!reply) throw new Error('Ollama returned an empty response.');
  return { reply, label: `Ollama · ${model}` };
}

async function callHuggingFace({ messages, masterMode, model: requestedModel }) {
  const base = (process.env.HF_BASE_URL || '').replace(/\/$/, '');
  const key = (process.env.HF_API_KEY || '').trim();
  const model = requestedModel || process.env.HF_MODEL || 'HuggingFaceH4/zephyr-7b-beta';
  if (!base || !key) throw new Error('HF_BASE_URL and HF_API_KEY are missing from .env.');
  const response = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.' }, ...messages.slice(-16)], stream: false }), signal: AbortSignal.timeout(300000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || body.error || `Hugging Face error ${response.status}`);
  const reply = body.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Hugging Face returned an empty response.');
  return { reply, label: `Hugging Face · ${model}` };
}

async function routeChat(payload) {
  payload = validateChatPayload(payload);
  try {
    if (payload.provider === 'codex') return await callCodex(payload);
    if (payload.provider === 'openai') return await callOpenAI(payload);
    if (payload.stream && payload.provider === 'grok') return await streamCompatible({ url: 'https://api.x.ai/v1/chat/completions', key: (process.env.XAI_API_KEY || '').trim(), model: 'grok-3', messages: payload.messages, systemPrompt: payload.masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.', label: 'Grok · xAI', provider: 'Grok' });
    if (payload.stream && payload.provider === 'huggingface') { const base = (process.env.HF_BASE_URL || '').replace(/\/$/, ''); const key = (process.env.HF_API_KEY || '').trim(); if (!base || !key) throw new Error('HF_BASE_URL and HF_API_KEY are missing from .env.'); const model = payload.model || process.env.HF_MODEL || 'HuggingFaceH4/zephyr-7b-beta'; return await streamCompatible({ url: `${base}/chat/completions`, key, model, messages: payload.messages, systemPrompt: payload.masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.', label: `Hugging Face · ${model}`, provider: 'Hugging Face' }); }
    if (payload.stream && payload.provider === 'ollama') { const base = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''); const model = payload.model || process.env.OLLAMA_MODEL || 'llama3.2'; return await streamCompatible({ url: `${base}/v1/chat/completions`, key: 'ollama', model, messages: payload.messages, systemPrompt: payload.masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.', label: `Ollama · ${model}`, provider: 'Ollama' }); }
    if (payload.provider === 'grok') return await callGrok(payload);
    if (payload.provider === 'ollama') return await callOllama(payload);
    if (payload.provider === 'huggingface') return await callHuggingFace(payload);
  } catch (error) {
    throw new Error(safeProviderError(error.message));
  }
  throw new Error('Unknown provider selected.');
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.whenReady().then(() => {
    createWindow();
    // Grant Chromium's microphone request after the window/session exists.
    mainWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      callback(permission === 'media' || permission === 'audioCapture');
    });
    const image = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));
    const trayIcon = image.isEmpty() ? nativeImage.createEmpty() : image.resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    tray.setToolTip(`Master Chief Hologram v${APP_VERSION}`);
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Show Master Chief', click: showWindow },
      { label: 'Hide', click: () => mainWindow?.hide() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]));
    tray.on('click', () => mainWindow?.isVisible() ? mainWindow.hide() : showWindow());
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  showWindow();
});

ipcMain.handle('provider-status', providerStatus);
ipcMain.handle('credential-status', () => credentials().status());
ipcMain.handle('model-catalog', modelCatalog);
ipcMain.handle('voice-self-test', async () => voiceSelfTest(await localWhisperConfig(), {
  name: 'command-reference.webm',
  contentType: 'audio/webm;codecs=opus',
  bytes: 4800,
  expectedTranscript: 'Master Chief, run diagnostics.'
}));
ipcMain.handle('tool-registry', () => getToolRegistry());
ipcMain.handle('tool-approvals', () => ({ approvals: { ...loadToolApprovals() }, registry: getToolRegistry() }));
ipcMain.handle('set-tool-approval', (_event, payload) => { toolApprovals = setToolApproval(loadToolApprovals(), String(payload?.id || ''), payload?.approved); saveToolApprovals(); return { approvals: { ...toolApprovals } }; });
ipcMain.handle('chat', (_event, payload) => routeChat(payload));
ipcMain.handle('cancel-chat', () => { activeAbortController?.abort(); activeAbortController = null; activeChild?.kill('SIGTERM'); emitChatEvent('cancelled', {}); return true; });
ipcMain.handle('transcribe-audio', async (_event, payload) => {
  const bytes = Buffer.from(payload?.audio || []);
  if (!bytes.length) throw new Error('No microphone audio was captured.');
  const contentType = String(payload?.type || 'audio/webm').split(';')[0].toLowerCase();
  const localText = await transcribeWithWhisper(bytes, contentType);
  if (localText) return localText;
  const key = credentials().get('openai', 'OPENAI_API_KEY');
  if (!validSecret(key, /^sk-[^\s]{12,}$/)) throw new Error('Local whisper.cpp is unavailable and voice transcription needs a valid OPENAI_API_KEY in the local .env.');
  const extension = contentType === 'audio/mp4' ? 'm4a' : contentType === 'audio/ogg' ? 'ogg' : 'webm';
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: contentType }), `command.${extension}`);
  form.append('model', 'gpt-4o-mini-transcribe');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(120000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(safeProviderError(body.error?.message || `Transcription error ${response.status}`));
  return String(body.text || '').trim();
});
ipcMain.handle('index-document', (_event, payload) => ragIndex.indexDocument(payload?.name, payload?.text));
ipcMain.handle('search-index', (_event, payload) => ragIndex.search(payload?.query, payload));
ipcMain.handle('index-stats', () => ragIndex.stats());
ipcMain.handle('window-action', (_event, action) => {
  if (action === 'minimize') mainWindow?.minimize();
  if (action === 'hide') mainWindow?.hide();
  if (action === 'toggle-top') {
    const next = !mainWindow?.isAlwaysOnTop();
    mainWindow?.setAlwaysOnTop(next);
    return next;
  }
  return true;
});

if (require.main !== module) module.exports = { validateChatPayload, validateMessages, safeProviderError, validSecret };
