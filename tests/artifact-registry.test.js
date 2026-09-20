'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { INDEX_NAME, readIndex, recordArtifact } = require('../artifact-registry');

test('artifact provenance is atomic, private, and preserves revision lineage', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'master-chief-artifact-registry-'));
  try {
    const saved = recordArtifact(directory, { filename: 'forecast.xlsx', bytes: 42, sha256: 'a'.repeat(64) }, { kind: 'spreadsheet', request: 'Make an Excel forecast', parentArtifact: 'baseline.xlsx' });
    assert.equal(saved.kind, 'spreadsheet'); assert.equal(saved.parentArtifact, 'baseline.xlsx');
    assert.equal(readIndex(directory)['forecast.xlsx'].request, 'Make an Excel forecast');
    assert.equal(fs.statSync(path.join(directory, INDEX_NAME)).mode & 0o777, 0o600);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
