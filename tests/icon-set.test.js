const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
test('launcher icon export set has every required macOS size', () => assert.match(execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'validate-icon-set.js')], { encoding: 'utf8' }), /icon audit passed/));
