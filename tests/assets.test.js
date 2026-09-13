const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

test('release assets and packaging references are deterministic', () => {
  const script = path.join(__dirname, '..', 'scripts', 'validate-assets.js');
  const output = execFileSync(process.execPath, [script], { encoding: 'utf8' });
  assert.match(output, /asset validation passed/);
});
