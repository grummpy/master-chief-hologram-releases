'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createSpreadsheet, createPresentation, createCodeArtifact } = require('../productivity-artifacts');

test('creates valid Excel, PowerPoint, Python, and R artifacts', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-chief-productivity-'));
  try {
    const excel = await createSpreadsheet({ outputDir, spec: { title: 'Forecast', sheets: [{ name: 'Data', columns: ['Year', 'Value'], rows: [[2026, 42], [2027, 45]] }] } });
    const deck = await createPresentation({ outputDir, spec: { title: 'Decision Brief', slides: [{ title: 'Finding', bullets: ['Evidence'], takeaway: 'Act' }, { title: 'Next', bullets: ['Verify'] }] } });
    const python = createCodeArtifact({ outputDir, title: 'Model', language: 'python', content: 'print(42)\n' });
    const r = createCodeArtifact({ outputDir, title: 'Model', language: 'r', content: 'print(42)\n' });
    assert.equal(fs.readFileSync(excel.filePath).subarray(0, 2).toString(), 'PK');
    assert.equal(fs.readFileSync(deck.filePath).subarray(0, 2).toString(), 'PK');
    assert.equal(excel.validation.roundTrip, true); assert.equal(excel.validation.worksheets, 1);
    assert.equal(deck.validation.package, true); assert.equal(deck.validation.slides, 2);
    assert.equal(path.extname(python.filePath), '.py'); assert.equal(path.extname(r.filePath), '.R');
    for (const artifact of [excel, deck, python, r]) assert.equal(artifact.sha256.length, 64);
  } finally { fs.rmSync(outputDir, { recursive: true, force: true }); }
});

test('rejects slide content that would overflow the supported layout', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-chief-ppt-overflow-'));
  try {
    await assert.rejects(createPresentation({ outputDir, spec: { title: 'Overflow', slides: [{ title: 'A'.repeat(111), bullets: ['Evidence'] }, { title: 'Next', bullets: ['Act'] }] } }), /overflow preflight/i);
  } finally { fs.rmSync(outputDir, { recursive: true, force: true }); }
});
