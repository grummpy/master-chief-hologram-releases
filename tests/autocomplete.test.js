const test = require('node:test');
const assert = require('node:assert/strict');
const { suggestions } = require('../autocomplete');
test('local autocomplete is deterministic and requires no provider', () => {
  assert.deepEqual(suggestions('run voice'), ['Run voice self-test']);
  assert.deepEqual(suggestions(''), []);
  assert.deepEqual(suggestions('not a command'), []);
});

test('slash commands and skill routes are offered locally', () => {
  assert.deepEqual(suggestions('/'), ['/image ', '/video ', '/revise ', '/agent diagnostics']);
  assert.deepEqual(suggestions('@pap'), ['@papm ']);
});
