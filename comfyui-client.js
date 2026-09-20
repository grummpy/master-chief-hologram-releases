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

function assertNegativePrompt(value) {
  const prompt = String(value || '');
  if (prompt.length > 4000) throw new Error('Negative media prompt exceeds the 4,000 character limit.');
  return prompt;
}

function cloneAndFillWorkflow(template, values) {
  const replacements = new Map([
    ['{{PROMPT}}', assertPrompt(values.prompt)],
    ['{{NEGATIVE_PROMPT}}', assertNegativePrompt(values.negativePrompt)],
    ['{{SEED}}', Number.isSafeInteger(values.seed) ? values.seed : crypto.randomInt(1, 2147483646)],
    ['{{DENOISE}}', Number.isFinite(values.revisionStrength) ? Math.min(0.99, Math.max(0.2, values.revisionStrength)) : 0.68],
    ['{{SCALE_BY}}', Number.isFinite(values.scaleBy) ? Math.min(4, Math.max(1, values.scaleBy)) : 2],
    ['{{CHECKPOINT}}', String(values.checkpoint || 'sd_xl_base_1.0.safetensors')],
    ['{{VAE}}', String(values.vae || 'sdxl_vae.safetensors')],
    ['{{UPSCALER}}', String(values.upscaler || '4x-UltraSharp.pth')],
    ['{{SOURCE_IMAGE}}', String(values.sourceImage || '')],
    ['{{STEPS}}', Number.isFinite(values.steps) ? Math.min(100, Math.max(1, Math.round(values.steps))) : 28],
    ['{{CFG}}', Number.isFinite(values.cfg) ? Math.min(30, Math.max(0, values.cfg)) : 6.5],
    ['{{SAMPLER}}', String(values.sampler || 'dpmpp_2m')],
    ['{{SCHEDULER}}', String(values.scheduler || 'karras')],
    ['{{WIDTH}}', Number.isFinite(values.width) ? Math.min(2048, Math.max(256, Math.round(values.width / 8) * 8)) : 768],
    ['{{HEIGHT}}', Number.isFinite(values.height) ? Math.min(2048, Math.max(256, Math.round(values.height / 8) * 8)) : 1024],
    ['{{BATCH}}', Number.isFinite(values.batch) ? Math.min(8, Math.max(1, Math.round(values.batch))) : 1]
  ]);
  function replace(value) {
    if (typeof value === 'string' && replacements.has(value)) return replacements.get(value);
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item)]));
    return value;
  }
  const workflow = replace(template);
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
    const timeout = AbortSignal.timeout(limit);
    const signal = options.signal && typeof AbortSignal.any === 'function' ? AbortSignal.any([options.signal, timeout]) : (options.signal || timeout);
    const response = await fetchImpl(`${base}${relative}`, { ...options, signal });
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
    async checkpoints() {
      const response = await request('/models/checkpoints', {}, 10000);
      const body = await response.json();
      return Array.isArray(body) ? body.map(String) : [];
    },
    async modelNames(category) {
      const allowed = new Set(['checkpoints', 'vae', 'upscale_models']);
      if (!allowed.has(category)) throw new Error('Unsupported ComfyUI model category.');
      const response = await request(`/models/${category}`, {}, 10000);
      const body = await response.json();
      return (Array.isArray(body) ? body : []).slice(0, 100).map(value => String(value).slice(0, 240));
    },
    async runtimeStatus() {
      const [statsResponse, queueResponse, checkpointsResponse] = await Promise.all([
        request('/system_stats', {}, 10000), request('/queue', {}, 10000), request('/models/checkpoints', {}, 10000)
      ]);
      const [stats, queue, checkpointBody] = await Promise.all([statsResponse.json(), queueResponse.json(), checkpointsResponse.json()]);
      const boundedText = (value, fallback = 'unknown') => String(value || fallback).slice(0, 240);
      return {
        system: {
          os: boundedText(stats.system?.os),
          comfyuiVersion: boundedText(stats.system?.comfyui_version),
          pythonVersion: boundedText(stats.system?.python_version),
          pytorchVersion: boundedText(stats.system?.pytorch_version),
          ramTotal: Number(stats.system?.ram_total || 0), ramFree: Number(stats.system?.ram_free || 0)
        },
        devices: (Array.isArray(stats.devices) ? stats.devices : []).slice(0, 8).map(device => ({
          name: boundedText(device.name, 'Unknown device'), type: boundedText(device.type),
          vramTotal: Number(device.vram_total || 0), vramFree: Number(device.vram_free || 0)
        })),
        queue: {
          running: Array.isArray(queue.queue_running) ? queue.queue_running.length : 0,
          pending: Array.isArray(queue.queue_pending) ? queue.queue_pending.length : 0
        },
        checkpoints: (Array.isArray(checkpointBody) ? checkpointBody : []).slice(0, 100).map(name => boundedText(name, 'Unnamed checkpoint'))
      };
    },
    async submit(workflow, clientId = crypto.randomUUID()) {
      const response = await request('/prompt', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: clientId })
      }, 15000);
      const body = await response.json();
      if (!body.prompt_id) throw new Error('ComfyUI did not return a prompt ID.');
      return { promptId: String(body.prompt_id), clientId };
    },
    async wait(promptId, { pollMs = 1000, signal, onPoll } = {}) {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        if (signal?.aborted) throw signal.reason || new Error('Media job cancelled.');
        try {
          const response = await request(`/history/${encodeURIComponent(promptId)}`, { signal }, 10000);
          const body = await response.json();
          const item = body[promptId];
          if (item) return item;
        } catch (error) {
          if (signal?.aborted) throw signal.reason || error;
          // AMD model loads and upscale kernels can briefly occupy ComfyUI's
          // event loop. A single poll timeout is not evidence that the durable
          // queued job failed; keep retrying inside the overall job deadline.
        }
        if (onPoll) await onPoll(Date.now() - started);
        await new Promise(resolve => setTimeout(resolve, pollMs));
      }
      throw new Error('ComfyUI job timed out.');
    },
    async download(history, promptId, { signal } = {}) {
      fs.mkdirSync(outputRoot, { recursive: true, mode: 0o700 });
      const artifacts = [];
      for (const output of Object.values(history.outputs || {})) {
        const files = [...(output.images || []), ...(output.gifs || []), ...(output.videos || []), ...(output.audio || []), ...(output.audios || [])];
        for (const item of files) {
          const params = new URLSearchParams({ filename: item.filename, subfolder: item.subfolder || '', type: item.type || 'output' });
          if (signal?.aborted) throw signal.reason || new Error('Media job cancelled.');
          const response = await request(`/view?${params.toString()}`, { signal }, 120000);
          const bytes = Buffer.from(await response.arrayBuffer());
          if (!bytes.length || bytes.length > 1024 * 1024 * 1024) throw new Error('ComfyUI output is empty or exceeds the 1 GB limit.');
          const filename = `${promptId}-${safeOutputName(item.filename)}`;
          const destination = path.join(outputRoot, filename);
          fs.writeFileSync(destination, bytes, { mode: 0o600 });
          artifacts.push({ path: destination, filename, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
        }
      }
      return artifacts;
    },
    async uploadImage(filePath, filename = path.basename(filePath)) {
      const bytes = fs.readFileSync(filePath);
      if (!bytes.length || bytes.length > 100 * 1024 * 1024) throw new Error('Revision source must be between 1 byte and 100 MB.');
      const safeName = safeOutputName(filename);
      const boundary = `----MasterChief${crypto.randomBytes(12).toString('hex')}`;
      const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${safeName}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
      const fields = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n--${boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([head, bytes, fields]);
      const response = await request('/upload/image', { method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': String(body.length) }, body }, 120000);
      const result = await response.json();
      if (!result.name) throw new Error('ComfyUI did not accept the revision source image.');
      return result;
    },
    async freeMemory() {
      await request('/free', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unload_models: true, free_memory: true }) }, 30000);
      return true;
    },
    async cancel(promptId) {
      await request('/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delete: [String(promptId)] }) }, 10000).catch(() => null);
      await request('/interrupt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }, 10000).catch(() => null);
      return true;
    }
  };
}

module.exports = { normalizeBaseUrl, assertPrompt, assertNegativePrompt, cloneAndFillWorkflow, createComfyUiClient };
