'use strict';

const path = require('path');
const fs = require('fs');

// This is deliberately a catalog, not a command runner.  Each adapter has a
// fixed executable and fixed arguments; renderer input is never passed to a shell.
const LOCAL_TOOL_IDS = Object.freeze([
  'diagnostics.local_runtime',
  'diagnostics.git_status',
  'project.list_files',
  'project.read_text_file',
  'artifacts.list'
]);

function truncate(value, limit = 8000) {
  const text = String(value || '').trim();
  return text.length > limit ? `${text.slice(0, limit)}\n[output truncated]` : text;
}

function containedPath(root, relativePath) {
  const target = path.resolve(root, String(relativePath || '.'));
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error('Path must stay inside the approved project.');
  return target;
}

function createLocalToolExecutor({ appVersion, projectDir, artifactDirs = [], execFile }) {
  if (typeof execFile !== 'function') throw new Error('A fixed-command executor is required.');
  const safeProjectDir = path.resolve(projectDir);
  return {
    ids: LOCAL_TOOL_IDS,
    async execute(id, input = {}) {
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
      if (id === 'project.list_files') {
        const relativeDir = String(input.directory || '.');
        const cwd = containedPath(safeProjectDir, relativeDir);
        const result = await execFile('rg', ['--files', '-g', '!node_modules/**', '-g', '!dist/**'], {
          cwd, timeout: 10000, maxBuffer: 256 * 1024, windowsHide: true
        });
        const files = String(result.stdout || '').trim().split(/\r?\n/).filter(Boolean).slice(0, 1000);
        return { tool: id, result: { directory: relativeDir, files }, summary: `Listed ${files.length} project files under ${relativeDir}.` };
      }
      if (id === 'project.read_text_file') {
        const relativePath = String(input.path || '').trim();
        if (!relativePath) throw new Error('A project-relative file path is required.');
        const target = containedPath(safeProjectDir, relativePath);
        const stat = fs.statSync(target);
        if (!stat.isFile() || stat.size > 512 * 1024) throw new Error('File must be a text file no larger than 512 KB.');
        const content = fs.readFileSync(target, 'utf8');
        if (content.includes('\u0000')) throw new Error('Binary files are not supported by this tool.');
        return { tool: id, result: { path: relativePath, content: truncate(content, 12000) }, summary: `Read ${relativePath} (${stat.size} bytes).` };
      }
      if (id === 'artifacts.list') {
        const artifacts = [];
        for (const root of artifactDirs.map(item => path.resolve(item))) {
          if (!fs.existsSync(root)) continue;
          for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
            if (!entry.isFile()) continue;
            const target = path.join(root, entry.name); const stat = fs.statSync(target);
            artifacts.push({ name: entry.name, directory: root, size: stat.size, modifiedAt: stat.mtime.toISOString() });
          }
        }
        artifacts.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
        return { tool: id, result: { artifacts: artifacts.slice(0, 200) }, summary: `Found ${artifacts.length} generated artifacts.` };
      }
      throw new Error('This local tool is not allowlisted.');
    }
  };
}

module.exports = { LOCAL_TOOL_IDS, createLocalToolExecutor };
