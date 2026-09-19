const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, nativeImage, safeStorage, shell, systemPreferences } = require('electron');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const http = require('http');
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
const SKILL_TAG_ROUTING = 'When the user includes an @skill-name tag, treat it as an explicit request to apply that named specialist to the current prompt. State the selected role and keep it subordinate to the user request, Context Manager, PAPM, permissions, and verification.';
const { validateChatPayload, validateMessages, safeProviderError, validSecret } = require('./security');
const { createCredentialStore } = require('./credential-store');
const { getToolRegistry, normalizeApprovals, setToolApproval, isToolApproved } = require('./tool-registry');
const { createLocalToolExecutor } = require('./local-tool-executor');
const { createRagIndex } = require('./rag-index');
const { safeArtifactPath } = require('./artifact-links');
const { MICROPHONE_SETTINGS_URL, isGranted, recoveryMessage } = require('./microphone-access');
const { voiceSelfTest } = require('./voice-diagnostics');
const { discoverModels, buildVoiceSetup } = require('./voice-installation');
const { loadLocalAiManifest, primaryInstalledModel } = require('./local-ai-manifest');
const { createLocalAiAudit } = require('./local-ai-audit');
const { getConnectorRegistry } = require('./connector-registry');
const { cloneAndFillWorkflow, createComfyUiClient } = require('./comfyui-client');
const { runAgentPlan } = require('./agent-runner');
const localAiManifest = loadLocalAiManifest(path.join(__dirname, 'local-ai-manifest.json'));

