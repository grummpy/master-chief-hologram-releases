'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { publicResearchUrls, normalizeSearxng, normalizePublicResearch } = require('../public-research');

test('public research uses fixed encoded no-key endpoints', () => {
  const urls = publicResearchUrls('Ollama tool calling');
  assert.equal(urls.searxng, 'http://127.0.0.1:8888/search?q=Ollama%20tool%20calling&format=json&language=auto&safesearch=0');
  assert.match(urls.duckduckgo, /^https:\/\/api\.duckduckgo\.com\//);
  assert.match(urls.wikipedia, /^https:\/\/en\.wikipedia\.org\/w\/api\.php/);
  assert.match(urls.duckduckgo, /Ollama%20tool%20calling/);
  assert.throws(() => publicResearchUrls(''), /between 1 and 500/);
});

test('local SearXNG results are bounded, deduplicated, and source labeled', () => {
  const report = normalizeSearxng('private search', { results: [
    { title: '<b>Primary</b>', url: 'https://example.org/source', content: '<p>Evidence</p>', engine: 'brave' },
    { title: 'Duplicate', url: 'https://example.org/source', content: 'duplicate' },
    { title: 'Unsafe', url: 'file:///tmp/private', content: 'discarded' }
  ] });
  assert.equal(report.sources.length, 1);
  assert.equal(report.sources[0].title, 'Primary');
  assert.equal(report.sources[0].source, 'brave');
  assert.match(report.limitation, /search engines/);
});

test('public research normalizes linked evidence and strips markup', () => {
  const report = normalizePublicResearch('test', { Heading: 'Example', AbstractText: 'Verified summary', AbstractURL: 'https://example.org' }, { query: { search: [{ title: 'Local AI', snippet: '<span>Local</span> article' }] } });
  assert.equal(report.sources.length, 2);
  assert.equal(report.sources[1].excerpt, 'Local article');
  assert.match(report.sources[1].url, /^https:\/\/en\.wikipedia\.org\/wiki\//);
});
