'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('repository requires direct owner approval for new content controls', () => {
  const policy = fs.readFileSync(path.resolve(__dirname, '..', 'AGENTS.md'), 'utf8');
  assert.match(policy, /direct and explicit approval/);
  assert.match(policy, /prompt\s+rewriting/);
  assert.match(policy, /automatic negative-prompt injection/);
  assert.match(policy, /Provider policies remain the provider's\s+responsibility/);
});