let mainWindow;
let tray;
let activeChild = null;
let credentialStore;
function credentials() { return credentialStore || (credentialStore = createCredentialStore({ safeStorage, filePath: path.join(app.getPath('userData'), 'credentials.json') })); }
let activeAbortController = null;
let toolApprovals;
function loadConnectorSettings() {
  try {
    const value = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'connector-settings.json'), 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
const connectorSettings = loadConnectorSettings();
const comfyBaseUrl = String(process.env.COMFYUI_BASE_URL || connectorSettings.comfyuiBaseUrl || '').trim();
const generatedArtifactDir = path.join(app.getPath('userData'), 'artifacts', 'generated');
function generatedRelativePath(filename) { return `artifacts/generated/${path.basename(filename)}`; }
function listGeneratedArtifacts(limit = 50) {
  if (!fs.existsSync(generatedArtifactDir)) return [];
  const supported = /\.(png|jpe?g|webp|gif|avif|bmp|mp4|m4v|mov|webm|ogv|mp3|wav|m4a|aac|ogg|flac)$/i;
  return fs.readdirSync(generatedArtifactDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && supported.test(entry.name))
    .map(entry => {
      const filePath = path.join(generatedArtifactDir, entry.name);
      const stat = fs.statSync(filePath);
      return {
        filename: entry.name,
        path: generatedRelativePath(entry.name),
        bytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        modifiedMs: stat.mtimeMs,
        sha256: require('crypto').createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
      };
    })
    .sort((a, b) => b.modifiedMs - a.modifiedMs)
    .slice(0, Math.min(100, Math.max(1, Number(limit) || 50)));
}
function resolveArtifactPath(relativePath) {
  const value = String(relativePath || '').replace(/\\/g, '/');
  if (value.startsWith('artifacts/generated/')) {
    const target = path.resolve(generatedArtifactDir, value.slice('artifacts/generated/'.length));
    if (target.startsWith(`${path.resolve(generatedArtifactDir)}${path.sep}`) && fs.existsSync(target)) return target;
    const legacy = safeArtifactPath(__dirname, value);
    return legacy && fs.existsSync(legacy) ? legacy : null;
  }
  const target = safeArtifactPath(__dirname, value);
  return target && fs.existsSync(target) ? target : null;
}
function privateHttpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method: options.method || 'GET', headers: options.headers || {}, signal: options.signal }, response => {
      const chunks = [];
      let bytes = 0;
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > 1024 * 1024 * 1024) { request.destroy(new Error('Private worker response exceeded the 1 GB limit.')); return; }
        chunks.push(chunk);
      });
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode || 500, headers: response.headers })));
    });
    request.on('error', reject);
    if (options.body) request.write(options.body);
    request.end();
  });
}
let comfyClient = null;
try { if (comfyBaseUrl) comfyClient = createComfyUiClient({ baseUrl: comfyBaseUrl, artifactDir: generatedArtifactDir, fetchImpl: privateHttpFetch }); } catch { comfyClient = null; }
function approvalFile() { return path.join(app.getPath('userData'), 'tool-approvals.json'); }
function loadToolApprovals() { if (toolApprovals) return toolApprovals; try { toolApprovals = normalizeApprovals(JSON.parse(fs.readFileSync(approvalFile(), 'utf8'))); } catch { toolApprovals = normalizeApprovals({}); } return toolApprovals; }
function saveToolApprovals() { fs.mkdirSync(path.dirname(approvalFile()), { recursive: true }); fs.writeFileSync(approvalFile(), JSON.stringify(loadToolApprovals(), null, 2), { mode: 0o600 }); }
function requireToolApproval(id) {
  if (!isToolApproved(loadToolApprovals(), id)) {
    auditToolEvent({ id, outcome: 'denied', detail: 'approval required' });
    throw new Error(`Approve ${id} in Tool access before using it.`);
  }
}
const ragIndex = createRagIndex(path.join(app.getPath('userData'), 'local-index.json'));
const localTools = createLocalToolExecutor({ appVersion: APP_VERSION, projectDir: __dirname, execFile: execFileAsync });
const localAiAudit = createLocalAiAudit(path.join(app.getPath('userData'), 'local-ai-audit.jsonl'));
function toolAuditFile() { return path.join(app.getPath('userData'), 'tool-audit.jsonl'); }
function microphoneStatus() { try { return process.platform === 'darwin' ? systemPreferences.getMediaAccessStatus('microphone') : 'granted'; } catch { return 'unknown'; } }
async function requestMicrophoneAccess() {
  try {
    let status = microphoneStatus();
    if (status === 'not-determined' && process.platform === 'darwin') { await systemPreferences.askForMediaAccess('microphone'); status = microphoneStatus(); }
    return { status, granted: isGranted(status), recovery: recoveryMessage(status) };
  } catch { return { status: 'unknown', granted: false, recovery: 'Microphone access could not be checked. Open Microphone Settings, enable Master Chief Hologram, then retry.' }; }
}
function auditToolEvent({ id, outcome, detail }) {
  // Keep this operational record small and secret-free: no prompts, files, command
  // arguments, provider credentials, or tool output are written here.
  const event = JSON.stringify({ at: new Date().toISOString(), tool: id, outcome, detail: String(detail || '').slice(0, 160) });
  try {
    fs.mkdirSync(path.dirname(toolAuditFile()), { recursive: true });
    fs.appendFileSync(toolAuditFile(), `${event}\n`, { mode: 0o600 });
    const stat = fs.statSync(toolAuditFile());
    if (stat.size > 256 * 1024) fs.renameSync(toolAuditFile(), `${toolAuditFile()}.previous`);
  } catch { /* Diagnostics must never prevent the app from functioning. */ }
}
async function executeLocalTool(id) {
  const toolId = String(id || '');
  const registered = getToolRegistry().find(tool => tool.id === toolId);
  if (!registered || !localTools.ids.includes(toolId)) {
    auditToolEvent({ id: toolId || 'unknown', outcome: 'denied', detail: 'not allowlisted' });
    throw new Error('This tool is not allowlisted for local execution.');
  }
  if (!isToolApproved(loadToolApprovals(), toolId)) {
    auditToolEvent({ id: toolId, outcome: 'denied', detail: 'approval required' });
    throw new Error('Approve this tool in Tool access before running it.');
  }
  try {
    const report = await localTools.execute(toolId);
    auditToolEvent({ id: toolId, outcome: 'success', detail: 'completed' });
    return report;
  } catch (error) {
    auditToolEvent({ id: toolId, outcome: 'error', detail: error.message });
    throw new Error(safeProviderError(error.message));
  }
}

