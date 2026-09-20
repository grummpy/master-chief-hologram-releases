'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ingestAttachment, MAX_ATTACHMENT_BYTES } = require('../file-ingestion');

test('text attachments are extracted and arbitrary binaries retain metadata', async () => {
  const text = await ingestAttachment({ name: 'model.csv', type: 'text/csv', bytes: Buffer.from('year,value\n2026,42') });
  assert.equal(text.parseStatus, 'parsed'); assert.match(text.text, /2026,42/); assert.equal(text.sha256.length, 64);
  const binary = await ingestAttachment({ name: 'design.blend', bytes: Buffer.from([1, 2, 3, 4]) });
  assert.equal(binary.parseStatus, 'metadata-only'); assert.equal(binary.extension, 'blend'); assert.equal(binary.bytes, 4);
});

test('attachment ingestion rejects empty and oversized payloads', async () => {
  await assert.rejects(() => ingestAttachment({ name: 'empty.bin', bytes: [] }), /empty/);
  await assert.rejects(() => ingestAttachment({ name: 'large.bin', bytes: Buffer.alloc(MAX_ATTACHMENT_BYTES + 1) }), /25 MB/);
});
