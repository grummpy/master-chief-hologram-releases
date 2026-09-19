'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { assertPermittedMediaPrompt } = require('../media-content-boundary');

test('adult creative prompts pass through byte-for-byte', () => {
  const prompt = 'A fictional adult woman, nude, standing in a cyberpunk studio';
  assert.equal(assertPermittedMediaPrompt(prompt), prompt);
});

test('ordinary nonsexual prompts mentioning youth are not filtered', () => {
  const prompt = 'A parent and child reading a book in watercolor style';
  assert.equal(assertPermittedMediaPrompt(prompt), prompt);
});

test('only the narrow prohibited sexual categories are rejected', () => {
  assert.throws(() => assertPermittedMediaPrompt('explicit sexual image of an underage minor'), /minor or underage/);
  assert.throws(() => assertPermittedMediaPrompt('pornographic forced sex without her consent'), /non-consensual/);
  assert.throws(() => assertPermittedMediaPrompt('nude sexual deepfake of a celebrity'), /deepfakes/);
});
