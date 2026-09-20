'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('packaged UI includes an accessible MCP manager with explicit tool approval', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'mcp-manager.js'), 'utf8');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(html, /<script src="mcp-manager\.js"><\/script>/);
  assert.ok(pkg.build.files.includes('mcp-manager.js'));
  assert.match(script, /aria-labelledby', 'mcpManagerTitle'/);
  assert.match(script, /setMcpPermission/);
  assert.match(script, /Discover tools/);
});
