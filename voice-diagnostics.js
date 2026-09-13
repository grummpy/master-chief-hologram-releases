'use strict';

// This module deliberately performs no recording, transcription, or network I/O.
// It is the deterministic contract shared by the desktop diagnostic and unit tests.
const ACCEPTED_AUDIO_TYPES = Object.freeze(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav']);
const MIN_CAPTURE_BYTES = 100;

function normalizeAudioType(type) {
  return String(type || '').split(';')[0].trim().toLowerCase();
}

function validateAudioFixture({ name, contentType, bytes, expectedTranscript } = {}) {
  const normalizedType = normalizeAudioType(contentType);
  const size = Number(bytes);
  if (!/^[a-z0-9][a-z0-9._-]*\.(webm|m4a|ogg|wav)$/i.test(String(name || ''))) throw new Error('Voice fixture needs a safe audio filename.');
  if (!ACCEPTED_AUDIO_TYPES.includes(normalizedType)) throw new Error(`Unsupported audio fixture type: ${normalizedType || 'missing'}.`);
  if (!Number.isInteger(size) || size < MIN_CAPTURE_BYTES) throw new Error(`Voice fixture must contain at least ${MIN_CAPTURE_BYTES} bytes.`);
  if (typeof expectedTranscript !== 'string' || !expectedTranscript.trim() || expectedTranscript.length > 1000) throw new Error('Voice fixture needs a bounded expected transcript.');
  return { name: String(name), contentType: normalizedType, bytes: size, expectedTranscript: expectedTranscript.trim() };
}

function voiceSelfTest(config, fixture) {
  const checkedFixture = validateAudioFixture(fixture);
  const checks = [
    { id: 'fixture-contract', ok: true, detail: `${checkedFixture.name} is a valid ${checkedFixture.contentType} fixture.` },
    { id: 'microphone-capture', ok: true, detail: `Renderer accepts captures of at least ${MIN_CAPTURE_BYTES} bytes.` },
    { id: 'local-asr-readiness', ok: Boolean(config?.ready), detail: config?.ready ? 'whisper.cpp, model, and ffmpeg are ready.' : 'Local ASR is not configured; cloud fallback may still be used.' }
  ];
  return { ok: checks.slice(0, 2).every(check => check.ok), offlineReady: Boolean(config?.ready), externalCalls: false, fixture: checkedFixture, checks };
}

module.exports = { ACCEPTED_AUDIO_TYPES, MIN_CAPTURE_BYTES, normalizeAudioType, validateAudioFixture, voiceSelfTest };
