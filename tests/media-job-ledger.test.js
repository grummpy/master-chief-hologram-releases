'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createMediaJobLedger } = require('../media-job-ledger');

test('durable ledger completes 20 consecutive jobs without loss', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-ledger-'));
  try {
    const file = path.join(root, 'jobs.json');
    const ledger = createMediaJobLedger(file);
    for (let index = 0; index < 20; index += 1) {
      const requestId = `acceptance-${index}`;
      const created = ledger.create({ requestId, sessionId: 'acceptance-session', kind: 'image', prompt: `exact prompt ${index}`, negativePrompt: `exact negative ${index}`, seed: index + 1, sampler: 'dpmpp_2m', scheduler: 'karras', steps: 28, cfg: 6.5, width: 768, height: 1024, batch: 1 });
      assert.equal(created.created, true);
      ledger.update(requestId, { status: 'loading', stage: 'load', progress: 10 });
      ledger.update(requestId, { status: 'generating', stage: 'generate', progress: 40, promptId: `comfy-${index}` });
      ledger.update(requestId, { status: 'saving', stage: 'save', progress: 70 });
      ledger.update(requestId, { status: 'transferring', stage: 'transfer', progress: 82 });
      ledger.update(requestId, { status: 'archiving', stage: 'archive', progress: 95 });
      ledger.update(requestId, { status: 'completed', stage: 'complete', progress: 100, artifacts: [{ path: `artifacts/generated/comfy-${index}-output.png`, filename: `comfy-${index}-output.png`, sha256: 'a'.repeat(64) }] });
    }
    const reopened = createMediaJobLedger(file);
    const jobs = reopened.list(50);
    assert.equal(jobs.length, 20);
    assert.equal(jobs.filter(job => job.status === 'completed').length, 20);
    assert.equal(jobs.every(job => job.artifacts.length === 1 && job.completedAt), true);
    assert.equal(reopened.create({ requestId: 'acceptance-0', prompt: 'different' }).created, false, 'request IDs must be idempotent');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('ledger recovers interrupted work and preserves revision lineage', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-ledger-recovery-'));
  try {
    const ledger = createMediaJobLedger(path.join(root, 'jobs.json'));
    ledger.create({ requestId: 'parent', sessionId: 'session', kind: 'image', prompt: 'source' });
    ledger.update('parent', { status: 'completed', stage: 'complete', progress: 100, artifacts: [{ path: 'artifacts/generated/source.png', sha256: 'b'.repeat(64) }] });
    ledger.create({ requestId: 'revision', sessionId: 'session', kind: 'revision', prompt: 'change helmet', sourceArtifact: 'artifacts/generated/source.png' }, { parentRequestId: 'parent', parentRevision: 'artifacts/generated/source.png' });
    ledger.update('revision', { status: 'generating', stage: 'generate', progress: 40 });
    const recovered = createMediaJobLedger(path.join(root, 'jobs.json'));
    recovered.recoverInterrupted();
    const revision = recovered.get('revision');
    assert.equal(revision.status, 'recoverable');
    assert.equal(revision.parentRequestId, 'parent');
    assert.equal(revision.parentRevision, 'artifacts/generated/source.png');
    const retry = recovered.fork('revision', 'retry').job;
    assert.equal(retry.parentRequestId, 'revision');
    assert.equal(retry.parameters.prompt, 'change helmet');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
