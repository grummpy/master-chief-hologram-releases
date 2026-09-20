'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { createWorkflowRegistry, evaluateWorkflowReadiness } = require('../workflow-registry');
const { cloneAndFillWorkflow } = require('../comfyui-client');

test('registry versions all supported independent media contracts', () => {
  const root = path.resolve(__dirname, '..');
  const registry = createWorkflowRegistry(root);
  for (const contract of ['image', 'revision', 'rebuild', 'upscale', 'control', 'posemap']) {
    const workflow = registry.forKind(contract);
    assert.equal(workflow.contract, contract);
    assert.match(workflow.version, /^\d+\.\d+\.\d+$/);
    assert.match(workflow.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Array.isArray(workflow.requiredNodes));
  }
});

test('pose-map workflow binds the reference photo to the live DWPose extractor', () => {
  const registry = createWorkflowRegistry(path.resolve(__dirname, '..'));
  const definition = registry.forKind('posemap');
  const result = cloneAndFillWorkflow(require(definition.file), { prompt: 'Prepared DWPose map', sourceImage: 'reference-photo.jpg' });
  assert.equal(result['1'].inputs.image, 'reference-photo.jpg');
  assert.equal(result['2'].class_type, 'DWPreprocessor');
  assert.equal(result['2'].inputs.detect_body, 'enable');
  assert.equal(definition.rollbackTarget, null);
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
  assert.match(main, /\['image', 'revision', 'rebuild', 'upscale', 'control', 'faceid', 'canny', 'depth', 'instantid', 'hybridid', 'tile', 'poselora', 'posemap', 'video'\]/);
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

test('WAN 2.1 video workflow binds bounded motion controls and official model bundle', () => {
  const root = path.resolve(__dirname, '..');
  const registry = createWorkflowRegistry(root);
  const definition = registry.get('wan21-t2v-1.3b-v1');
  const result = cloneAndFillWorkflow(require(definition.file), { prompt: 'cinematic ocean motion', negativePrompt: 'flicker', seed: 7, steps: 20, cfg: 6, sampler: 'uni_pc', scheduler: 'simple', width: 848, height: 480, frameCount: 33, fps: 16 });
  assert.equal(result['1'].inputs.unet_name, 'wan2.1_t2v_1.3B_fp16.safetensors');
  assert.equal(result['2'].inputs.clip_name, 'umt5_xxl_fp8_e4m3fn_scaled.safetensors');
  assert.equal(result['3'].inputs.vae_name, 'wan_2.1_vae.safetensors');
  assert.equal(result['6'].inputs.length, 33);
  assert.equal(result['10'].inputs.fps, 16);
  assert.equal(result['11'].inputs.format, 'mp4');
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

test('hybrid identity workflow layers FaceID Plus v2 before InstantID', () => {
  const registry = createWorkflowRegistry(path.resolve(__dirname, '..'));
  const definition = registry.get('sdxl-hybrid-identity-v1');
  const result = cloneAndFillWorkflow(require(definition.file), { prompt: 'same adult face', negativePrompt: 'blur', sourceImage: 'face.png', checkpoint: 'model.safetensors', referenceStrength: .85, faceIdV2Strength: 1.05, faceIdLoraStrength: .45, instantIdControlStrength: .78, instantIdNoise: 0 });
  assert.deepEqual({ faceModel: result['7'].inputs.model, instantModel: result['11'].inputs.model, faceWeight: result['7'].inputs.weight_faceidv2, keypoints: result['11'].inputs.cn_strength }, { faceModel: ['5', 0], instantModel: ['7', 0], faceWeight: 1.05, keypoints: .78 });
});

test('FLUX Dev workflow binds the installed local model bundle and safe controls', () => {
  const registry = createWorkflowRegistry(path.resolve(__dirname, '..'));
  const definition = registry.get('flux1-dev-fp8-image-v1');
  const result = cloneAndFillWorkflow(require(definition.file), { prompt: 'exact flux prompt', negativePrompt: 'preserved in job metadata', seed: 42, steps: 20, cfg: 3.5, sampler: 'euler', scheduler: 'simple', width: 768, height: 1024, batch: 1, vae: 'ae.safetensors', diffusionModel: 'flux1-dev-fp8.safetensors', clipL: 'clip_l.safetensors', t5xxl: 't5xxl_fp8_e4m3fn.safetensors' });
  assert.equal(result['1'].inputs.unet_name, 'flux1-dev-fp8.safetensors');
  assert.equal(result['2'].inputs.type, 'flux');
  assert.equal(result['3'].inputs.vae_name, 'ae.safetensors');
  assert.equal(result['4'].inputs.text, 'exact flux prompt');
  assert.equal(result['5'].inputs.guidance, 3.5);
  assert.equal(result['6'].inputs.batch_size, 1);
});

test('depth workflow extracts depth before applying the installed SDXL control model', () => {
  const registry = createWorkflowRegistry(path.resolve(__dirname, '..'));
  const definition = registry.get('sdxl-depth-control-v1');
  const result = cloneAndFillWorkflow(require(definition.file), { prompt: 'new scene', negativePrompt: 'blur', sourceImage: 'source.png', checkpoint: 'juggernaut.safetensors', controlStrength: .7, controlStart: .05, controlEnd: .9 });
  assert.equal(result['4'].inputs.control_net_name, 'sdxl-depth.safetensors');
  assert.equal(result['6'].class_type, 'DepthAnythingV2Preprocessor');
  assert.deepEqual(result['7'].inputs.image, ['6', 0]);
});
