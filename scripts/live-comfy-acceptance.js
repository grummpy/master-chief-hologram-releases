'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createComfyUiClient, cloneAndFillWorkflow } = require('../comfyui-client');
const { createMediaJobLedger } = require('../media-job-ledger');
const { createWorkflowRegistry } = require('../workflow-registry');

async function main() {
  const baseUrl = process.env.COMFYUI_BASE_URL || 'http://192.168.4.31:8188';
  const count = Math.min(20, Math.max(1, Number(process.argv[2]) || 20));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'master-chief-live-acceptance-'));
  const artifactDir = path.join(root, 'artifacts');
  const ledger = createMediaJobLedger(path.join(root, 'media-jobs.json'));
  const registry = createWorkflowRegistry(path.resolve(__dirname, '..'));
  const client = createComfyUiClient({ baseUrl, artifactDir, timeoutMs: 10 * 60 * 1000 });
  const checkpoints = await client.checkpoints();
  const checkpoint = checkpoints.find(name => /juggernaut.*xl/i.test(name)) || checkpoints.find(name => /sd.?xl/i.test(name));
  if (!checkpoint) throw new Error('No compatible SDXL checkpoint is installed.');
  let prior = null;
  const started = Date.now();
  try {
    for (let index = 0; index < count; index += 1) {
      const revision = index === count - 1 && prior;
      const contract = revision ? 'revision' : 'image';
      const definition = registry.forKind(contract);
      const requestId = crypto.randomUUID();
      const prompt = revision ? 'A clearly different solid cobalt-blue abstract composition, no prior colors' : `Acceptance image ${index + 1}: simple colored geometric sphere on a plain background`;
      const payload = { requestId, sessionId: 'live-acceptance', kind: contract, prompt, negativePrompt: '', checkpoint, seed: 9000 + index, sampler: 'euler', scheduler: 'normal', steps: 2, cfg: 4, width: 512, height: 512, batch: 1, sourceArtifact: revision ? prior.path : null, revisionStrength: 0.99 };
      ledger.create(payload, { parentRequestId: revision ? prior.requestId : null, parentRevision: revision ? prior.path : null });
      ledger.update(requestId, { status: 'loading', stage: 'load', progress: 10, workflow: { id: definition.id, version: definition.version, sha256: definition.sha256 } });
      let sourceImage = '';
      if (revision) {
        const uploaded = await client.uploadImage(prior.absolutePath, `acceptance-source-${index}.png`);
        sourceImage = uploaded.name;
      }
      const template = JSON.parse(fs.readFileSync(definition.file, 'utf8'));
      const workflow = cloneAndFillWorkflow(template, { ...payload, sourceImage });
      const queued = await client.submit(workflow, requestId);
      ledger.update(requestId, { status: 'generating', stage: 'generate', progress: 40, promptId: queued.promptId });
      const history = await client.wait(queued.promptId);
      ledger.update(requestId, { status: 'saving', stage: 'save', progress: 70 });
      ledger.update(requestId, { status: 'transferring', stage: 'transfer', progress: 82 });
      const outputs = await client.download(history, queued.promptId);
      if (outputs.length !== 1) throw new Error(`Job ${index + 1} returned ${outputs.length} outputs; expected one.`);
      const artifacts = outputs.map(item => ({ ...item, path: `artifacts/generated/${item.filename}` }));
      ledger.update(requestId, { status: 'archiving', stage: 'archive', progress: 95, artifacts });
      ledger.update(requestId, { status: 'completed', stage: 'complete', progress: 100, artifacts });
      if (revision && outputs[0].sha256 === prior.sha256) throw new Error('Revision output hash did not change.');
      prior = { ...outputs[0], absolutePath: outputs[0].path, path: artifacts[0].path, requestId };
      process.stdout.write(`PASS ${index + 1}/${count} ${contract} ${queued.promptId} ${outputs[0].sha256.slice(0, 12)}\n`);
    }
    const jobs = ledger.list(count + 5);
    if (jobs.length !== count || jobs.some(job => job.status !== 'completed' || job.artifacts.length !== 1)) throw new Error('Ledger acceptance count did not match completed artifacts.');
    const final = jobs[0];
    if (count > 1 && (!final.parentRequestId || !final.parentRevision)) throw new Error('Final revision lineage is missing.');
    process.stdout.write(`${JSON.stringify({ outcome: 'PASS', jobs: count, checkpoint, revisionChanged: count > 1, durationMs: Date.now() - started }, null, 2)}\n`);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

main().catch(error => { process.stderr.write(`FAIL ${error.stack || error.message}\n`); process.exitCode = 1; });
