'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createComfyUiClient, cloneAndFillWorkflow, safeUltraSharpPlan } = require('../comfyui-client');
const { createWorkflowRegistry } = require('../workflow-registry');

(async () => {
  const root = path.resolve(__dirname, '..');
  const source = process.argv[2] || fs.readdirSync(path.join(root, 'artifacts', 'structure-readiness')).find(name => /InstantID.*\.png$/i.test(name));
  const sourcePath = path.isAbsolute(source) ? source : path.join(root, 'artifacts', 'structure-readiness', source);
  if (!fs.existsSync(sourcePath)) throw new Error('A readiness image is required.');
  const client = createComfyUiClient({ baseUrl: process.env.COMFYUI_BASE_URL || 'http://192.168.4.31:8188', artifactDir: path.join(root, 'artifacts', 'upscale-readiness') });
  const definition = createWorkflowRegistry(root).get('remacri-upscale-v1');
  const uploaded = await client.uploadImage(sourcePath, `remacri-readiness-${Date.now()}.png`);
  const plan = safeUltraSharpPlan(512, 512);
  const workflow = cloneAndFillWorkflow(require(definition.file), { prompt: 'upscale', sourceImage: uploaded.name, upscaler: '4x_foolhardy_Remacri.pth', preScale: plan.preScale });
  const queued = await client.submit(workflow); const history = await client.wait(queued.promptId); const artifacts = await client.download(history, queued.promptId); await client.freeMemory().catch(() => null);
  if (!artifacts.length) throw new Error('Remacri returned no artifact.');
  process.stdout.write(`${JSON.stringify({ ready: true, promptId: queued.promptId, workflowSha256: definition.sha256, plan, artifacts }, null, 2)}\n`);
})().catch(error => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
