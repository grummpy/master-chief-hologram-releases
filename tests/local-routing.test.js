const test = require('node:test');
const assert = require('node:assert/strict');
const { chooseDefaultProvider } = require('../local-routing');
test('local Ollama is the default whenever it is healthy', () => {
  assert.equal(chooseDefaultProvider({ ollama: { state: 'ready' }, codex: { state: 'ready' } }), 'ollama');
  assert.equal(chooseDefaultProvider({ ollama: { state: 'ready' }, codex: { state: 'ready' } }, 'codex'), 'codex');
  assert.equal(chooseDefaultProvider({ ollama: { state: 'missing' }, codex: { state: 'ready' } }), 'codex');
});
