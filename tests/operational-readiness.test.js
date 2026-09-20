'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { summarizeReadiness } = require('../operational-readiness');

function set(states = {}) {
  const weights = [20, 10, 15, 10, 10, 10, 15, 5, 5];
  return weights.map((weight, index) => ({ id: `check-${index}`, label: `Check ${index}`, weight, state: states[index] || 'ready', evidence: 'verified', repair: 'repair it' }));
}

test('operational gate requires 90 points and no failed check', () => {
  assert.deepEqual(summarizeReadiness(set()).score, 100);
  assert.equal(summarizeReadiness(set()).status, 'READY');
  const warning = summarizeReadiness(set({ 1: 'warning' }));
  assert.equal(warning.score, 95);
  assert.equal(warning.status, 'READY');
  const failed = summarizeReadiness(set({ 8: 'error' }));
  assert.equal(failed.score, 95);
  assert.equal(failed.status, 'DEGRADED');
});

test('operational gate rejects malformed weights and strips repair text from ready checks', () => {
  const report = summarizeReadiness(set());
  assert.equal(report.checks[0].repair, '');
  assert.throws(() => summarizeReadiness([{ id: 'bad', weight: 10, state: 'ready' }]), /total 100/);
});
