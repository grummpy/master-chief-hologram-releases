const test = require('node:test');
const assert = require('node:assert/strict');
const { validateChatPayload, safeProviderError, validSecret, redactSecrets } = require('../security');

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

test('redacts common provider secrets from structured text and URLs', () => {
  const source = 'api_key=plain-secret-123 token: visible-token-456 https://example.test?a=1&access_token=url-secret-789 AIzaSyExampleCredential1234567890';
  const result = redactSecrets(source);
  assert.equal(result.includes('plain-secret'), false);
  assert.equal(result.includes('visible-token'), false);
  assert.equal(result.includes('url-secret'), false);
  assert.equal(result.includes('AIzaSy'), false);
});
