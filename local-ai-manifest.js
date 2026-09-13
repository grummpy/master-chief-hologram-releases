const fs = require('fs');
function loadLocalAiManifest(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (parsed?.schemaVersion !== 1 || parsed?.routing?.defaultProvider !== 'ollama' || !Array.isArray(parsed.models)) throw new Error('Local AI manifest is invalid.');
  return parsed;
}
function primaryInstalledModel(manifest, installedNames) {
  const installed = new Set((installedNames || []).map(String));
  return manifest.models.find(model => model.enabled && model.runtime === 'ollama' && installed.has(model.id)) || null;
}
module.exports = { loadLocalAiManifest, primaryInstalledModel };
