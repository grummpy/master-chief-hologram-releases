'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { routeLocalModel, classifyWorkload, inspectLocalModel } = require('../local-model-router');

const models = [
  { name: 'nomic-embed-text:latest', size: 3e9, capabilities: ['embedding'], details: { parameter_size: '1B' } },
  { name: 'dolphin3:8b', size: 8e9, capabilities: ['completion'], details: { parameter_size: '8B', quantization_level: 'Q4_K_M' } },
  { name: 'qwen2.5-coder:7b', size: 7e9, capabilities: ['completion', 'tools'], details: { parameter_size: '7B' } },
  { name: 'qwen3-vl:8b', size: 8e9, capabilities: ['completion', 'vision', 'tools'], details: { parameter_size: '8B' } }
];

test('classifies workloads and records local model family characteristics', () => {
  assert.equal(classifyWorkload('debug this TypeScript test'), 'code');
  assert.equal(classifyWorkload('inspect this screenshot'), 'vision');
  assert.equal(inspectLocalModel(models[1]).family, 'dolphin');
  assert.equal(inspectLocalModel(models[0]).chatEligible, false);
});

test('routes code, vision, creative, and agent work to compatible installed families', () => {
  assert.equal(routeLocalModel({ objective: 'write Python tests', models }).model, 'qwen2.5-coder:7b');
  assert.equal(routeLocalModel({ objective: 'analyze this image', models }).model, 'qwen3-vl:8b');
  assert.equal(routeLocalModel({ objective: 'write a creative character story', models }).model, 'dolphin3:8b');
  assert.equal(routeLocalModel({ objective: 'inspect the repository', models, mode: 'agent' }).model, 'qwen3-vl:8b');
});

test('does not send chat to embedding models and explains incompatible explicit fallback', () => {
  const routed = routeLocalModel({ objective: 'answer a question', models, requested: 'nomic-embed-text:latest' });
  assert.notEqual(routed.model, 'nomic-embed-text:latest');
  assert.equal(routed.fallback, true);
  const unavailable = routeLocalModel({ objective: 'use a tool', models: [models[1]], requested: models[1].name, mode: 'agent' });
  assert.equal(unavailable.model, '');
  assert.match(unavailable.reason, /tool-calling/);
});

test('keeps an explicit model selection when it is compatible', () => {
  const routed = routeLocalModel({ objective: 'chat with me', models, requested: 'dolphin3:8b' });
  assert.equal(routed.model, 'dolphin3:8b');
  assert.equal(routed.fallback, false);
});
