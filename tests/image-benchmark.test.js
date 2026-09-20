'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const definition = require('../evaluation/image-benchmark-v1.json');
const { validateBenchmark, scoreBenchmark } = require('../image-benchmark');

test('image benchmark covers the fixed quality suite and totals 100 percent', () => {
  const result = validateBenchmark(definition);
  assert.equal(result.weight, 100); assert.ok(result.caseCount >= 12); assert.equal(result.gate.minimumWeightedScore, 90); assert.equal(result.gate.durabilityJobs, 20);
});

test('image benchmark gate fails below 90 and passes at 90', () => {
  assert.equal(scoreBenchmark(definition, Object.fromEntries(definition.dimensions.map(item => [item.id, 89]))).passed, false);
  assert.equal(scoreBenchmark(definition, Object.fromEntries(definition.dimensions.map(item => [item.id, 90]))).passed, true);
});