function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 760,
    minHeight: 600,
    frame: false,
    transparent: false,
    alwaysOnTop: false,
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
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const template = [];
    if (params.isEditable) template.push(
      { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
    );
    else template.push({ role: 'copy', enabled: Boolean(params.selectionText) }, { role: 'selectAll' });
    Menu.buildFromTemplate(template).popup({ window: mainWindow });
  });
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
    ,localAi: { state: 'missing', label: 'Local AI manifest has no installed primary model' }
    ,comfyui: { state: comfyBaseUrl ? 'error' : 'missing', label: comfyBaseUrl ? 'ComfyUI · invalid configuration' : 'ComfyUI · worker not configured', detail: comfyBaseUrl ? 'COMFYUI_BASE_URL must be a private LAN URL.' : 'Add COMFYUI_BASE_URL after the Windows GPU inventory is complete.' }
  };

  const checks = [];
  if (fs.existsSync(CODEX_BIN)) checks.push((async () => {
    try {
      const { stdout } = await execFileAsync(CODEX_BIN, ['--version'], { timeout: 10000 });
      status.codex = { state: 'ready', label: stdout.trim() || 'Codex ready' };
    } catch {
      status.codex = { state: 'error', label: 'Codex could not start' };
    }
  })());

  const store = credentials(); store.migrate('openai', 'OPENAI_API_KEY'); store.migrate('xai', 'XAI_API_KEY'); store.migrate('github', 'GITHUB_TOKEN'); status.credentials = store.status();
  const openaiKey = store.get('openai', 'OPENAI_API_KEY');
  if (validSecret(openaiKey, /^sk-[^\s]{12,}$/)) checks.push((async () => {
    const result = await checkJson('https://api.openai.com/v1/models', {
      Authorization: `Bearer ${openaiKey}`
    });
    status.openai = result.error
      ? { state: 'error', label: 'OpenAI network error' }
      : result.response.ok
        ? { state: 'ready', label: 'OpenAI authenticated' }
        : { state: 'error', label: result.response.status === 401 ? 'OpenAI key invalid' : `OpenAI error ${result.response.status}` };
  })());

  const xaiKey = store.get('xai', 'XAI_API_KEY');
  if (validSecret(xaiKey, /^xai-[^\s]{12,}$/)) checks.push((async () => {
    const result = await checkJson('https://api.x.ai/v1/models', {
      Authorization: `Bearer ${xaiKey}`
    });
    status.grok = result.error
      ? { state: 'error', label: 'Grok network error' }
      : result.response.ok
        ? { state: 'ready', label: 'Grok authenticated' }
        : { state: 'error', label: result.response.status === 401 ? 'Grok key invalid' : `Grok error ${result.response.status}` };
  })());

  const githubToken = store.get('github', 'GITHUB_TOKEN');
  if (githubToken) checks.push((async () => {
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
  })());

  const ollamaUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  checks.push((async () => { const ollama = await checkJson(`${ollamaUrl}/api/tags`);
  if (!ollama.error && ollama.response.ok) {
    const names = Array.isArray(ollama.body.models) ? ollama.body.models.map(model => String(model.name || model.model || '')).filter(Boolean) : [];
    const primary = primaryInstalledModel(localAiManifest, names);
    const count = names.length;
    status.ollama = { state: 'ready', label: primary ? `Ollama · ${primary.id} · local first` : `Ollama · ${count} model${count === 1 ? '' : 's'}` };
    if (primary) status.localAi = { state: 'ready', label: `Local AI · ${primary.tier} · ${primary.id}`, detail: 'Local-only routing; cloud fallback requires explicit selection.' };
  } else if (process.env.OLLAMA_BASE_URL) status.ollama = { state: 'error', label: 'Ollama connection error' }; })());

  const hfUrl = (process.env.HF_BASE_URL || '').replace(/\/$/, '');
  const hfKey = (process.env.HF_API_KEY || '').trim();
  if (hfUrl && hfKey) checks.push((async () => {
    const hf = await checkJson(`${hfUrl}/models`, { Authorization: `Bearer ${hfKey}` });
    status.huggingface = hf.error ? { state: 'error', label: 'Hugging Face network error' } : hf.response.ok ? { state: 'ready', label: 'Hugging Face endpoint ready' } : { state: 'error', label: `Hugging Face error ${hf.response.status}` };
  })());

  checks.push((async () => { const voice = await localWhisperConfig();
  if (voice.ready) status.voice = { state: 'ready', label: `Voice · local whisper.cpp (${path.basename(voice.bin)})`, detail: 'Offline ASR ready.' };
  else if (!voice.bin) status.voice = { state: 'unavailable', label: 'Voice · offline setup required', detail: 'Open Systems and choose Offline voice setup for local installation steps.' };
  else if (!voice.model) status.voice = { state: 'missing', label: 'Voice · choose a whisper model', detail: `Add a GGML model to ${voice.modelDirectory}, or set WHISPER_CPP_MODEL.` };
  else if (!voice.modelExists) status.voice = { state: 'missing', label: 'Voice · whisper model not found', detail: `Model path: ${voice.model}` };
  else if (!voice.ffmpeg) status.voice = { state: 'missing', label: 'Voice · install ffmpeg', detail: 'ffmpeg is required for browser audio conversion.' };
  else status.voice = { state: 'error', label: 'Voice · local ASR unavailable', detail: 'Use cloud transcription or complete local setup.' }; })());
  if (comfyClient) checks.push((async () => { status.comfyui = await comfyClient.health(); })());

  await Promise.allSettled(checks);

  return status;
}

