'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { normalizeBaseUrl, cloneAndFillWorkflow, createComfyUiClient } = require('../comfyui-client');

test('ComfyUI accepts only private HTTP worker URLs', () => {
  assert.equal(normalizeBaseUrl('http://192.168.4.50:8188/'), 'http://192.168.4.50:8188');
  assert.throws(() => normalizeBaseUrl('https://example.com'), /HTTP URL/);
  assert.throws(() => normalizeBaseUrl('http://example.com:8188'), /private/);
  assert.throws(() => normalizeBaseUrl('http://user:pass@127.0.0.1:8188'), /credentials/);
});

test('workflow filling changes only bounded template fields', () => {
  const template = { '1': { class_type: 'Text', inputs: { text: '{{PROMPT}}', negative: '{{NEGATIVE_PROMPT}}', seed: '{{SEED}}' } } };
  const output = cloneAndFillWorkflow(template, { prompt: 'navy "commander"', negativePrompt: 'blur', seed: 42 });
  assert.equal(output['1'].inputs.text, 'navy "commander"');
  assert.equal(output['1'].inputs.negative, 'blur');
  assert.equal(output['1'].inputs.seed, 42);
  assert.equal(template['1'].inputs.text, '{{PROMPT}}');
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
