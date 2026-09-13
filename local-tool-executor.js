'use strict';

const path = require('path');

// This is deliberately a catalog, not a command runner.  Each adapter has a
// fixed executable and fixed arguments; renderer input is never passed to a shell.
const LOCAL_TOOL_IDS = Object.freeze(['diagnostics.local_runtime', 'diagnostics.git_status']);

function truncate(value, limit = 8000) {
  const text = String(value || '').trim();
  return text.length > limit ? `${text.slice(0, limit)}\n[output truncated]` : text;
}

function createLocalToolExecutor({ appVersion, projectDir, execFile }) {
  if (typeof execFile !== 'function') throw new Error('A fixed-command executor is required.');
  const safeProjectDir = path.resolve(projectDir);
  return {
    ids: LOCAL_TOOL_IDS,
    async execute(id) {
      if (id === 'diagnostics.local_runtime') {
        return {
          tool: id,
          result: { appVersion, platform: process.platform, arch: process.arch, node: process.versions.node },
          summary: `Runtime ready: ${process.platform}/${process.arch}, Node ${process.versions.node}.`
        };
      }
      if (id === 'diagnostics.git_status') {
        const result = await execFile('git', ['status', '--short', '--branch'], {
          cwd: safeProjectDir,
          timeout: 10000,
          maxBuffer: 32 * 1024,
          windowsHide: true
        });
        const output = truncate(result.stdout || result.stderr || 'Working tree is clean.');
        return { tool: id, result: { output }, summary: output };
      }
      throw new Error('This local tool is not allowlisted.');
    }
  };
}

module.exports = { LOCAL_TOOL_IDS, createLocalToolExecutor };
