const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
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

let mainWindow;
let tray;
let activeChild = null;

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
  };

  if (fs.existsSync(CODEX_BIN)) {
    try {
      const { stdout } = await execFileAsync(CODEX_BIN, ['--version'], { timeout: 10000 });
      status.codex = { state: 'ready', label: stdout.trim() || 'Codex ready' };
    } catch (error) {
      status.codex = { state: 'error', label: 'Codex could not start' };
    }
  }

  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (openaiKey) {
    const result = await checkJson('https://api.openai.com/v1/models', {
      Authorization: `Bearer ${openaiKey}`
    });
    status.openai = result.error
      ? { state: 'error', label: 'OpenAI network error' }
      : result.response.ok
        ? { state: 'ready', label: 'OpenAI authenticated' }
        : { state: 'error', label: result.response.status === 401 ? 'OpenAI key invalid' : `OpenAI error ${result.response.status}` };
  }

  const xaiKey = (process.env.XAI_API_KEY || '').trim();
  if (xaiKey.startsWith('xai-') && xaiKey.length > 20) {
    const result = await checkJson('https://api.x.ai/v1/models', {
      Authorization: `Bearer ${xaiKey}`
    });
    status.grok = result.error
      ? { state: 'error', label: 'Grok network error' }
      : result.response.ok
        ? { state: 'ready', label: 'Grok authenticated' }
        : { state: 'error', label: result.response.status === 401 ? 'Grok key invalid' : `Grok error ${result.response.status}` };
  }

  const githubToken = (process.env.GITHUB_TOKEN || '').trim();
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

  return status;
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
  const key = (process.env.OPENAI_API_KEY || '').trim();
  if (!key) throw new Error('OPENAI_API_KEY is missing from .env.');
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

async function callGrok({ messages, masterMode }) {
  const systemPrompt = masterMode ? 'You are Master Chief, a program-control assistant. Preserve intent and privacy; route complex work through planning, specialists, implementation, and verification.' : 'You are a clear, helpful desktop AI assistant.';
  const key = (process.env.XAI_API_KEY || '').trim();
  if (!key.startsWith('xai-') || key.length < 20) throw new Error('A valid XAI_API_KEY has not been added to .env.');
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

async function routeChat(payload) {
  if (!payload || !['codex', 'openai', 'grok'].includes(payload.provider) || !Array.isArray(payload.messages) || payload.messages.length > 24) throw new Error('Invalid command request.');
  if (payload.provider === 'codex') return callCodex(payload);
  if (payload.provider === 'openai') return callOpenAI(payload);
  if (payload.provider === 'grok') return callGrok(payload);
  throw new Error('Unknown provider selected.');
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.whenReady().then(() => {
    createWindow();
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
ipcMain.handle('chat', (_event, payload) => routeChat(payload));
ipcMain.handle('cancel-chat', () => { activeChild?.kill('SIGTERM'); return true; });
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
