const test = require('node:test');
const assert = require('node:assert/strict');
const { createWindowsWorkerControl, privateHost, parseStatus } = require('../windows-worker-control');

test('Windows worker control derives only a private endpoint host', () => {
  assert.equal(privateHost('http://192.168.4.31:8188'), '192.168.4.31');
  assert.throws(() => privateHost('https://example.com'), /HTTP URL|private/);
});

test('Windows worker control uses fixed SSH and PowerShell arguments', async () => {
  let received;
  const control = createWindowsWorkerControl({ baseUrl: 'http://192.168.4.31:8188', homeDir: '/Users/test', execFile: async (...args) => { received = args; return { stdout: 'ApiHealthy : True' }; } });
  const result = await control.restart();
  assert.equal(received[0], '/usr/bin/ssh');
  assert.ok(received[1].includes('decke@192.168.4.31'));
  assert.match(received[1].at(-1), /^powershell\.exe .*-Command .*manage-comfyui-worker\.ps1.*-Action Restart"$/);
  assert.equal(received[1].filter(value => value === 'powershell.exe').length, 0);
  assert.equal(result.action, 'Restart');
});

test('Windows worker status is reduced to bounded operational evidence', () => {
  assert.deepEqual(parseStatus('TaskInstalled : True\r\nTaskState : Running\r\nProcessIds : 12, 34\r\nApiHealthy : True\r\nLog : C:\\secret-path'), {
    taskInstalled: true, taskState: 'Running', processIds: ['12', '34'], apiHealthy: true
  });
});

test('Windows worker control rejects unsafe usernames', () => {
  assert.throws(() => createWindowsWorkerControl({ baseUrl: 'http://192.168.4.31:8188', homeDir: '/tmp', user: 'name;whoami', execFile: async () => ({ stdout: '' }) }), /user is invalid/);
});
