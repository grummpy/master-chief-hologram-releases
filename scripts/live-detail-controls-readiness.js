'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createComfyUiClient, cloneAndFillWorkflow } = require('../comfyui-client');
const { createWorkflowRegistry } = require('../workflow-registry');

(async () => {
  const root = path.resolve(__dirname, '..');
  const generated = path.join(root, 'artifacts', 'generated');
  const sourceName = process.argv[2] || fs.readdirSync(generated).find(name => /\.png$/i.test(name));
  const sourcePath = path.isAbsolute(sourceName) ? sourceName : path.join(generated, sourceName);
  if (!fs.existsSync(sourcePath)) throw new Error('A local reference PNG is required.');
  const client = createComfyUiClient({ baseUrl: process.env.COMFYUI_BASE_URL || 'http://192.168.4.31:8188', artifactDir: path.join(root, 'artifacts', 'detail-readiness') });
  const registry = createWorkflowRegistry(root);
  const uploaded = await client.uploadImage(sourcePath, `detail-readiness-${Date.now()}.png`);
  const common = { prompt: 'professional cinematic armored commander on a futuristic bridge, cyan rim light, detailed photography', negativePrompt: 'blur, duplicate subject, malformed hands', sourceImage: uploaded.name, checkpoint: 'Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors', seed: 12801, steps: 18, cfg: 5.5, sampler: 'dpmpp_2m', scheduler: 'karras', width: 512, height: 512, batch: 1, controlStrength: .65, controlStart: 0, controlEnd: .85 };
  const results = [];
  for (const id of ['sdxl-tile-control-v1', 'sdxl-openpose-lora-v1']) {
    const definition = registry.get(id); const queued = await client.submit(cloneAndFillWorkflow(require(definition.file), common)); const history = await client.wait(queued.promptId); const artifacts = await client.download(history, queued.promptId);
    if (!artifacts.length) throw new Error(`${id} returned no artifact.`);
    results.push({ id, workflowSha256: definition.sha256, promptId: queued.promptId, artifacts }); await client.freeMemory().catch(() => null);
  }
  process.stdout.write(`${JSON.stringify({ ready: true, source: path.basename(sourcePath), results }, null, 2)}\n`);
})().catch(error => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
