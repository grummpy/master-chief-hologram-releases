const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createCredentialStore } = require('../credential-store');

test('falls back to environment without writing credentials', () => {
  const file = path.join(os.tmpdir(), `mc-creds-${Date.now()}.json`);
  const s = createCredentialStore({ safeStorage: { isEncryptionAvailable: () => false }, filePath: file, env: { OPENAI_API_KEY: 'sk-test' } });
  assert.equal(s.get('openai', 'OPENAI_API_KEY'), 'sk-test');
  assert.equal(s.status().state, 'fallback');
  assert.equal(fs.existsSync(file), false);
});

test('migrates environment secret in encrypted form', () => {
  const file = path.join(os.tmpdir(), `mc-creds-${Date.now()}-secure.json`);
  const safeStorage = { isEncryptionAvailable: () => true, encryptString: v => Buffer.from(`enc:${v}`), decryptString: b => b.toString().replace(/^enc:/, '') };
  const s = createCredentialStore({ safeStorage, filePath: file, env: { OPENAI_API_KEY: 'secret' } });
  assert.equal(s.migrate('openai', 'OPENAI_API_KEY'), true);
  assert.equal(s.get('openai'), 'secret');
  assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /secret/);
  fs.unlinkSync(file);
});
