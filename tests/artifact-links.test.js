const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { safeArtifactPath } = require('../artifact-links');
const root = path.resolve('/tmp/master-chief-artifacts');
test('artifact links remain inside explicit repository artifact roots', () => {
  assert.equal(safeArtifactPath(root, 'docs/PLAN.md'), path.join(root, 'docs/PLAN.md'));
  assert.equal(safeArtifactPath(root, '../.env'), null);
  assert.equal(safeArtifactPath(root, 'assets/icon.png'), null);
  assert.equal(safeArtifactPath(root, 'docs/../../secret.txt'), null);
});
