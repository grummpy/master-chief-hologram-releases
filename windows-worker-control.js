'use strict';

const path = require('node:path');
const { normalizeBaseUrl } = require('./comfyui-client');

const ACTIONS = new Set(['Status', 'Start', 'Stop', 'Restart']);

function privateHost(baseUrl) {
  return new URL(normalizeBaseUrl(baseUrl)).hostname;
}

function parseStatus(output) {
  const text = String(output || '');
  const value = label => text.match(new RegExp(`^${label}\\s*:\\s*(.*)$`, 'mi'))?.[1]?.trim() || '';
  return {
    taskInstalled: /^True$/i.test(value('TaskInstalled')),
    taskState: value('TaskState').slice(0, 80) || 'Unknown',
    processIds: value('ProcessIds').split(',').map(item => item.trim()).filter(item => /^\d+$/.test(item)).slice(0, 16),
    apiHealthy: /^True$/i.test(value('ApiHealthy'))
  };
}

function createWindowsWorkerControl({ baseUrl, homeDir, execFile, user = 'decke' }) {
  if (typeof execFile !== 'function') throw new Error('A fixed-command executor is required.');
  if (!/^[a-zA-Z0-9._-]{1,64}$/.test(user)) throw new Error('Windows SSH user is invalid.');
  const host = privateHost(baseUrl);
  const keyPath = path.join(homeDir, '.ssh', 'master-chief-windows_ed25519');
  const target = `${user}@${host}`;
  async function run(action) {
    if (!ACTIONS.has(action)) throw new Error('Unsupported Windows worker action.');
    const remoteCommand = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"& \\\"$env:USERPROFILE\\Downloads\\manage-comfyui-worker.ps1\\\" -Action ${action}\"`;
    const args = ['-i', keyPath, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '-o', 'StrictHostKeyChecking=yes', target, remoteCommand];
    const result = await execFile('/usr/bin/ssh', args, { timeout: action === 'Status' ? 20000 : 90000, maxBuffer: 512 * 1024, windowsHide: true });
    return { action, host, user, status: parseStatus(String(result.stdout || '').slice(0, 12000)) };
  }
  return { host, user, status: () => run('Status'), start: () => run('Start'), stop: () => run('Stop'), restart: () => run('Restart') };
}

module.exports = { createWindowsWorkerControl, privateHost, parseStatus };
