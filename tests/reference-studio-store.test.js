'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createReferenceStudioStore } = require('../reference-studio-store');

function fixture(store) {
  const project = store.saveProject({ title: 'Nova continuity' });
  const subject = store.saveSubject(project.id, { name: 'Commander Nova', appearanceNotes: 'silver hair', palette: 'cyan and midnight blue', continuityLocks: 'blue eyes and stable proportions' });
  const sheet = store.saveSheet(project.id, subject.id, { title: 'Hero sheet', continuityLocks: 'same face and armor geometry' });
  return { project, subject, sheet };
}

test('Reference Studio persists the complete hierarchy and review state atomically', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-reference-'));
  try {
    const store = createReferenceStudioStore(path.join(root, 'reference-studio.json'));
    const { project, subject, sheet } = fixture(store);
    const view = store.saveView({ projectId: project.id, subjectId: subject.id, sheetId: sheet.id }, { artifact: 'artifacts/generated/nova.png', label: 'front', status: 'approved', annotation: 'primary face view' });
    const shot = store.saveShot(project.id, { title: 'Bridge', positivePrompt: 'bridge wide shot', negativePrompt: 'blur', pose: 'saluting', environment: 'bridge', camera: '35mm', lighting: 'cyan rim', model: 'model.safetensors', workflow: 'sdxl-revision-v1', referenceStrength: .8, denoise: .72, referenceSha256: 'a'.repeat(64), seed: 42, sampler: 'euler', scheduler: 'normal', steps: 32, cfg: 7, width: 832, height: 1216, batch: 4, status: 'queued' }, subject.id, sheet.id);
    const variant = store.saveVariant({ projectId: project.id, subjectId: subject.id, sheetId: sheet.id, shotId: shot.id }, { artifact: 'artifacts/generated/variant.png', requestId: 'request-1', status: 'approved', parentVariantId: '', annotation: 'best face' });
    const state = store.read();
    assert.equal(state.schemaVersion, 2);
    assert.equal(state.projects[0].subjects[0].referenceSheets[0].approvedViews[0].id, view.id);
    assert.equal(state.projects[0].subjects[0].referenceSheets[0].shots[0].variants[0].id, variant.id);
    assert.equal(state.projects[0].subjects[0].referenceSheets[0].shots[0].camera, '35mm');
    assert.equal(state.projects[0].subjects[0].referenceSheets[0].shots[0].denoise, .72);
    assert.equal(state.projects[0].subjects[0].referenceSheets[0].shots[0].referenceMode, 'approved');
    assert.equal(state.projects[0].subjects[0].referenceSheets[0].shots[0].referenceSha256, 'a'.repeat(64));
    assert.deepEqual({ seed: state.projects[0].subjects[0].referenceSheets[0].shots[0].seed, sampler: state.projects[0].subjects[0].referenceSheets[0].shots[0].sampler, batch: state.projects[0].subjects[0].referenceSheets[0].shots[0].batch }, { seed: 42, sampler: 'euler', batch: 4 });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('clean generation mode prevents approved reference fallback', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-reference-clean-'));
  try {
    const store = createReferenceStudioStore(path.join(root, 'reference-studio.json'));
    const { project, subject, sheet } = fixture(store);
    const shot = store.saveShot(project.id, { positivePrompt: 'new composition', referenceMode: 'none', referenceArtifact: 'old.png' }, subject.id, sheet.id);
    assert.equal(shot.referenceMode, 'none');
    assert.equal(store.read().projects[0].subjects[0].referenceSheets[0].shots[0].referenceMode, 'none');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('dedicated identity style pose composition depth and lighting references persist', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-reference-roles-'));
  try {
    const store = createReferenceStudioStore(path.join(root, 'studio.json'));
    const project = store.saveProject({ title: 'Roles' }); const subject = store.saveSubject(project.id, { name: 'Adult subject' }); const sheet = store.saveSheet(project.id, subject.id, { title: 'Sheet' });
    const shot = store.saveShot(project.id, { identityReference: 'identity.png', styleReference: 'style.png', poseReference: 'pose.png', compositionReference: 'composition.png', depthReference: 'depth.png', lightingReference: 'lighting.png' }, subject.id, sheet.id);
    assert.deepEqual([shot.identityReference, shot.styleReference, shot.poseReference, shot.compositionReference, shot.depthReference, shot.lightingReference], ['identity.png','style.png','pose.png','composition.png','depth.png','lighting.png']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('advanced identity and structure modes survive durable queue storage', () => {
  const target = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'reference-controls-')), 'reference.json');
  const store = createReferenceStudioStore(target);
  const project = store.saveProject({ title: 'Controls' });
  const subject = store.saveSubject(project.id, { name: 'Nova' });
  const sheet = store.saveSheet(project.id, subject.id, { title: 'Identity' });
  for (const controlMode of ['faceid', 'canny', 'instantid', 'hybridid', 'tile', 'poselora']) {
    const shot = store.saveShot(project.id, { title: controlMode, positivePrompt: 'test', controlMode, faceIdV2Strength: 1.2, faceIdLoraStrength: .7, cannyLow: .2, cannyHigh: .8, instantIdControlStrength: .9, instantIdNoise: .1 }, subject.id, sheet.id);
    assert.equal(shot.controlMode, controlMode);
    assert.deepEqual({ face: shot.faceIdV2Strength, lora: shot.faceIdLoraStrength, low: shot.cannyLow, high: shot.cannyHigh, keypoints: shot.instantIdControlStrength, noise: shot.instantIdNoise }, { face: 1.2, lora: .7, low: .2, high: .8, keypoints: .9, noise: .1 });
  }
});

test('schema v1 projects migrate without losing subject or shot data', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-reference-migrate-'));
  const file = path.join(root, 'reference-studio.json');
  try {
    fs.writeFileSync(file, JSON.stringify({ schemaVersion: 1, projects: [{ id: 'p1', title: 'Legacy', subject: { name: 'Nova', identityLock: 'same eyes' }, shots: [{ id: 'shot1', title: 'Legacy shot', positivePrompt: 'portrait', status: 'queued' }] }] }));
    const state = createReferenceStudioStore(file).read();
    assert.equal(state.schemaVersion, 2);
    assert.equal(state.projects[0].subjects[0].name, 'Nova');
    assert.equal(state.projects[0].subjects[0].continuityLocks, 'same eyes');
    assert.equal(state.projects[0].subjects[0].referenceSheets[0].shots[0].positivePrompt, 'portrait');
    assert.equal(createReferenceStudioStore(file).read().projects[0].subjects[0].id, state.projects[0].subjects[0].id, 'migration IDs must be stable across reads');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('queue states clear safely while completed variants and lineage remain', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-reference-queue-'));
  try {
    const store = createReferenceStudioStore(path.join(root, 'reference-studio.json'));
    const { project, subject, sheet } = fixture(store);
    const complete = store.saveShot(project.id, { positivePrompt: 'complete', status: 'complete' }, subject.id, sheet.id);
    store.saveVariant({ projectId: project.id, subjectId: subject.id, sheetId: sheet.id, shotId: complete.id }, { artifact: 'artifacts/generated/kept.png', status: 'approved', requestId: 'kept-request' });
    store.saveShot(project.id, { positivePrompt: 'pending', status: 'queued' }, subject.id, sheet.id);
    const cleared = store.clearQueue({ projectId: project.id, subjectId: subject.id, sheetId: sheet.id });
    assert.equal(cleared.cleared, 1);
    const shots = store.read().projects[0].subjects[0].referenceSheets[0].shots;
    assert.equal(shots.find(item => item.id === complete.id).variants[0].requestId, 'kept-request');
    assert.equal(shots.find(item => item.status === 'draft').positivePrompt, 'pending');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Reference Studio rejects unknown hierarchy IDs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-reference-invalid-'));
  try {
    const store = createReferenceStudioStore(path.join(root, 'reference-studio.json'));
    assert.throws(() => store.saveSubject('missing', {}), /project not found/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
