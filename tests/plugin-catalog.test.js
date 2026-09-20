'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { discoverPlugins } = require('../plugin-catalog');

test('plugin catalog traverses source, plugin, and version instead of returning cache', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-plugins-'));
  const install = path.join(root, 'cache', 'personal', 'example-plugin', '1.2.3');
  fs.mkdirSync(install, { recursive: true });
  fs.writeFileSync(path.join(install, 'package.json'), JSON.stringify({ name: 'Example Plugin', description: 'Fixture connector' }));
  const items = discoverPlugins(root);
  assert.equal(items.length, 1);
  assert.equal(items[0].name, 'Example Plugin');
  assert.equal(items[0].version, '1.2.3');
  assert.match(items[0].detail, /personal.*1\.2\.3.*Fixture connector/);
});
