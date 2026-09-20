'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { validateImageOutputs } = require('../image-output-validator');

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('image output validation records dimensions and checksum evidence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-image-check-'));
  try {
    const file = path.join(root, 'image.png'); const bytes = Buffer.from('valid-fixture'); fs.writeFileSync(file, bytes);
    const [result] = validateImageOutputs([{ path: file, filename: 'image.png', sha256: hash(bytes) }], { imageSize: () => ({ width: 768, height: 1024 }) });
    assert.deepEqual({ width: result.width, height: result.height, validation: result.validation }, { width: 768, height: 1024, validation: 'passed' });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('image output validation rejects unchanged revisions, duplicates, and bad dimensions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-image-reject-'));
  try {
    const one = path.join(root, 'one.png'), two = path.join(root, 'two.png'); const bytes = Buffer.from('same'); fs.writeFileSync(one, bytes); fs.writeFileSync(two, bytes);
    const artifact = { path: one, filename: 'one.png', sha256: hash(bytes) };
    assert.throws(() => validateImageOutputs([artifact], { sourceSha256: hash(bytes), requireChanged: true, imageSize: () => ({ width: 512, height: 512 }) }), /unchanged source/);
    assert.throws(() => validateImageOutputs([artifact, { ...artifact, path: two }], { imageSize: () => ({ width: 512, height: 512 }) }), /duplicate images/);
    assert.throws(() => validateImageOutputs([artifact], { imageSize: () => ({ width: 1, height: 1 }) }), /dimensions/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
