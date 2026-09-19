'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'renderer.js'), 'utf8');

test('media backend passes operator prompts without hidden creative rewriting', () => {
  assert.doesNotMatch(main, /adultDirective|adherencePrompt|strategically covered|bikini top/);
  assert.match(main, /prompt: rawPrompt/);
  assert.match(main, /negativePrompt: String\(payload\?\.negativePrompt/);
});

test('renderer does not inject clothing, censorship, or aesthetic negatives', () => {
  assert.doesNotMatch(renderer, /strategically covered|bikini top|malformed anatomy|watermark, blurry/);
  assert.match(renderer, /const negativePrompt=explicitNegative/);
});
