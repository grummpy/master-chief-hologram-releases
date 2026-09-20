'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createComfyUiClient, cloneAndFillWorkflow } = require('../comfyui-client');
const { createWorkflowRegistry } = require('../workflow-registry');

async function main() {
  const source = path.resolve(process.argv[2] || '');
  if (!source || !fs.existsSync(source)) throw new Error('Pass a local PNG pose-map fixture path. A regular image may validate graph execution but is not a semantic pose test.');
  const root = path.resolve(__dirname, '..');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-openpose-live-'));
  const client = createComfyUiClient({ baseUrl: process.env.COMFYUI_BASE_URL || 'http://192.168.4.31:8188', artifactDir: output, timeoutMs: 10 * 60 * 1000 });
  const registry = createWorkflowRegistry(root);
  const definition = registry.forKind('control');
  const checkpoint = (await client.checkpoints()).find(name => /juggernaut.*xl/i.test(name));
  if (!checkpoint) throw new Error('Juggernaut XL is not installed.');
  const uploaded = await client.uploadImage(source, `openpose-readiness-${Date.now()}${path.extname(source) || '.png'}`);
  const workflow = cloneAndFillWorkflow(JSON.parse(fs.readFileSync(definition.file, 'utf8')), {
    prompt: 'full body studio portrait, coherent anatomy', negativePrompt: 'extra limbs, malformed hands',
    sourceImage: uploaded.name, checkpoint, controlnet: 'OpenPoseXL2.safetensors', controlStrength: .8,
    controlStart: 0, controlEnd: .8, seed: 1250, sampler: 'euler', scheduler: 'normal', steps: 2, cfg: 4, width: 512, height: 512, batch: 1
  });
  const requestId = crypto.randomUUID();
  const queued = await client.submit(workflow, requestId);
  const history = await client.wait(queued.promptId);
  const artifacts = await client.download(history, queued.promptId);
  if (artifacts.length !== 1) throw new Error(`Expected one output; received ${artifacts.length}.`);
  process.stdout.write(`${JSON.stringify({ outcome: 'PASS', semanticPoseTest: false, promptId: queued.promptId, workflow: definition.id, checkpoint, artifact: artifacts[0] }, null, 2)}\n`);
}

main().catch(error => { process.stderr.write(`FAIL ${error.stack || error.message}\n`); process.exitCode = 1; });
