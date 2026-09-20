'use strict';

const fs = require('node:fs');
const path = require('node:path');

const INDEX_NAME = '.master-chief-artifacts.json';

function indexPath(directory) { return path.join(directory, INDEX_NAME); }
function readIndex(directory) {
  try {
    const value = JSON.parse(fs.readFileSync(indexPath(directory), 'utf8'));
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
}
function writeIndex(directory, value) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const target = indexPath(directory); const temporary = `${target}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, target);
}
function recordArtifact(directory, artifact, metadata = {}) {
  const filename = path.basename(String(artifact?.filename || artifact?.filePath || ''));
  if (!filename) throw new Error('Artifact filename is required for provenance.');
  const index = readIndex(directory);
  index[filename] = {
    filename,
    kind: String(metadata.kind || ''),
    request: String(metadata.request || '').slice(0, 12000),
    parentArtifact: metadata.parentArtifact ? path.basename(String(metadata.parentArtifact)) : null,
    createdAt: String(metadata.createdAt || new Date().toISOString()),
    bytes: Number(artifact.bytes || 0),
    sha256: String(artifact.sha256 || '')
  };
  writeIndex(directory, index);
  return index[filename];
}

module.exports = { INDEX_NAME, readIndex, recordArtifact };
