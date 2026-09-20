'use strict';

function boundedQuery(value) {
  const query = String(value || '').trim();
  if (!query || query.length > 500) throw new Error('Research query must be between 1 and 500 characters.');
  return query;
}

function publicResearchUrls(query) {
  const value = encodeURIComponent(boundedQuery(query));
  return {
    duckduckgo: `https://api.duckduckgo.com/?q=${value}&format=json&no_html=1&no_redirect=1&skip_disambig=1`,
    wikipedia: `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${value}&srlimit=5&utf8=1&format=json&origin=*`
  };
}

function stripMarkup(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function normalizePublicResearch(query, duckduckgo = {}, wikipedia = {}) {
  const sources = [];
  if (duckduckgo.AbstractText && duckduckgo.AbstractURL) sources.push({ title: duckduckgo.Heading || 'DuckDuckGo result', url: String(duckduckgo.AbstractURL), excerpt: stripMarkup(duckduckgo.AbstractText), source: 'DuckDuckGo' });
  const topics = Array.isArray(duckduckgo.RelatedTopics) ? duckduckgo.RelatedTopics.flatMap(item => Array.isArray(item.Topics) ? item.Topics : [item]) : [];
  for (const item of topics) if (item?.FirstURL && item?.Text && sources.length < 6) sources.push({ title: stripMarkup(item.Text).slice(0, 120), url: String(item.FirstURL), excerpt: stripMarkup(item.Text), source: 'DuckDuckGo' });
  for (const item of wikipedia?.query?.search || []) {
    const title = String(item.title || '').trim(); if (!title) continue;
    sources.push({ title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`, excerpt: stripMarkup(item.snippet), source: 'Wikipedia' });
  }
  const unique = [...new Map(sources.map(item => [item.url, item])).values()].slice(0, 10);
  return { query: boundedQuery(query), sources: unique, searched: ['DuckDuckGo Instant Answer', 'English Wikipedia'], limitation: 'Public no-key endpoints are narrower than a full commercial web index; verify important claims at the linked primary source.' };
}

module.exports = { boundedQuery, publicResearchUrls, normalizePublicResearch };
