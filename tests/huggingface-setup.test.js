'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('Hugging Face setup uses encrypted storage and never returns the token', () => {
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
  const ui = fs.readFileSync(path.join(root, 'huggingface-setup.js'), 'utf8');
  assert.match(main, /credentials\(\)\.set\('huggingface', token\)/);
  assert.match(main, /https:\/\/router\.huggingface\.co\/v1/);
  assert.doesNotMatch(main, /return \{[^}]*token:/);
  assert.match(preload, /saveHuggingFaceSetup/);
  assert.match(ui, /type="password"|hfToken/);
});
