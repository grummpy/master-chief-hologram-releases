'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createReferenceStudioStore } = require('../reference-studio-store');

test('Reference Studio persists identity data and a multi-shot queue atomically', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-reference-'));
  try {
    const store = createReferenceStudioStore(path.join(root, 'reference-studio.json'));
    const project = store.saveProject({ title: 'Nova continuity', subject: { name: 'Commander Nova', identityLock: 'silver hair and blue eyes' } });
    const first = store.saveShot(project.id, { title: 'Establishing', positivePrompt: 'bridge wide shot', negativePrompt: 'blur', status: 'queued' });
    store.saveShot(project.id, { title: 'Close-up', positivePrompt: 'portrait', referenceArtifact: 'artifacts/generated/nova.png', status: 'queued' });
    const state = store.read();
    assert.equal(state.schemaVersion, 1);
    assert.deepEqual(state.projects[0].subject, { name: 'Commander Nova', identityLock: 'silver hair and blue eyes' });
    assert.equal(state.projects[0].shots.length, 2);
    assert.equal(state.projects[0].shots[0].status, 'queued');
    store.removeShot(project.id, first.id);
    assert.equal(store.read().projects[0].shots.length, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Reference Studio rejects unknown projects and normalizes invalid status', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-reference-'));
  try {
    const store = createReferenceStudioStore(path.join(root, 'reference-studio.json'));
    assert.throws(() => store.saveShot('missing', { positivePrompt: 'test' }), /not found/);
    const project = store.saveProject({});
    const shot = store.saveShot(project.id, { positivePrompt: 'test', status: 'invented' });
    assert.equal(shot.status, 'draft');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
