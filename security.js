const PROVIDERS = ['codex', 'openai', 'grok', 'ollama', 'huggingface', 'gemini'];
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 12000;
function validSecret(value, pattern = /[^\s]{8,}/) { return typeof value === 'string' && pattern.test(value.trim()); }
function safeProviderError(message) { return String(message || 'Provider request failed.').replace(/(?:sk|xai|hf|ghp|github_pat)[-_][A-Za-z0-9._-]+/gi, '[redacted credential]').replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted credential]'); }
function validateMessages(messages) { if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) throw new Error('Invalid conversation history.'); return messages.map(message => { if (!message || !['user', 'assistant', 'system'].includes(message.role) || typeof message.content !== 'string') throw new Error('Invalid conversation message.'); const content = message.content.trim(); if (!content || content.length > MAX_MESSAGE_CHARS) throw new Error('Conversation message is empty or too long.'); return { role: message.role, content }; }); }
function validateChatPayload(payload) { if (!payload || !PROVIDERS.includes(payload.provider)) throw new Error('Invalid provider selected.'); return { ...payload, messages: validateMessages(payload.messages), masterMode: payload.masterMode === true, stream: payload.stream === true }; }
module.exports = { validateChatPayload, validateMessages, safeProviderError, validSecret };
