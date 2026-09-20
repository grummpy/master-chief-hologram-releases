'use strict';

const fs = require('fs');
const path = require('path');

function directories(root) {
  try { return fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => entry.name); }
  catch { return []; }
}

function readPackage(directory) {
  try { return JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')); }
  catch { return {}; }
}

function discoverPlugins(pluginRoot, limit = 200) {
  const cacheRoot = path.join(pluginRoot, 'cache');
  const items = [];
  for (const source of directories(cacheRoot)) {
    const sourceRoot = path.join(cacheRoot, source);
    for (const plugin of directories(sourceRoot)) {
      const pluginRootPath = path.join(sourceRoot, plugin);
      const versions = directories(pluginRootPath).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      const version = versions[0] || '';
      if (!version) continue;
      const installPath = path.join(pluginRootPath, version);
      const manifest = readPackage(installPath);
      items.push({
        name: String(manifest.displayName || manifest.name || plugin),
        id: plugin,
        version,
        source,
        type: 'plugin',
        detail: [source, version, manifest.description].filter(Boolean).join(' · '),
        path: installPath
      });
      if (items.length >= limit) break;
    }
    if (items.length >= limit) break;
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = { discoverPlugins };
