'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'renderer.js'), 'utf8');
const referenceStudio = fs.readFileSync(path.join(root, 'reference-studio.js'), 'utf8');

test('G3 operator controls expose autocomplete, spellcheck, archive, and progress', () => {
  assert.match(html, /id="prompt" spellcheck="true"/);
  assert.match(html, /id="autocompleteList"/);
  assert.match(html, /id="archiveBtn"/);
  assert.match(html, /id="generationStatus"/);
  assert.match(renderer, /showGenerationStatus/);
});

test('media controls expose explicit prompts, upscale, and Reference Studio', () => {
  assert.match(html, /id="positivePrompt"/);
  assert.match(html, /id="negativePrompt"/);
  assert.match(html, /id="referenceStudioBtn"/);
  assert.match(renderer, /kind:'upscale'/);
  assert.ok(fs.existsSync(path.join(root, 'workflows', 'image-upscale-api.json')));
});

test('Reference Studio exposes hierarchy, review, comparison, queue, and runtime controls', () => {
  for (const id of ['referenceProjectSelect','referenceSubjectSelect','referenceSheetSelect','referenceContactSheet','referenceComparison','runReferenceQueue','cancelReferenceQueue','resumeReferenceQueue','clearReferenceQueue','closeReferenceRuntime','shotReferenceStrength','shotDenoise']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(referenceStudio, /onReferenceQueueEvent/);
  assert.match(referenceStudio, /saveReferenceVariant/);
});
