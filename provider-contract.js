'use strict';

const { safeProviderError } = require('./security');

function providerCapabilities(id) {
  const common = { streaming: true, cancellation: true, usage: true, normalizedErrors: true };
  return { ...common, id: String(id), local: id === 'ollama', tools: ['ollama','openai','grok','gemini'].includes(id), attachments: true };
}
function normalizeProviderResult(provider, result = {}, startedAt = Date.now()) {
  return { ...result, provider, adapter: 'provider-contract-v1', durationMs: Number(result.durationMs || Math.max(0, Date.now()-startedAt)), usage: { promptTokens: Number(result.metrics?.promptTokens || result.usage?.promptTokens || 0), generatedTokens: Number(result.metrics?.generatedTokens || result.usage?.generatedTokens || 0) }, capabilities: providerCapabilities(provider) };
}
function normalizeProviderFailure(provider, error, stage = 'request') { const message = safeProviderError(error?.message || error); const kind = /abort|cancel/i.test(message) ? 'cancelled' : /timeout|network|fetch|ECONN/i.test(message) ? 'network' : /credential|key|auth/i.test(message) ? 'authentication' : /limit|rate|quota/i.test(message) ? 'capacity' : 'provider'; return { provider, stage, kind, retryable: ['network','capacity'].includes(kind), message }; }

module.exports = { providerCapabilities, normalizeProviderResult, normalizeProviderFailure };
