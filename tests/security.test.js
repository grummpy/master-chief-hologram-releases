const test = require('node:test');
const assert = require('node:assert/strict');
const { validateChatPayload, safeProviderError, validSecret } = require('../security');

test('accepts a bounded provider request and normalizes content', () => {
  const payload = validateChatPayload({ provider: 'ollama', messages: [{ role: 'user', content: '  hello  ' }], masterMode: 1 });
  assert.deepEqual(payload.messages, [{ role: 'user', content: 'hello' }]);
  assert.equal(payload.masterMode, false);
});

test('rejects unknown providers and malformed messages', () => {
  assert.throws(() => validateChatPayload({ provider: 'evil', messages: [] }), /Invalid provider/);
  assert.throws(() => validateChatPayload({ provider: 'openai', messages: [{ role: 'user', content: '' }] }), /empty or too long/);
  assert.throws(() => validateChatPayload({ provider: 'openai', messages: [{ role: 'user', content: 'x'.repeat(12001) }] }), /empty or too long/);
});

test('redacts credentials from provider errors', () => {
  const message = safeProviderError('Bearer sk-test_123456789012345678 and xai-123456789012345678');
  assert.equal(message.includes('sk-test_'), false);
  assert.equal(message.includes('xai-'), false);
  assert.match(message, /redacted credential/);
  assert.equal(validSecret('sk-123456789012'), true);
});
