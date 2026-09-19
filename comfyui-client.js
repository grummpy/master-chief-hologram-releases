'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALLOWED_PROTOCOLS = new Set(['http:']);
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

function normalizeBaseUrl(value) {
  const url = new URL(String(value || ''));
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) throw new Error('ComfyUI must use an HTTP URL on the private network.');
  if (url.username || url.password || url.search || url.hash) throw new Error('ComfyUI URL must not contain credentials, query parameters, or fragments.');
  const host = url.hostname.toLowerCase();
  const privateHost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') ||
    /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (!privateHost) throw new Error('ComfyUI must use localhost, a .local name, or a private IPv4 address.');
  return url.toString().replace(/\/$/, '');
}

function assertPrompt(value) {
  const prompt = String(value || '').trim();
  if (!prompt) throw new Error('A media prompt is required.');
  if (prompt.length > 4000) throw new Error('Media prompt exceeds the 4,000 character limit.');
  return prompt;
}

function cloneAndFillWorkflow(template, values) {
  const serialized = JSON.stringify(template);
  const replacements = {
    '{{PROMPT}}': assertPrompt(values.prompt),
    '{{NEGATIVE_PROMPT}}': String(values.negativePrompt || '').slice(0, 2000),
    '{{SEED}}': String(Number.isSafeInteger(values.seed) ? values.seed : crypto.randomInt(1, 2147483646))
  };
  let output = serialized;
  for (const [token, value] of Object.entries(replacements)) output = output.split(token).join(value.replaceAll('\\', '\\\\').replaceAll('"', '\\"'));
  const workflow = JSON.parse(output);
  if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) throw new Error('Workflow template must be a ComfyUI API-format object.');
  return workflow;
}

function safeOutputName(value) {
  const name = path.basename(String(value || 'output.bin'));
  if (!name || name === '.' || name === '..') throw new Error('ComfyUI returned an invalid output name.');
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function createComfyUiClient({ baseUrl, fetchImpl = fetch, artifactDir, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const base = normalizeBaseUrl(baseUrl);
  const outputRoot = path.resolve(artifactDir);
  async function request(relative, options = {}, limit = timeoutMs) {
    const response = await fetchImpl(`${base}${relative}`, { ...options, signal: AbortSignal.timeout(limit) });
    if (!response.ok) throw new Error(`ComfyUI request failed (${response.status}).`);
    return response;
  }
  return {
    async health() {
      try {
        const response = await request('/system_stats', {}, 5000);
        const body = await response.json().catch(() => ({}));
        return { state: 'ready', label: 'ComfyUI · local GPU ready', detail: body.system?.os || 'Private LAN worker reachable' };
      } catch (error) {
        return { state: 'error', label: 'ComfyUI · worker unavailable', detail: error.message };
      }
    },
    async submit(workflow, clientId = crypto.randomUUID()) {
      const response = await request('/prompt', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: clientId })
      }, 15000);
      const body = await response.json();
      if (!body.prompt_id) throw new Error('ComfyUI did not return a prompt ID.');
      return { promptId: String(body.prompt_id), clientId };
    },
    async wait(promptId, { pollMs = 1000 } = {}) {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const response = await request(`/history/${encodeURIComponent(promptId)}`, {}, 10000);
        const body = await response.json();
        const item = body[promptId];
        if (item) return item;
        await new Promise(resolve => setTimeout(resolve, pollMs));
      }
      throw new Error('ComfyUI job timed out.');
    },
    async download(history, promptId) {
      fs.mkdirSync(outputRoot, { recursive: true, mode: 0o700 });
      const artifacts = [];
      for (const output of Object.values(history.outputs || {})) {
        const files = [...(output.images || []), ...(output.gifs || []), ...(output.videos || [])];
        for (const item of files) {
          const params = new URLSearchParams({ filename: item.filename, subfolder: item.subfolder || '', type: item.type || 'output' });
          const response = await request(`/view?${params.toString()}`, {}, 120000);
          const bytes = Buffer.from(await response.arrayBuffer());
          if (!bytes.length || bytes.length > 1024 * 1024 * 1024) throw new Error('ComfyUI output is empty or exceeds the 1 GB limit.');
          const filename = `${promptId}-${safeOutputName(item.filename)}`;
          const destination = path.join(outputRoot, filename);
          fs.writeFileSync(destination, bytes, { mode: 0o600 });
          artifacts.push({ path: destination, filename, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
        }
      }
      return artifacts;
    }
  };
}

module.exports = { normalizeBaseUrl, assertPrompt, cloneAndFillWorkflow, createComfyUiClient };
