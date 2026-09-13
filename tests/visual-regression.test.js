const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
test('approved hologram assets and visual state contract remain intact', () => {
  const output = execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'validate-visual-regression.js')], { encoding: 'utf8' });
  assert.match(output, /visual regression validation passed/);
});