function workflowPath(kind) {
  if (!['image', 'image-revision', 'video'].includes(kind)) throw new Error('Media kind must be image, image revision, or video.');
  if (kind === 'image-revision') return path.resolve(path.join(__dirname, 'workflows', 'image-revision-api.json'));
  const configured = kind === 'image' ? process.env.COMFYUI_IMAGE_WORKFLOW : process.env.COMFYUI_VIDEO_WORKFLOW;
  return path.resolve(configured || path.join(__dirname, 'workflows', `${kind}-api.json`));
}

async function generateLocalMedia(payload) {
  requireToolApproval('media.generate_local');
  if (!comfyClient) throw new Error('ComfyUI is not configured. Add its private-LAN URL to COMFYUI_BASE_URL.');
  const kind = String(payload?.kind || '');
  let workflowKind = kind;
  let sourceImage = '';
  if (kind === 'image' && payload?.sourceArtifact) {
    const localSource = resolveArtifactPath(payload.sourceArtifact);
    if (!localSource || !/\.(png|jpe?g|webp)$/i.test(localSource)) throw new Error('The selected revision source is unavailable or is not a supported image.');
    const uploaded = await comfyClient.uploadImage(localSource, `mc-${Date.now()}-${path.basename(localSource)}`);
    sourceImage = uploaded.subfolder ? `${uploaded.subfolder}/${uploaded.name}` : uploaded.name;
    workflowKind = 'image-revision';
  }
  const source = workflowPath(workflowKind);
  if (!source.startsWith(path.resolve(__dirname) + path.sep) || !fs.existsSync(source)) throw new Error(`Approved ${kind} workflow is missing. Export it in API format to workflows/${kind}-api.json.`);
  const template = JSON.parse(fs.readFileSync(source, 'utf8'));
  const checkpoints = await comfyClient.checkpoints();
  const checkpoint = checkpoints.find(name => /juggernaut.*xl.*v9/i.test(name)) || checkpoints.find(name => /juggernaut.*xl/i.test(name)) || 'sd_xl_base_1.0.safetensors';
  const rawPrompt = String(payload?.prompt || '').replace(/^prompt\s+/i, '').trim();
  const adultTopless = /\b(topless|bare[- ]?breasts?|uncovered (?:breasts?|chest)|nude (?:chest|torso))\b/i.test(rawPrompt);
  const adultDirective = adultTopless
    ? '(clearly adult woman, age 30 or older:1.25), (topless, bare breasts, uncovered chest:1.45), preserve the requested pose and identity exactly. '
    : '';
  const adherencePrompt = `Follow the latest requested subject, clothing state, pose, setting, camera, and style exactly. Latest instructions override conflicting details from the source image. ${adultDirective}${rawPrompt}`;
  const negativePrompt = [
    String(payload?.negativePrompt || ''),
    adultTopless ? 'bra, bikini top, swimsuit top, shirt, blouse, bodysuit covering chest, chest armor, breast covering, censored chest, strategically covered breasts' : ''
  ].filter(Boolean).join(', ');
  const workflow = cloneAndFillWorkflow(template, { ...(payload || {}), prompt: adherencePrompt, negativePrompt, sourceImage, checkpoint });
  const queued = await comfyClient.submit(workflow);
  auditToolEvent({ id: 'media.generate_local', outcome: 'queued', detail: `${kind}:${queued.promptId}` });
  const history = await comfyClient.wait(queued.promptId);
  const artifacts = await comfyClient.download(history, queued.promptId);
  auditToolEvent({ id: 'media.generate_local', outcome: 'success', detail: `${kind}:${artifacts.length} artifact(s)` });
  return { kind, promptId: queued.promptId, sessionId: String(payload?.sessionId || require('crypto').randomUUID()), revised: workflowKind === 'image-revision', artifacts: artifacts.map(item => ({ ...item, path: generatedRelativePath(item.filename) })) };
}

