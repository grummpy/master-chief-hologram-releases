const test = require('node:test');
const assert = require('node:assert/strict');
const { safeModelFile, discoverModels, buildVoiceSetup } = require('../voice-installation');

test('voice model manifest accepts only safe GGML model files', () => {
  assert.equal(safeModelFile('ggml-base.en.bin'), true);
  assert.equal(safeModelFile('../ggml-base.en.bin'), false);
  assert.equal(safeModelFile('model.gguf'), false);
});
test('voice discovery returns stable local GGML model choices', () => {
  const models = discoverModels('/voice/models', { exists: () => true, readDir: () => [{ name: 'notes.txt', isFile: () => true }, { name: 'ggml-small.en.bin', isFile: () => true }, { name: 'ggml-base.en.bin', isFile: () => true }] });
  assert.deepEqual(models.map(model => model.name), ['ggml-base.en.bin', 'ggml-small.en.bin']);
});
test('offline voice setup reports only unresolved installation steps', () => {
  const setup = buildVoiceSetup({ bin: '/opt/homebrew/bin/whisper-cli', modelExists: false, ffmpeg: true, modelDirectory: '/voice/models' });
  assert.equal(setup.ready, false);
  assert.deepEqual(setup.steps.map(step => step.id), ['model']);
  assert.match(setup.steps[0].command, /ggml-base.en.bin/);
});
