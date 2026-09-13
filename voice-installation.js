'use strict';

// Models intentionally stay outside the app bundle. They can be hundreds of
// MB and are updated independently from the desktop application.
const VOICE_MODEL_MANIFEST = Object.freeze({
  schemaVersion: 1,
  runtime: 'whisper.cpp',
  installDirectory: 'voice/models',
  recommended: Object.freeze({
    id: 'ggml-base.en.bin', language: 'English', sizeClass: 'base',
    source: 'https://github.com/ggml-org/whisper.cpp#quick-start',
    note: 'Download a compatible GGML model into the local voice/models directory; it is never bundled or fetched by the app.'
  })
});

function safeModelFile(name) { return /^ggml-[a-z0-9._-]+\.bin$/i.test(String(name || '')); }
function discoverModels(directory, { exists, readDir } = {}) {
  if (!directory || !exists?.(directory)) return [];
  try { return readDir(directory).filter(entry => entry?.isFile?.() && safeModelFile(entry.name)).map(entry => ({ name: entry.name, path: require('path').join(directory, entry.name) })).sort((a, b) => a.name.localeCompare(b.name)); } catch { return []; }
}
function buildVoiceSetup(config = {}) {
  const ready = Boolean(config.bin && config.modelExists && config.ffmpeg);
  const steps = [];
  if (!config.bin) steps.push({ id: 'runtime', complete: false, command: 'brew install whisper-cpp', detail: 'Install the whisper.cpp command-line runtime.' });
  if (!config.modelExists) steps.push({ id: 'model', complete: false, command: `Place ${VOICE_MODEL_MANIFEST.recommended.id} in ${config.modelDirectory || 'the local voice/models directory'}`, detail: VOICE_MODEL_MANIFEST.recommended.note });
  if (!config.ffmpeg) steps.push({ id: 'ffmpeg', complete: false, command: 'brew install ffmpeg', detail: 'Install audio conversion for browser microphone captures.' });
  return { ready, mode: ready ? 'offline-ready' : 'setup-required', manifest: VOICE_MODEL_MANIFEST, modelDirectory: config.modelDirectory || '', discoveredModels: config.discoveredModels || [], selectedModel: config.model || '', steps };
}
module.exports = { VOICE_MODEL_MANIFEST, safeModelFile, discoverModels, buildVoiceSetup };