async function executeAgentTool(id, input) {
  if (id === 'diagnostics.local_runtime' || id === 'diagnostics.git_status') return executeLocalTool(id);
  if (id === 'media.generate_local') return generateLocalMedia(input);
  throw new Error('Agent tool is not allowlisted.');
}

async function localWhisperConfig() {
  const configuredBin = (process.env.WHISPER_CPP_BIN || '').trim();
  let bin = configuredBin;
  if (!bin) {
    try { bin = (await execFileAsync('which', ['whisper-cli'], { timeout: 3000 })).stdout.trim(); } catch {}
    if (!bin) for (const candidate of ['/opt/homebrew/bin/whisper-cli', '/usr/local/bin/whisper-cli']) if (fs.existsSync(candidate)) { bin = candidate; break; }
    if (!bin) { try { bin = (await execFileAsync('which', ['main'], { timeout: 3000 })).stdout.trim(); } catch {} }
  }
  const modelDirectory = path.join(app.getPath('userData'), 'voice', 'models');
  const discoveredModels = discoverModels(modelDirectory, { exists: fs.existsSync, readDir: fs.readdirSync });
  const model = (process.env.WHISPER_CPP_MODEL || '').trim() || discoveredModels[0]?.path || '';
  let ffmpeg = '';
  try { ffmpeg = (await execFileAsync('which', ['ffmpeg'], { timeout: 3000 })).stdout.trim(); } catch {}
  if (!ffmpeg) for (const candidate of ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']) if (fs.existsSync(candidate)) { ffmpeg = candidate; break; }
  const binExists = Boolean(bin && fs.existsSync(bin));
  const modelExists = Boolean(model && fs.existsSync(model));
  const ffmpegPath = ffmpeg && fs.existsSync(ffmpeg) ? ffmpeg : '';
  return { bin: binExists ? bin : '', model, modelExists, ffmpeg: ffmpegPath, ready: Boolean(binExists && modelExists && ffmpegPath), modelDirectory, discoveredModels };
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
      try { await execFileAsync(config.ffmpeg, ['-y', '-i', input, '-ar', '16000', '-ac', '1', '-f', 'wav', wav], { timeout: 30000 }); audioFile = wav; }
      catch { return null; }
    }
    const result = await execFileAsync(config.bin, ['-m', config.model, '-f', audioFile, '-np'], { timeout: 120000, maxBuffer: 1024 * 1024 });
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

async function chatFetch(url, options = {}, timeoutMs = 300000) {
  const controller = new AbortController();
  activeAbortController?.abort();
  activeAbortController = controller;
  const timer = setTimeout(() => controller.abort(new Error('Provider request timed out.')), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    if (activeAbortController === controller) activeAbortController = null;
  }
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
  const systemPrompt = masterMode ? `You are Master Chief, the user's program-control assistant. Apply Context Manager first, PAPM second, then use cases, specialist routing, implementation, verification, and the upgrade standby. ${SKILL_TAG_ROUTING} Preserve intent and privacy. Store durable artifacts in this Desktop repository under docs/, artifacts/, or exports/ and cite a local artifact with [label](artifact:docs/file.md). Never claim a file was created unless it exists.` : 'You are a clear, helpful desktop AI assistant.';
  const prompt = `${systemPrompt}\n\nCURRENT CONVERSATION\n${conversationText(messages)}\n\nRespond to the Commander as Master Chief.`;

  try {
    await runCodex([
      'exec', '--ephemeral', '--skip-git-repo-check',
      '--sandbox', masterMode ? 'workspace-write' : 'read-only', '--cd', __dirname,
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
  const systemPrompt = masterMode ? `You are Master Chief, a program-control assistant. ${SKILL_TAG_ROUTING} Preserve intent and privacy; route complex work through planning, specialists, implementation, and verification. Store durable artifacts in docs/, artifacts/, or exports/ and cite existing ones as [label](artifact:docs/file.md).` : 'You are a clear, helpful desktop AI assistant.';
  const key = credentials().get('openai', 'OPENAI_API_KEY');
  if (!validSecret(key, /^sk-[^\s]{12,}$/)) throw new Error('A valid OPENAI_API_KEY is missing from .env.');
  const response = await chatFetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5.6-sol', instructions: systemPrompt,
      input: messages.slice(-16), max_output_tokens: 1600
    })
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
  const systemPrompt = masterMode ? `You are Master Chief, a program-control assistant. ${SKILL_TAG_ROUTING} Preserve intent and privacy; route complex work through planning, specialists, implementation, and verification.` : 'You are a clear, helpful desktop AI assistant.';
  const key = credentials().get('xai', 'XAI_API_KEY');
  if (!validSecret(key, /^xai-[^\s]{12,}$/)) throw new Error('A valid XAI_API_KEY has not been added to .env.');
  const response = await chatFetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-16)],
      stream: false, temperature: 0.7
    })
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
  const response = await chatFetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: masterMode ? `You are Master Chief, a program-control assistant. ${SKILL_TAG_ROUTING} Preserve intent and privacy. When an existing local repository artifact is useful, cite it as [label](artifact:docs/file.md); do not invent file creation.` : 'You are a clear, helpful desktop AI assistant.' }, ...messages.slice(-16)], stream: false }) });
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
  const response = await chatFetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.' }, ...messages.slice(-16)], stream: false }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || body.error || `Hugging Face error ${response.status}`);
  const reply = body.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Hugging Face returned an empty response.');
  return { reply, label: `Hugging Face · ${model}` };
}

