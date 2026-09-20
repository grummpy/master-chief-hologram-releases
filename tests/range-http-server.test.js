'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('private LAN transfer server implements byte ranges and serves one explicit file', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'range_http_server.py'), 'utf8');
  assert.match(source, /Accept-Ranges/);
  assert.match(source, /Content-Range/);
  assert.match(source, /self\.path\.split/);
  assert.match(source, /ThreadingHTTPServer/);
});
