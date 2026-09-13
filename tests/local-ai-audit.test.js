const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createLocalAiAudit } = require('../local-ai-audit');
test('local AI audit keeps only redacted runtime evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-chief-audit-')); const file = path.join(dir, 'audit.jsonl');
  try { const audit = createLocalAiAudit(file, { now: () => '2026-09-13T00:00:00.000Z' }); const event = audit.record({ model: 'qwen2.5:0.5b', outcome: 'error', latencyMs: 12, errorCode: 'network error: secret-value' }); assert.equal(event.errorCode, 'local_request_failed'); assert.deepEqual(Object.keys(event), ['at', 'runtime', 'model', 'outcome', 'latencyMs', 'errorCode']); assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /prompt|secret-value/i); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