async function routeChat(payload) {
  payload = validateChatPayload(payload);
  const startedAt = Date.now();
  try {
    let result;
    if (payload.provider === 'codex') result = await callCodex(payload);
    else if (payload.provider === 'openai') result = await callOpenAI(payload);
    else if (payload.stream && payload.provider === 'grok') result = await streamCompatible({ url: 'https://api.x.ai/v1/chat/completions', key: (process.env.XAI_API_KEY || '').trim(), model: 'grok-3', messages: payload.messages, systemPrompt: payload.masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.', label: 'Grok · xAI', provider: 'Grok' });
    else if (payload.stream && payload.provider === 'huggingface') { const base = (process.env.HF_BASE_URL || '').replace(/\/$/, ''); const key = (process.env.HF_API_KEY || '').trim(); if (!base || !key) throw new Error('HF_BASE_URL and HF_API_KEY are missing from .env.'); const model = payload.model || process.env.HF_MODEL || 'HuggingFaceH4/zephyr-7b-beta'; result = await streamCompatible({ url: `${base}/chat/completions`, key, model, messages: payload.messages, systemPrompt: payload.masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.', label: `Hugging Face · ${model}`, provider: 'Hugging Face' }); }
    else if (payload.stream && payload.provider === 'ollama') { const base = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''); const model = payload.model || process.env.OLLAMA_MODEL || 'llama3.2'; result = await streamCompatible({ url: `${base}/v1/chat/completions`, key: 'ollama', model, messages: payload.messages, systemPrompt: payload.masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy.' : 'You are a clear, helpful desktop AI assistant.', label: `Ollama · ${model}`, provider: 'Ollama' }); }
    else if (payload.provider === 'grok') result = await callGrok(payload);
    else if (payload.provider === 'ollama') result = await callOllama(payload);
    else if (payload.provider === 'huggingface') result = await callHuggingFace(payload);
    if (!result) throw new Error('Unknown provider selected.');
    if (payload.provider === 'ollama') localAiAudit.record({ model: payload.model || process.env.OLLAMA_MODEL || 'default', outcome: 'success', latencyMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    if (payload.provider === 'ollama') localAiAudit.record({ model: payload.model || process.env.OLLAMA_MODEL || 'default', outcome: 'error', latencyMs: Date.now() - startedAt, errorCode: error.name || 'request_failed' });
    throw new Error(safeProviderError(error.message));
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.whenReady().then(() => {
    createWindow();
    // Grant Chromium's microphone request after the window/session exists.
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
      const trusted = webContents === mainWindow.webContents && String(details?.requestingUrl || '').startsWith('file://');
      const mediaTypes = Array.isArray(details?.mediaTypes) ? details.mediaTypes : ['audio'];
      const audioOnly = mediaTypes.includes('audio') && !mediaTypes.includes('video');
      callback(Boolean(trusted && audioOnly && (permission === 'media' || permission === 'audioCapture') && isToolApproved(loadToolApprovals(), 'voice.transcribe_microphone')));
    });
    mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, _origin, details) => {
      const requestingUrl = String(details?.requestingUrl || details?.embeddingOrigin || 'file://');
      return Boolean(webContents === mainWindow.webContents && requestingUrl.startsWith('file://') && (permission === 'media' || permission === 'audioCapture') && isToolApproved(loadToolApprovals(), 'voice.transcribe_microphone'));
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

function trustedIpc(event) {
  const frame = event?.senderFrame;
  return Boolean(mainWindow && event.sender === mainWindow.webContents && frame === mainWindow.webContents.mainFrame && String(frame.url || '').startsWith('file://'));
}
function secureHandle(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!trustedIpc(event)) throw new Error('Untrusted application request blocked.');
    return handler(event, ...args);
  });
}

secureHandle('provider-status', providerStatus);
secureHandle('credential-status', () => credentials().status());
secureHandle('model-catalog', modelCatalog);
secureHandle('connector-status', async () => ({ connectors: getConnectorRegistry(), comfyui: comfyClient ? await comfyClient.health() : { state: 'missing', label: 'ComfyUI · worker not configured' } }));
secureHandle('voice-self-test', async () => voiceSelfTest(await localWhisperConfig(), {
  name: 'command-reference.webm',
  contentType: 'audio/webm;codecs=opus',
  bytes: 4800,
  expectedTranscript: 'Master Chief, run diagnostics.'
}));
secureHandle('voice-setup', async () => buildVoiceSetup(await localWhisperConfig()));
secureHandle('request-microphone-access', () => { requireToolApproval('voice.transcribe_microphone'); return requestMicrophoneAccess(); });
secureHandle('open-microphone-settings', async () => shell.openExternal(MICROPHONE_SETTINGS_URL));
secureHandle('tool-registry', () => getToolRegistry());
secureHandle('tool-approvals', () => ({ approvals: { ...loadToolApprovals() }, registry: getToolRegistry() }));
secureHandle('set-tool-approval', (_event, payload) => { toolApprovals = setToolApproval(loadToolApprovals(), String(payload?.id || ''), payload?.approved); saveToolApprovals(); return { approvals: { ...toolApprovals } }; });
secureHandle('execute-local-tool', (_event, payload) => executeLocalTool(payload?.id));
secureHandle('generate-local-media', (_event, payload) => generateLocalMedia(payload));
secureHandle('list-generated-media', (_event, payload) => listGeneratedArtifacts(payload?.limit));
secureHandle('open-media-archive', async () => {
  fs.mkdirSync(generatedArtifactDir, { recursive: true, mode: 0o700 });
  const result = await shell.openPath(generatedArtifactDir);
  if (result) throw new Error('The generated media archive could not be opened.');
  return { opened: true, path: generatedArtifactDir };
});
secureHandle('clear-creative-session', async () => {
  requireToolApproval('media.generate_local');
  if (!comfyClient) throw new Error('ComfyUI is not configured.');
  await comfyClient.freeMemory();
  auditToolEvent({ id: 'media.generate_local', outcome: 'session-cleared', detail: 'ComfyUI models unloaded and cache release requested' });
  return { cleared: true, localArtifactsPreserved: true, gpuMemoryReleased: true };
});
secureHandle('run-agent-plan', (_event, payload) => {
  requireToolApproval('agents.run_bounded_plan');
  return runAgentPlan(payload, {
    knownTools: ['diagnostics.local_runtime', 'diagnostics.git_status', 'media.generate_local'],
    approved: id => isToolApproved(loadToolApprovals(), id),
    execute: executeAgentTool
  });
});
secureHandle('chat', (_event, payload) => { requireToolApproval('chat.send_to_configured_provider'); return routeChat(payload); });
secureHandle('cancel-chat', () => { activeAbortController?.abort(); activeAbortController = null; activeChild?.kill('SIGTERM'); emitChatEvent('cancelled', {}); return true; });
secureHandle('transcribe-audio', async (_event, payload) => {
  requireToolApproval('voice.transcribe_microphone');
  const bytes = Buffer.from(payload?.audio || []);
  if (!bytes.length) throw new Error('No microphone audio was captured.');
  const contentType = String(payload?.type || 'audio/webm').split(';')[0].toLowerCase();
  if (!['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'].includes(contentType)) throw new Error('Unsupported microphone audio format.');
  if (bytes.length > 12 * 1024 * 1024) throw new Error('Microphone recording is too large (12 MB limit).');
  const localText = await transcribeWithWhisper(bytes, contentType);
  if (localText) return localText;
  throw new Error('Local offline transcription did not return text. Check Systems for local whisper.cpp readiness, then retry; no paid transcription provider was used.');
});
secureHandle('index-document', (_event, payload) => { requireToolApproval('files.attach_local_text'); return ragIndex.indexDocument(payload?.name, payload?.text); });
secureHandle('remove-indexed-document', (_event, payload) => { requireToolApproval('files.attach_local_text'); return ragIndex.removeDocument(payload?.name); });
secureHandle('search-index', (_event, payload) => { requireToolApproval('files.attach_local_text'); return ragIndex.search(payload?.query, payload); });
secureHandle('index-stats', () => ragIndex.stats());
secureHandle('open-artifact', async (_event, relativePath) => {
  const artifactPath = resolveArtifactPath(relativePath);
  if (!artifactPath) throw new Error('That artifact link is unavailable.');
  const result = await shell.openPath(artifactPath);
  if (result) throw new Error('The artifact could not be opened.');
  return true;
});
secureHandle('preview-artifact', (_event, relativePath) => {
  const artifactPath = resolveArtifactPath(relativePath);
  if (!artifactPath) throw new Error('That artifact preview is unavailable.');
  const stat = fs.statSync(artifactPath);
  if (stat.size > 80 * 1024 * 1024) throw new Error('Artifact is too large for inline preview; use Save As or Open instead.');
  const extension = path.extname(artifactPath).toLowerCase();
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.bmp': 'image/bmp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.m4v': 'video/x-m4v', '.mov': 'video/quicktime', '.webm': 'video/webm', '.ogv': 'video/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.flac': 'audio/flac' }[extension];
  if (!mime) return { mime: 'application/octet-stream', previewable: false };
  return { mime, previewable: true, dataUrl: `data:${mime};base64,${fs.readFileSync(artifactPath).toString('base64')}` };
});
secureHandle('save-artifact-as', async (_event, relativePath) => {
  const artifactPath = resolveArtifactPath(relativePath);
  if (!artifactPath) throw new Error('That artifact is unavailable.');
  const result = await dialog.showSaveDialog(mainWindow, { defaultPath: path.join(app.getPath('downloads'), path.basename(artifactPath)) });
  if (result.canceled || !result.filePath) return { saved: false };
  fs.copyFileSync(artifactPath, result.filePath);
  return { saved: true, path: result.filePath };
});
secureHandle('window-action', (_event, action) => {
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
