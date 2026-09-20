'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { getConnectorRegistry, withConnectorState } = require('../connector-registry');

test('connector catalog distinguishes local-free from explicitly selected cloud routes', () => {
  const connectors = getConnectorRegistry();
  assert.equal(connectors.find(item => item.id === 'ollama.local').costClass, 'local-free');
  assert.equal(connectors.find(item => item.id === 'comfyui.local').costClass, 'local-free');
  assert.equal(connectors.find(item => item.id === 'codex.desktop').costClass, 'selected-cloud-plan');
  assert.equal(connectors.find(item => item.id === 'openai.responses').costClass, 'provider-billed');
});

test('connector health merges runtime evidence without losing declared capabilities', () => {
  const result = withConnectorState({ 'ollama.local': { state: 'ready', label: 'Ollama ready' } });
  const ollama = result.find(item => item.id === 'ollama.local');
  assert.equal(ollama.status.state, 'ready');
  assert.ok(ollama.capabilities.includes('tools'));
});
