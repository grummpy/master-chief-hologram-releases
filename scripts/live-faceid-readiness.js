'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createComfyUiClient, cloneAndFillWorkflow } = require('../comfyui-client');
const { createWorkflowRegistry } = require('../workflow-registry');

(async () => {
  const root = path.resolve(__dirname, '..');
  const source = process.argv[2] || fs.readdirSync(path.join(root, 'artifacts', 'generated')).filter(name => /\.png$/i.test(name))[0];
  const sourcePath = path.isAbsolute(source) ? source : path.join(root, 'artifacts', 'generated', source);
  if (!fs.existsSync(sourcePath)) throw new Error('A local face reference image is required.');
  const client = createComfyUiClient({ baseUrl: process.env.COMFYUI_BASE_URL || 'http://192.168.4.31:8188', artifactDir: path.join(root, 'artifacts', 'faceid-readiness') });
  const capabilities = await client.capabilities();
  for (const node of ['IPAdapterUnifiedLoaderFaceID','IPAdapterInsightFaceLoader','IPAdapterFaceID']) if (!capabilities.availableNodes.includes(node)) throw new Error(`Missing live node: ${node}`);
  const [adapters, loras, vision] = await Promise.all([client.modelNames('ipadapter'), client.modelNames('loras'), client.modelNames('clip_vision')]);
  if (!adapters.some(name => /faceid-plusv2.*sdxl/i.test(name)) || !loras.some(name => /faceid-plusv2.*sdxl/i.test(name)) || !vision.length) throw new Error('FaceID model bundle is incomplete.');
  const uploaded = await client.uploadImage(sourcePath, `faceid-readiness-${Date.now()}.png`);
  const definition = createWorkflowRegistry(root).get('sdxl-faceid-plus-v2');
  const workflow = cloneAndFillWorkflow(require(definition.file), { prompt: 'professional studio portrait of the same adult subject, neutral expression, soft cyan rim light, detailed photography', negativePrompt: 'blur, distorted face, duplicate subject', sourceImage: uploaded.name, checkpoint: 'Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors', referenceStrength: .75, faceIdV2Strength: 1, faceIdLoraStrength: .6, steps: 20, cfg: 5.5, width: 512, height: 512, batch: 1 });
  const queued = await client.submit(workflow);
  const history = await client.wait(queued.promptId);
  const artifacts = await client.download(history, queued.promptId);
  await client.freeMemory().catch(() => null);
  if (!artifacts.length) throw new Error('FaceID returned no artifact.');
  process.stdout.write(`${JSON.stringify({ ready: true, promptId: queued.promptId, workflow: definition.id, workflowSha256: definition.sha256, source: path.basename(sourcePath), artifacts }, null, 2)}\n`);
})().catch(error => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
