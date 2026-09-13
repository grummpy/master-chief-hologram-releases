const path = require('node:path');

function safeArtifactPath(root, relativePath) {
  const value = String(relativePath || '').replace(/\\/g, '/');
  if (!/^(docs|artifacts|exports)\/[A-Za-z0-9._/-]+$/.test(value)) return null;
  const base = path.resolve(root);
  const target = path.resolve(base, value);
  return target.startsWith(`${base}${path.sep}`) ? target : null;
}

module.exports = { safeArtifactPath };
