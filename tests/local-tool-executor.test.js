const test = require('node:test');
const assert = require('node:assert/strict');
const { createLocalToolExecutor } = require('../local-tool-executor');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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

test('project reader cannot escape its approved root', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-tools-'));
  fs.writeFileSync(path.join(root, 'notes.txt'), 'verified project text');
  const executor = createLocalToolExecutor({ appVersion: '1.2.3', projectDir: root, execFile: async () => ({ stdout: '' }) });
  const report = await executor.execute('project.read_text_file', { path: 'notes.txt' });
  assert.equal(report.result.content, 'verified project text');
  await assert.rejects(() => executor.execute('project.read_text_file', { path: '../outside.txt' }), /inside the approved project/);
});

test('artifact listing returns bounded metadata', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-artifacts-'));
  fs.writeFileSync(path.join(root, 'brief.docx'), 'artifact');
  const executor = createLocalToolExecutor({ appVersion: '1.2.3', projectDir: root, artifactDirs: [root], execFile: async () => ({ stdout: '' }) });
  const report = await executor.execute('artifacts.list');
  assert.equal(report.result.artifacts[0].name, 'brief.docx');
});
