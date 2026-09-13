const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAudioType, validateAudioFixture, voiceSelfTest } = require('../voice-diagnostics');

const fixture = { name: 'command-reference.webm', contentType: 'audio/webm;codecs=opus', bytes: 4800, expectedTranscript: 'Master Chief, run diagnostics.' };

test('voice fixture contract accepts a bounded browser recording', () => {
  assert.deepEqual(validateAudioFixture(fixture), { name: 'command-reference.webm', contentType: 'audio/webm', bytes: 4800, expectedTranscript: 'Master Chief, run diagnostics.' });
  assert.equal(normalizeAudioType('audio/webm;codecs=opus'), 'audio/webm');
});

test('voice fixture contract rejects unsupported or empty captures', () => {
  assert.throws(() => validateAudioFixture({ ...fixture, bytes: 99 }), /at least 100 bytes/);
  assert.throws(() => validateAudioFixture({ ...fixture, contentType: 'text/plain' }), /Unsupported/);
});

test('self test remains deterministic when local ASR is unavailable', () => {
  const report = voiceSelfTest({ ready: false }, fixture);
  assert.equal(report.ok, true);
  assert.equal(report.offlineReady, false);
  assert.equal(report.externalCalls, false);
  assert.equal(report.checks[2].ok, false);
});
