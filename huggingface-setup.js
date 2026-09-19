'use strict';

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('huggingFaceSetupBtn');
  const dialog = document.getElementById('huggingFaceSetup');
  const form = document.getElementById('huggingFaceSetupForm');
  const baseUrl = document.getElementById('hfBaseUrl');
  const model = document.getElementById('hfModel');
  const token = document.getElementById('hfToken');
  const status = document.getElementById('hfSetupStatus');
  const save = document.getElementById('hfSaveBtn');
  if (!button || !dialog || !form || !window.masterChief?.huggingFaceSetupStatus) return;
  button.addEventListener('click', async () => {
    status.textContent = 'Loading current configuration…';
    dialog.showModal();
    try {
      const current = await window.masterChief.huggingFaceSetupStatus();
      baseUrl.value = current.baseUrl;
      model.value = current.model;
      token.value = '';
      token.placeholder = current.tokenConfigured ? 'Token already stored — leave blank to keep it' : 'hf_…';
      status.textContent = current.tokenConfigured ? 'A token is securely stored. Save and test to verify it.' : 'Create a token using the linked setup instructions, then paste it here.';
      token.focus();
    } catch (error) { status.textContent = error.message; }
  });
  document.getElementById('hfCancelBtn').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async event => {
    event.preventDefault(); save.disabled = true; status.textContent = 'Saving securely and testing Hugging Face…';
    try {
      const result = await window.masterChief.saveHuggingFaceSetup({ baseUrl: baseUrl.value, model: model.value, token: token.value });
      token.value = ''; status.textContent = result.message;
      if (result.ready) { button.textContent = 'Hugging Face configured'; setTimeout(() => dialog.close(), 900); }
    } catch (error) { status.textContent = error.message; }
    finally { save.disabled = false; }
  });
});
