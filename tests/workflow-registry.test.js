'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { createWorkflowRegistry, evaluateWorkflowReadiness } = require('../workflow-registry');
const { cloneAndFillWorkflow } = require('../comfyui-client');

test('registry versions all supported independent media contracts', () => {
  const root = path.resolve(__dirname, '..');
  const registry = createWorkflowRegistry(root);
  for (const contract of ['image', 'revision', 'rebuild', 'upscale', 'control']) {
    const workflow = registry.forKind(contract);
    assert.equal(workflow.contract, contract);
    assert.match(workflow.version, /^\d+\.\d+\.\d+$/);
    assert.match(workflow.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Array.isArray(workflow.requiredNodes));
  }
});

test('OpenPose workflow binds a prepared map and explicit control window', () => {
  const root = path.resolve(__dirname, '..');
  const registry = createWorkflowRegistry(root);
  const definition = registry.forKind('control');
  const result = cloneAndFillWorkflow(require(definition.file), { prompt: 'full body pose', negativePrompt: 'bad hands', sourceImage: 'pose-map.png', checkpoint: 'juggernaut.safetensors', controlnet: 'OpenPoseXL2.safetensors', controlStrength: .85, controlStart: .05, controlEnd: .8, seed: 77 });
  assert.equal(result['4'].inputs.control_net_name, 'OpenPoseXL2.safetensors');
  assert.equal(result['5'].inputs.image, 'pose-map.png');
  assert.deepEqual({ strength: result['6'].inputs.strength, start: result['6'].inputs.start_percent, end: result['6'].inputs.end_percent }, { strength: .85, start: .05, end: .8 });
  assert.equal(result['8'].inputs.seed, 77);
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
  assert.equal(upscale['5'].inputs.scale_by, 0.5);
  assert.deepEqual(upscale['3'].inputs.image, ['5', 0]);
  const image = cloneAndFillWorkflow(require(registry.get('sdxl-image-external-vae-v1').file), { prompt: 'test', negativePrompt: '', checkpoint: 'juggernaut.safetensors', vae: 'sdxl_vae.safetensors' });
  assert.equal(image['10'].inputs.vae_name, 'sdxl_vae.safetensors');
  assert.deepEqual(image['8'].inputs.vae, ['10', 0]);
  assert.equal(registry.get('ultrasharp-upscale-v1').rollbackTarget, 'lanczos-upscale-v1');
  const remacri = cloneAndFillWorkflow(require(registry.get('remacri-upscale-v1').file), { prompt: 'upscale', sourceImage: 'portrait.png', upscaler: '4x_foolhardy_Remacri.pth' });
  assert.equal(remacri['2'].inputs.model_name, '4x_foolhardy_Remacri.pth');
});

test('main process recognizes video and reports its gated readiness precisely', () => {
  const fs = require('node:fs');
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /\['image', 'revision', 'rebuild', 'upscale', 'control', 'faceid', 'canny', 'instantid', 'tile', 'poselora', 'video'\]/);
  assert.match(main, /Video generation is not ready on the Windows worker/);
  assert.doesNotMatch(main, /Media contract must be image, revision, rebuild, or upscale\./);
  assert.match(main, /UNREADY_CHECKPOINTS = new Set\(\['ponyDiffusionV6XL_v6StartWithThisOne\.safetensors'\]\)/);
});

test('workflow readiness requires every declared node and model', () => {
  const workflows = [{ id: 'ready', enabled: true, requiredNodes: ['LoadImage'], requiredModels: ['checkpoint:sdxl', 'vae:sdxl_vae.safetensors'] }, { id: 'blocked', enabled: true, requiredNodes: ['MissingNode'], requiredModels: ['upscaler:missing.pth'] }];
  const result = evaluateWorkflowReadiness(workflows, ['LoadImage'], { checkpoints: ['Juggernaut-XL_v9.safetensors'], vaes: ['sdxl_vae.safetensors'], upscalers: [] });
  assert.equal(result[0].readiness, 'ready');
  assert.equal(result[1].readiness, 'blocked');
  assert.deepEqual(result[1].missingNodes, ['MissingNode']);
  assert.deepEqual(result[1].missingModels, ['upscaler:missing.pth']);
});

test('FaceID workflow binds identity controls without rewriting prompts', () => {
  const registry = createWorkflowRegistry(path.resolve(__dirname, '..'));
  const definition = registry.get('sdxl-faceid-plus-v2');
  const result = cloneAndFillWorkflow(require(definition.file), { prompt: 'exact identity prompt', negativePrompt: 'exact negative', sourceImage: 'face.png', checkpoint: 'juggernaut.safetensors', referenceStrength: .82, faceIdV2Strength: 1.1, faceIdLoraStrength: .65, controlStart: .05, controlEnd: .9, width: 512, height: 512, batch: 1 });
  assert.equal(result['13'].inputs.weight, .82);
  assert.equal(result['13'].inputs.weight_faceidv2, 1.1);
  assert.equal(result['11'].inputs.lora_strength, .65);
  assert.equal(result['6'].inputs.text, 'exact identity prompt');
});

test('Canny and InstantID workflows bind installed structure controls', () => {
  const registry = createWorkflowRegistry(path.resolve(__dirname, '..'));
  const canny = cloneAndFillWorkflow(require(registry.get('sdxl-canny-control-v1').file), { prompt: 'edge prompt', negativePrompt: 'blur', sourceImage: 'source.png', checkpoint: 'model.safetensors', cannyLow: .2, cannyHigh: .7, controlStrength: .8 });
  assert.deepEqual({ low: canny['6'].inputs.low_threshold, high: canny['6'].inputs.high_threshold, model: canny['4'].inputs.control_net_name }, { low: .2, high: .7, model: 'sdxl-canny.safetensors' });
  const instant = cloneAndFillWorkflow(require(registry.get('sdxl-instantid-v1').file), { prompt: 'identity prompt', negativePrompt: 'duplicate', sourceImage: 'face.png', checkpoint: 'model.safetensors', referenceStrength: .9, instantIdControlStrength: .7, instantIdNoise: .1 });
  assert.deepEqual({ identity: instant['8'].inputs.ip_weight, keypoints: instant['8'].inputs.cn_strength, noise: instant['8'].inputs.noise }, { identity: .9, keypoints: .7, noise: .1 });
});

test('Tile and OpenPose Control-LoRA workflows bind their exact installed models', () => {
  const registry = createWorkflowRegistry(path.resolve(__dirname, '..'));
  const tile = cloneAndFillWorkflow(require(registry.get('sdxl-tile-control-v1').file), { prompt: 'detail pass', negativePrompt: 'blur', sourceImage: 'source.png', checkpoint: 'model.safetensors', controlStrength: .55 });
  const pose = cloneAndFillWorkflow(require(registry.get('sdxl-openpose-lora-v1').file), { prompt: 'pose pass', negativePrompt: 'bad anatomy', sourceImage: 'pose.png', checkpoint: 'model.safetensors', controlStrength: .8 });
  assert.equal(tile['4'].inputs.control_net_name, 'sdxl-tile.safetensors');
  assert.equal(pose['4'].inputs.control_net_name, 'control-lora-openposeXL2-rank256.safetensors');
});
