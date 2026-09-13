const test = require('node:test');
const assert = require('node:assert/strict');
const { suggestions } = require('../autocomplete');
test('local autocomplete is deterministic and requires no provider', () => {
  assert.deepEqual(suggestions('run voice'), ['Run voice self-test']);
  assert.deepEqual(suggestions(''), ['Check system readiness', 'Run voice self-test', 'Create a PAPM plan for ', 'Create a local AI plan for ', 'Create a graphics and 3D plan for ']);
  assert.deepEqual(suggestions('not a command'), []);
});
