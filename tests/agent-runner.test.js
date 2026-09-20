'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { validatePlan, runAgentPlan } = require('../agent-runner');

test('agent plan rejects unknown tools and excessive steps', () => {
  assert.throws(() => validatePlan({ steps: [{ tool: 'shell.anything' }] }, ['diagnostics.local_runtime']), /unavailable/);
  assert.throws(() => validatePlan({ steps: Array.from({ length: 25 }, () => ({ tool: 'safe' })) }, ['safe']), /24-step/);
});

test('agent plan enforces underlying approval and runs in order', async () => {
  const seen = [];
  const report = await runAgentPlan({ steps: [{ id: 'a', tool: 'safe', input: { value: 1 } }, { id: 'b', tool: 'safe', input: { value: 2 } }] }, {
    knownTools: ['safe'], approved: () => true, execute: async (_tool, input) => { seen.push(input.value); return input.value * 2; }
  });
  assert.deepEqual(seen, [1, 2]);
  assert.equal(report.steps[1].result, 4);
  await assert.rejects(() => runAgentPlan({ steps: [{ tool: 'safe' }] }, { knownTools: ['safe'], approved: () => false, execute: async () => null }), /Approval/);
});

test('agent plan resumes after durable receipts without repeating completed tools', async () => {
  const seen = []; const checkpoints = [];
  const report = await runAgentPlan({ idempotencyKey: 'mission', steps: [{ id: 'a', tool: 'safe' }, { id: 'b', tool: 'safe' }] }, {
    knownTools: ['safe'], approved: () => true, resume: { cursor: 1, receipts: [{ id: 'a', tool: 'safe', idempotencyKey: 'mission:a', result: 'kept', verification: { pass: true } }] },
    execute: async (_tool, _input, context) => { seen.push(context.idempotencyKey); return 'new'; }, onCheckpoint: checkpoint => checkpoints.push(checkpoint)
  });
  assert.deepEqual(seen, ['mission:b']); assert.equal(report.steps[0].result, 'kept'); assert.equal(report.steps[1].result, 'new'); assert.equal(checkpoints[0].cursor, 2);
  await assert.rejects(() => runAgentPlan({ steps: [{ id: 'a', tool: 'safe' }] }, { knownTools: ['safe'], approved: () => true, execute: async () => null, resume: { cursor: 1, receipts: [] } }), /receipts/);
});
