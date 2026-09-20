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
