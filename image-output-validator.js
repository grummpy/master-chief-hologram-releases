'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }

function validateImageOutputs(artifacts, options = {}) {
  const sourceSha256 = options.sourceSha256 || null;
  const requireChanged = Boolean(options.requireChanged);
  const imageSize = options.imageSize || (() => ({ width: 0, height: 0 }));
  const seen = new Set();
  return (artifacts || []).map(artifact => {
    const file = path.resolve(String(artifact.path || ''));
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error('Generated image file is missing.');
    const bytes = fs.statSync(file).size;
    if (!bytes) throw new Error('Generated image file is blank.');
    const hash = sha256(file);
    if (artifact.sha256 && artifact.sha256 !== hash) throw new Error('Generated image checksum does not match the downloaded artifact.');
    if (seen.has(hash)) throw new Error('ComfyUI returned duplicate images in the same job. Duplicate output was rejected.');
    if (requireChanged && sourceSha256 && hash === sourceSha256) throw new Error('ComfyUI returned the unchanged source image. The output was rejected; retry with a new seed or stronger redraw settings.');
    seen.add(hash);
    const size = imageSize(file);
    if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width < 64 || size.height < 64) throw new Error('Generated image dimensions are invalid or unexpectedly small.');
    return { ...artifact, bytes, sha256: hash, width: size.width, height: size.height, validation: 'passed' };
  });
}

module.exports = { validateImageOutputs };
