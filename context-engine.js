'use strict';

const TOKEN_CHARS = 4;

function estimateTokens(value) {
  return Math.max(1, Math.ceil(String(value || '').length / TOKEN_CHARS));
}

function terms(value) {
  return new Set(String(value || '').toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || []);
}

function messageScore(message, index, count, queryTerms) {
  const content = String(message?.content || '');
  const words = terms(content);
  let overlap = 0;
  for (const word of queryTerms) if (words.has(word)) overlap += 1;
  const recency = count <= 1 ? 1 : index / (count - 1);
  const authority = message?.role === 'user' ? 1.5 : message?.role === 'tool' ? 1.25 : 1;
  const unresolved = /\b(blocked|error|failed|todo|next|must|require|correct(?:ion)?|decision)\b/i.test(content) ? 1.5 : 0;
  return (overlap * 3) + (recency * 4) + authority + unresolved;
}

function compactConversation(messages = []) {
  const buckets = { objective: [], constraints: [], facts: [], decisions: [], corrections: [], actions: [], artifacts: [], blockers: [], next: [] };
  const rules = [
    ['constraints', /\b(must|never|only|without|constraint|require)\b/i],
    ['corrections', /\b(correction|instead|not that|wrong|actually)\b/i],
    ['decisions', /\b(decided|choose|selected|approved|use )\b/i],
    ['blockers', /\b(blocked|error|failed|missing|unavailable)\b/i],
    ['artifacts', /\b(file|artifact|document|image|video|report|repository|commit)\b/i],
    ['actions', /\b(add|create|build|fix|update|install|test|verify|send|run)\b/i],
    ['next', /\b(next|then|after|follow[- ]?up)\b/i]
  ];
  const seen = new Set();
  for (const message of messages) {
    const text = String(message?.content || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 16);
    for (const sentence of sentences) {
      const clean = sentence.slice(0, 500);
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      let placed = false;
      for (const [bucket, rule] of rules) if (rule.test(clean)) { buckets[bucket].push(clean); placed = true; break; }
      if (!placed && message.role === 'user') buckets.facts.push(clean);
    }
  }
  const firstUser = messages.find(item => item?.role === 'user');
  if (firstUser) buckets.objective.push(String(firstUser.content || '').replace(/\s+/g, ' ').slice(0, 800));
  const lines = [];
  for (const [name, entries] of Object.entries(buckets)) {
    const unique = [...new Set(entries)].slice(-6);
    if (unique.length) lines.push(`${name.toUpperCase()}:\n${unique.map(item => `- ${item}`).join('\n')}`);
  }
  return { buckets, text: lines.join('\n') };
}

function assembleContext({ messages = [], maxTokens = 8192, reserveTokens = 1800, projectMemory = '', preferences = '', toolEvidence = '' } = {}) {
  const safeMessages = messages.filter(item => item && ['user', 'assistant', 'tool'].includes(item.role) && String(item.content || '').trim());
  const latestUser = [...safeMessages].reverse().find(item => item.role === 'user');
  const queryTerms = terms(latestUser?.content || '');
  const budget = Math.max(1024, Math.floor(Number(maxTokens || 8192) * 0.72) - reserveTokens);
  const layers = [
    { name: 'approved preferences', content: String(preferences || '').trim(), authority: 3 },
    { name: 'project memory', content: String(projectMemory || '').trim(), authority: 2 },
    { name: 'verified tool evidence', content: String(toolEvidence || '').trim(), authority: 4 }
  ].filter(item => item.content);
  const included = [];
  let used = layers.reduce((sum, layer) => sum + estimateTokens(layer.content), 0);
  const ranked = safeMessages.map((message, index) => ({ message, index, tokens: estimateTokens(message.content), score: messageScore(message, index, safeMessages.length, queryTerms) }))
    .sort((a, b) => b.score - a.score || b.index - a.index);
  for (const candidate of ranked) {
    if (used + candidate.tokens > budget && included.length) continue;
    included.push(candidate); used += candidate.tokens;
  }
  included.sort((a, b) => a.index - b.index);
  const includedIndexes = new Set(included.map(item => item.index));
  const omittedMessages = safeMessages.filter((_item, index) => !includedIndexes.has(index));
  const compacted = omittedMessages.length ? compactConversation(omittedMessages) : { text: '', buckets: {} };
  const compactTokens = estimateTokens(compacted.text);
  if (compacted.text && used + compactTokens <= budget) {
    included.unshift({ index: -1, tokens: compactTokens, score: 0, message: { role: 'system', content: `CONVERSATION COMPACTION\n${compacted.text}` } });
    used += compactTokens;
  }
  const memoryMessages = layers.map(layer => ({ role: 'system', content: `${layer.name.toUpperCase()}\n${layer.content}` }));
  return {
    messages: [...memoryMessages, ...included.map(item => item.message)],
    report: { budgetTokens: budget, estimatedTokens: used, maxTokens: Number(maxTokens || 8192), includedMessages: included.filter(item => item.index >= 0).length, omittedMessages: omittedMessages.length, compacted: Boolean(compacted.text), layers: layers.map(item => item.name), selectedIndexes: included.filter(item => item.index >= 0).map(item => item.index) },
    compaction: compacted
  };
}

module.exports = { estimateTokens, compactConversation, assembleContext, messageScore };
