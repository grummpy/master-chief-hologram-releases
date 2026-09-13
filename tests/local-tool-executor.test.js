const test = require('node:test');
const assert = require('node:assert/strict');
const { createLocalToolExecutor } = require('../local-tool-executor');

test('runtime diagnostics are deterministic and need no command', async () => {
  const executor = createLocalToolExecutor({ appVersion: '1.2.3', projectDir: process.cwd(), execFile: async () => { throw new Error('must not execute'); } });
  const report = await executor.execute('diagnostics.local_runtime');
  assert.equal(report.result.appVersion, '1.2.3');
  assert.equal(report.tool, 'diagnostics.local_runtime');
});

test('Git status is a fixed read-only command in the configured project', async () => {
  let received;
  const executor = createLocalToolExecutor({ appVersion: '1.2.3', projectDir: '/tmp/project', execFile: async (...args) => { received = args; return { stdout: '## main\n' }; } });
  const report = await executor.execute('diagnostics.git_status');
  assert.equal(received[0], 'git');
  assert.deepEqual(received[1], ['status', '--short', '--branch']);
  assert.equal(received[2].cwd, '/tmp/project');
  assert.match(report.summary, /main/);
});

test('unlisted IDs cannot execute a command', async () => {
  const executor = createLocalToolExecutor({ appVersion: '1.2.3', projectDir: process.cwd(), execFile: async () => ({}) });
  await assert.rejects(() => executor.execute('shell.exec'), /not allowlisted/);
});
