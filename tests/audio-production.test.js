'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { normalizeSpeechContract, createAudioJobStore } = require('../audio-production');

test('provider-neutral speech contract preserves timing and provider data', () => {
  const value = normalizeSpeechContract({ kind: 'dialogue', provider: 'elevenlabs', text: 'Ready.', voice: 'nova', model: 'multilingual-v2', cueId: 'line-1', startMs: 240 });
  assert.equal(value.kind, 'dialogue'); assert.equal(value.provider, 'elevenlabs'); assert.equal(value.cueId, 'line-1'); assert.equal(value.startMs, 240);
});

test('audio jobs archive reversible stems and lineage with hashes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-audio-'));
  const store = createAudioJobStore(path.join(root, 'jobs.json'), path.join(root, 'archive'));
  const narration = store.create({ kind: 'narration', provider: 'macos-say', cueId: 'intro' });
  const saved = store.addArtifact(narration.id, Buffer.from('wave'), { name: 'intro', extension: 'wav', role: 'narration' });
  store.update(narration.id, { status: 'completed', stage: 'archive' });
  const mux = store.create({ kind: 'mux', provider: 'ffmpeg', parentId: narration.id, inputs: [saved.artifact.path], parameters: { timeline: [{ cueId: 'intro', startMs: 0 }] } });
  assert.equal(store.get(narration.id).artifacts[0].sha256.length, 64);
  assert.equal(mux.parentId, narration.id); assert.deepEqual(mux.inputs, [saved.artifact.path]);
});
