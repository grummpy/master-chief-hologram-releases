#!/usr/bin/env node
'use strict';

// Generated immediately before packaging. It gives support and release checks
// traceable provenance without placing credentials in the application bundle.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const packageJson = require(path.join(root, 'package.json'));
function git(args, fallback) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || fallback; } catch { return fallback; }
}
const sourceDate = Number(process.env.SOURCE_DATE_EPOCH || 0);
const manifest = {
  schemaVersion: 1,
  appId: packageJson.build.appId,
  productName: packageJson.build.productName,
  version: packageJson.version,
  revision: git(['rev-parse', '--short=12', 'HEAD'], 'unknown'),
  sourceRevision: git(['rev-parse', 'HEAD'], 'unknown'),
  sourceDirty: git(['status', '--porcelain'], '') !== '',
  builtAt: Number.isFinite(sourceDate) && sourceDate > 0 ? new Date(sourceDate * 1000).toISOString() : new Date().toISOString()
};
fs.writeFileSync(path.join(root, 'build-info.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 });
console.log(`build manifest generated: v${manifest.version} ${manifest.revision}${manifest.sourceDirty ? ' (dirty)' : ''}`);
