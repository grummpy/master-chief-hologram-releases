'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { publicResearchUrls, normalizePublicResearch } = require('../public-research');

test('public research uses fixed encoded no-key endpoints', () => {
  const urls = publicResearchUrls('Ollama tool calling');
  assert.match(urls.duckduckgo, /^https:\/\/api\.duckduckgo\.com\//);
  assert.match(urls.wikipedia, /^https:\/\/en\.wikipedia\.org\/w\/api\.php/);
  assert.match(urls.duckduckgo, /Ollama%20tool%20calling/);
  assert.throws(() => publicResearchUrls(''), /between 1 and 500/);
});

test('public research normalizes linked evidence and strips markup', () => {
  const report = normalizePublicResearch('test', { Heading: 'Example', AbstractText: 'Verified summary', AbstractURL: 'https://example.org' }, { query: { search: [{ title: 'Local AI', snippet: '<span>Local</span> article' }] } });
  assert.equal(report.sources.length, 2);
  assert.equal(report.sources[1].excerpt, 'Local article');
  assert.match(report.sources[1].url, /^https:\/\/en\.wikipedia\.org\/wiki\//);
});
