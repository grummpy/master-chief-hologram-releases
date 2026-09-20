'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createProjectStore } = require('../project-store');

test('projects persist independently from disposable chat and media storage', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-projects-'));
  const source = path.join(temp, 'result.png');
  fs.writeFileSync(source, 'fixture');
  const store = createProjectStore(path.join(temp, 'Projects'));
  const project = store.create('Nova Campaign');
  const saved = store.importFile(project.name, source);
  assert.equal(saved.project, 'Nova Campaign');
  assert.equal(store.list()[0].files[0].name, 'result.png');
  assert.equal(fs.readFileSync(saved.path, 'utf8'), 'fixture');
});

test('project names cannot escape the protected project root', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-projects-'));
  const store = createProjectStore(path.join(temp, 'Projects'));
  const project = store.create('../../outside');
  assert.equal(path.dirname(project.path), store.root);
});
