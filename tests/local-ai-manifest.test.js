const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadLocalAiManifest, primaryInstalledModel } = require('../local-ai-manifest');
test('local AI manifest selects only an installed enabled local model', () => {
  const manifest = loadLocalAiManifest(path.join(__dirname, '..', 'local-ai-manifest.json'));
  assert.equal(manifest.routing.cloudFallback, 'explicit-user-selection-only');
  assert.equal(primaryInstalledModel(manifest, ['qwen3:8b', 'qwen2.5:0.5b']).id, 'qwen3:8b');
  assert.equal(primaryInstalledModel(manifest, ['qwen2.5:0.5b']).id, 'qwen2.5:0.5b');
  assert.equal(primaryInstalledModel(manifest, ['dolphin3:8b']).id, 'dolphin3:8b');
  assert.equal(primaryInstalledModel(manifest, []), null);
});
