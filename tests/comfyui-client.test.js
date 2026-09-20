'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { normalizeBaseUrl, cloneAndFillWorkflow, safeUltraSharpPlan, createComfyUiClient } = require('../comfyui-client');

test('ComfyUI accepts only private HTTP worker URLs', () => {
  assert.equal(normalizeBaseUrl('http://192.168.4.50:8188/'), 'http://192.168.4.50:8188');
  assert.throws(() => normalizeBaseUrl('https://example.com'), /HTTP URL/);
  assert.throws(() => normalizeBaseUrl('http://example.com:8188'), /private/);
  assert.throws(() => normalizeBaseUrl('http://user:pass@127.0.0.1:8188'), /credentials/);
});

test('workflow filling changes only bounded template fields', () => {
  const template = { '1': { class_type: 'Text', inputs: { text: '{{PROMPT}}', negative: '{{NEGATIVE_PROMPT}}', seed: '{{SEED}}', image: '{{SOURCE_IMAGE}}', denoise: '{{DENOISE}}' } } };
  const output = cloneAndFillWorkflow(template, { prompt: 'navy "commander"', negativePrompt: 'blur', seed: 42, sourceImage: 'revision.png', revisionStrength: 0.84 });
  assert.equal(output['1'].inputs.text, 'navy "commander"');
  assert.equal(output['1'].inputs.negative, 'blur');
  assert.equal(output['1'].inputs.seed, 42);
  assert.equal(output['1'].inputs.image, 'revision.png');
  assert.equal(output['1'].inputs.denoise, 0.84);
  assert.equal(template['1'].inputs.text, '{{PROMPT}}');
});

test('prompt fields remain verbatim and reject overflow instead of truncating', () => {
  const template = { '1': { inputs: { text: '{{PROMPT}}', negative: '{{NEGATIVE_PROMPT}}' } } };
  const output = cloneAndFillWorkflow(template, { prompt: 'prompt keep this prefix', negativePrompt: '  keep negative spacing  ' });
  assert.equal(output['1'].inputs.text, 'prompt keep this prefix');
  assert.equal(output['1'].inputs.negative, '  keep negative spacing  ');
  assert.throws(() => cloneAndFillWorkflow(template, { prompt: 'valid', negativePrompt: 'x'.repeat(4001) }), /4,000/);
});

test('revision strength supports a near-total redraw when explicitly requested', () => {
  const template = { '1': { inputs: { denoise: '{{DENOISE}}' } } };
  assert.equal(cloneAndFillWorkflow(template, { prompt: 'adult portrait', revisionStrength: 0.98 })['1'].inputs.denoise, 0.98);
  assert.equal(cloneAndFillWorkflow(template, { prompt: 'adult portrait', revisionStrength: 2 })['1'].inputs.denoise, 0.99);
});

test('upscale contract clamps scale to the supported app range', () => {
  const template = { '1': { inputs: { scale_by: '{{SCALE_BY}}' } } };
  assert.equal(cloneAndFillWorkflow(template, { prompt: 'upscale', scaleBy: 2 })['1'].inputs.scale_by, 2);
  assert.equal(cloneAndFillWorkflow(template, { prompt: 'upscale', scaleBy: 12 })['1'].inputs.scale_by, 4);
});

test('UltraSharp safety plan targets 2x and bounds the longest output edge', () => {
  assert.deepEqual(safeUltraSharpPlan(768, 1024), { preScale: 0.5, sourceWidth: 768, sourceHeight: 1024, outputWidth: 1536, outputHeight: 2048, maxOutputEdge: 2048 });
  const large = safeUltraSharpPlan(2048, 1536);
  assert.equal(large.preScale, 0.25);
  assert.deepEqual([large.outputWidth, large.outputHeight], [2048, 1536]);
  assert.throws(() => safeUltraSharpPlan(0, 0), /dimensions/);
});

