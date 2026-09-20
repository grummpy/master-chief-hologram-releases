'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { requestedPages, blocksFromMarkdown, createDocxArtifact } = require('../document-generator');

test('document requests detect page counts and preserve structured content', () => {
  assert.equal(requestedPages('Build a two-page report'), 2);
  assert.equal(requestedPages('Create a 3 page memo'), 3);
  assert.deepEqual(blocksFromMarkdown('# Title\n- Capability\n[PAGE BREAK]\n## Next'), [
    { heading: 1, text: 'Title' }, { bullet: true, text: 'Capability' }, { pageBreak: true }, { heading: 2, text: 'Next' }
  ]);
});

test('creates a valid downloadable docx artifact', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-chief-docx-'));
  try {
    const result = await createDocxArtifact({ outputDir, title: 'Capability Report', markdown: '# Capability Report\nSummary\n## Details\nUseful content.', pages: 2 });
    const bytes = fs.readFileSync(result.filePath);
    assert.equal(path.extname(result.filePath), '.docx');
    assert.equal(bytes.subarray(0, 2).toString(), 'PK');
    assert.equal(result.sha256.length, 64);
  } finally { fs.rmSync(outputDir, { recursive: true, force: true }); }
});
