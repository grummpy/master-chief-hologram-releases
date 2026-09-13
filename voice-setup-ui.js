'use strict';

function showVoiceSetup(setup) {
  const existing = document.getElementById('voiceSetupResult');
  const lines = setup.ready
    ? [`Offline voice is ready.`, `Selected model: ${setup.selectedModel}`]
    : [
        'Offline voice needs setup.',
        ...setup.steps.map(step => step.command),
        `Models folder: ${setup.modelDirectory}`,
        setup.discoveredModels.length ? `Detected models: ${setup.discoveredModels.map(model => model.name).join(', ')}` : 'No local GGML models detected.',
        'Restart or refresh Systems after setup.'
      ];
  existing.textContent = lines.join('\n');
}

window.addEventListener('DOMContentLoaded', () => {
  const details = document.querySelector('details');
  const health = document.getElementById('providerHealth');
  if (!details || !health || !window.masterChief?.voiceSetup) return;
  const button = document.createElement('button');
  button.id = 'voiceSetupBtn';
  button.type = 'button';
  button.className = 'health-chip';
  button.textContent = 'Offline voice setup';
  button.title = 'Show local whisper.cpp installation and model details';
  const result = document.createElement('pre');
  result.id = 'voiceSetupResult';
  result.className = 'hint';
  result.hidden = true;
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Checking offline voice…';
    try { showVoiceSetup(await window.masterChief.voiceSetup()); result.hidden = false; }
    catch (error) { result.textContent = `Offline voice setup check failed: ${error.message}`; result.hidden = false; }
    finally { button.disabled = false; button.textContent = 'Offline voice setup'; }
  });
  health.after(button, result);
});
