const test = require('node:test');
const assert = require('node:assert/strict');
const { MICROPHONE_SETTINGS_URL, isGranted, recoveryMessage } = require('../microphone-access');
test('microphone recovery identifies the macOS denial path', () => {
  assert.equal(isGranted('granted'), true);
  assert.equal(isGranted('denied'), false);
  assert.match(recoveryMessage('denied'), /Open Microphone Settings/);
  assert.match(MICROPHONE_SETTINGS_URL, /^x-apple\.systempreferences:/);
});
