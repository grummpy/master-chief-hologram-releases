'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { createWorkflowRegistry } = require('../workflow-registry');
const { cloneAndFillWorkflow } = require('../comfyui-client');

test('registry versions all four independent media contracts', () => {
  const root = path.resolve(__dirname, '..');
  const registry = createWorkflowRegistry(root);
  for (const contract of ['image', 'revision', 'rebuild', 'upscale']) {
    const workflow = registry.forKind(contract);
    assert.equal(workflow.contract, contract);
    assert.match(workflow.version, /^\d+\.\d+\.\d+$/);
    assert.match(workflow.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Array.isArray(workflow.requiredNodes));
  }
});

test('image workflow receives the recorded operator parameters', () => {
  const root = path.resolve(__dirname, '..');
  const registry = createWorkflowRegistry(root);
  const template = require(registry.forKind('image').file);
  const result = cloneAndFillWorkflow(template, { prompt: 'verbatim positive', negativePrompt: 'verbatim negative', checkpoint: 'chosen.safetensors', seed: 99, sampler: 'euler', scheduler: 'normal', steps: 35, cfg: 8, width: 832, height: 1216, batch: 2 });
  assert.deepEqual(result['3'].inputs, { ...result['3'].inputs, seed: 99, steps: 35, cfg: 8, sampler_name: 'euler', scheduler: 'normal' });
  assert.equal(result['5'].inputs.width, 832);
  assert.equal(result['5'].inputs.height, 1216);
  assert.equal(result['5'].inputs.batch_size, 2);
  assert.equal(result['6'].inputs.text, 'verbatim positive');
  assert.equal(result['7'].inputs.text, 'verbatim negative');
});

test('UltraSharp and external VAE workflows bind only named installed models', () => {
  const root = path.resolve(__dirname, '..');
  const registry = createWorkflowRegistry(root);
  const upscale = cloneAndFillWorkflow(require(registry.get('ultrasharp-upscale-v1').file), { prompt: 'upscale', sourceImage: 'source.png', upscaler: '4x-UltraSharp.pth' });
  assert.equal(upscale['2'].inputs.model_name, '4x-UltraSharp.pth');
  assert.equal(upscale['1'].inputs.image, 'source.png');
  const image = cloneAndFillWorkflow(require(registry.get('sdxl-image-external-vae-v1').file), { prompt: 'test', negativePrompt: '', checkpoint: 'juggernaut.safetensors', vae: 'sdxl_vae.safetensors' });
  assert.equal(image['10'].inputs.vae_name, 'sdxl_vae.safetensors');
  assert.deepEqual(image['8'].inputs.vae, ['10', 0]);
  assert.equal(registry.get('ultrasharp-upscale-v1').rollbackTarget, 'lanczos-upscale-v1');
});

test('main process recognizes video and reports its gated readiness precisely', () => {
  const fs = require('node:fs');
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /\['image', 'revision', 'rebuild', 'upscale', 'video'\]/);
  assert.match(main, /Video generation is not ready on the Windows worker/);
  assert.doesNotMatch(main, /Media contract must be image, revision, rebuild, or upscale\./);
});
