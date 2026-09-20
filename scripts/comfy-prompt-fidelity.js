'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createComfyUiClient, cloneAndFillWorkflow } = require('../comfyui-client');
const { createWorkflowRegistry } = require('../workflow-registry');

async function main() {
  const root = path.resolve(__dirname, '..');
  const baseUrl = process.env.COMFYUI_BASE_URL || 'http://192.168.4.31:8188';
  const outputDir = path.join(root, 'artifacts', 'prompt-fidelity');
  const client = createComfyUiClient({ baseUrl, artifactDir: outputDir, timeoutMs: 12 * 60 * 1000 });
  const checkpoints = await client.checkpoints();
  const checkpoint = checkpoints.find(name => /juggernaut.*xl/i.test(name)) || checkpoints.find(name => /sd.?xl/i.test(name));
  if (!checkpoint) throw new Error('No compatible SDXL checkpoint is installed.');
  const prompt = process.env.FIDELITY_PROMPT || [
    'clearly adult 25-year-old gothic fashion model',
    'ornate black lace Lolita-inspired couture dress with structured corset bodice and layered asymmetric skirt',
    'confident theatrical seated pose on a carved dark velvet chaise, one boot planted and one leg elegantly extended',
    'both hands fully visible with natural fingers, direct intense eye contact, composed provocative attitude',
    'luxury neo-gothic studio interior, cyan rim light, warm low key light, controlled haze',
    'full-body three-quarter composition, 50mm lens, eye-level camera, shallow depth of field',
    'photorealistic editorial fashion photography, realistic fabric texture, precise lace detail, coherent anatomy'
  ].join(', ');
  const negativePrompt = process.env.FIDELITY_NEGATIVE || [
    'child, teenager, youthful face, school uniform',
    'nudity, exposed genitals, explicit sexual activity',
    'extra fingers, missing fingers, fused hands, extra limbs, malformed anatomy, duplicate person',
    'cropped feet, cropped hands, distorted face, crossed eyes, low resolution, blur, text, watermark'
  ].join(', ');
  const definition = createWorkflowRegistry(root).get('sdxl-image-external-vae-v1');
  const template = JSON.parse(fs.readFileSync(definition.file, 'utf8'));
  const requestId = crypto.randomUUID();
  const settings = {
    prompt, negativePrompt, checkpoint, vae: 'sdxl_vae.safetensors', seed: 240925,
    sampler: 'dpmpp_2m_sde', scheduler: 'karras', steps: 32, cfg: 6.5,
    width: 832, height: 1216, batch: 1
  };
  const workflow = cloneAndFillWorkflow(template, settings);
  const queued = await client.submit(workflow, requestId);
  process.stdout.write(`QUEUED ${queued.promptId}\n`);
  const history = await client.wait(queued.promptId, { onPoll: elapsed => {
    if (Math.floor(elapsed / 15000) !== Math.floor((elapsed - 1000) / 15000)) process.stdout.write(`WAITING ${Math.round(elapsed / 1000)}s\n`);
  } });
  const artifacts = await client.download(history, queued.promptId);
  if (artifacts.length !== 1) throw new Error(`Expected one output, received ${artifacts.length}.`);
  const manifest = {
    test: 'prompt-fidelity-v1', requestId, promptId: queued.promptId, checkpoint,
    workflow: { id: definition.id, version: definition.version, sha256: definition.sha256 },
    settings, artifact: artifacts[0], completedAt: new Date().toISOString()
  };
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(outputDir, `${queued.promptId}.json`), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch(error => { process.stderr.write(`FAIL ${error.stack || error.message}\n`); process.exitCode = 1; });