test('client uploads revision context and requests GPU cache release', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith('/upload/image')) return new Response(JSON.stringify({ name: 'revision.png', type: 'input' }), { status: 200 });
    if (url.endsWith('/free') || url.endsWith('/queue') || url.endsWith('/interrupt')) return new Response('{}', { status: 200 });
    return new Response('', { status: 404 });
  };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-comfy-session-'));
  const source = path.join(root, 'source.png');
  fs.writeFileSync(source, 'fixture-image');
  try {
    const client = createComfyUiClient({ baseUrl: 'http://127.0.0.1:8188', artifactDir: root, fetchImpl, timeoutMs: 1000 });
    assert.equal((await client.uploadImage(source)).name, 'revision.png');
    assert.equal(await client.freeMemory(), true);
    assert.equal(await client.cancel('prompt-1'), true);
    assert.match(calls[0].options.headers['Content-Type'], /^multipart\/form-data; boundary=/);
    assert.deepEqual(JSON.parse(calls[1].options.body), { unload_models: true, free_memory: true });
    assert.deepEqual(JSON.parse(calls[2].options.body), { delete: ['prompt-1'] });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('client queues, polls, and hashes a fixture artifact', async () => {
  const calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    if (url.endsWith('/system_stats')) return new Response(JSON.stringify({ system: { os: 'Windows' } }), { status: 200 });
    if (url.endsWith('/prompt')) return new Response(JSON.stringify({ prompt_id: 'job-1' }), { status: 200 });
    if (url.endsWith('/history/job-1')) return new Response(JSON.stringify({ 'job-1': { outputs: { '9': { images: [{ filename: 'result.png', type: 'output' }] } } } }), { status: 200 });
    if (url.includes('/view?')) return new Response(Buffer.from('fixture-image'), { status: 200 });
    return new Response('', { status: 404 });
  };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-comfy-'));
  try {
    const client = createComfyUiClient({ baseUrl: 'http://127.0.0.1:8188', artifactDir: root, fetchImpl, timeoutMs: 1000 });
    assert.equal((await client.health()).state, 'ready');
    const queued = await client.submit({});
    const history = await client.wait(queued.promptId, { pollMs: 1 });
    const artifacts = await client.download(history, queued.promptId);
    assert.equal(artifacts.length, 1);
    assert.equal(fs.readFileSync(artifacts[0].path, 'utf8'), 'fixture-image');
    assert.match(artifacts[0].sha256, /^[a-f0-9]{64}$/);
    assert.ok(calls.some(url => url.includes('/view?')));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('history polling survives a transient worker timeout inside the job deadline', async () => {
  let polls = 0;
  const client = createComfyUiClient({ baseUrl: 'http://127.0.0.1:8188', artifactDir: os.tmpdir(), timeoutMs: 1000, fetchImpl: async url => {
    if (!url.includes('/history/')) return new Response('', { status: 404 });
    polls += 1;
    if (polls === 1) throw new DOMException('timed out', 'TimeoutError');
    return new Response(JSON.stringify({ prompt: { outputs: {} } }), { status: 200 });
  } });
  assert.deepEqual(await client.wait('prompt', { pollMs: 1 }), { outputs: {} });
  assert.equal(polls, 2);
});

test('runtime status reports bounded worker, queue, device, and checkpoint evidence', async () => {
  const fetchImpl = async url => {
    if (url.endsWith('/system_stats')) return new Response(JSON.stringify({ system: { os: 'win32', comfyui_version: '0.36.0', python_version: '3.13', pytorch_version: '2.13+rocm', ram_total: 16, ram_free: 8 }, devices: [{ name: 'AMD GPU', type: 'cuda', vram_total: 17, vram_free: 9 }] }), { status: 200 });
    if (url.endsWith('/queue')) return new Response(JSON.stringify({ queue_running: [['one']], queue_pending: [['two'], ['three']] }), { status: 200 });
    if (url.endsWith('/models/checkpoints')) return new Response(JSON.stringify(['sdxl.safetensors']), { status: 200 });
    return new Response('', { status: 404 });
  };
  const client = createComfyUiClient({ baseUrl: 'http://127.0.0.1:8188', artifactDir: os.tmpdir(), fetchImpl, timeoutMs: 1000 });
  const status = await client.runtimeStatus();
  assert.equal(status.system.comfyuiVersion, '0.36.0');
  assert.deepEqual(status.queue, { running: 1, pending: 2 });
  assert.equal(status.devices[0].name, 'AMD GPU');
  assert.deepEqual(status.checkpoints, ['sdxl.safetensors']);
});

test('model catalog permits only bounded known ComfyUI categories', async () => {
  const client = createComfyUiClient({ baseUrl: 'http://127.0.0.1:8188', artifactDir: os.tmpdir(), fetchImpl: async url => new Response(JSON.stringify(url.endsWith('/models/vae') ? ['sdxl_vae.safetensors'] : ['4x-UltraSharp.pth']), { status: 200 }), timeoutMs: 1000 });
  assert.deepEqual(await client.modelNames('vae'), ['sdxl_vae.safetensors']);
  assert.deepEqual(await client.modelNames('upscale_models'), ['4x-UltraSharp.pth']);
  await assert.rejects(() => client.modelNames('../custom_nodes'), /Unsupported/);
});
