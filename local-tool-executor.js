'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// This is deliberately a catalog, not a command runner.  Each adapter has a
// fixed executable and fixed arguments; renderer input is never passed to a shell.
const LOCAL_TOOL_IDS = Object.freeze([
  'diagnostics.local_runtime',
  'diagnostics.git_status',
  'project.list_files',
  'project.read_text_file',
  'project.preview_replace',
  'project.replace_text',
  'project.rollback_edit',
  'project.run_tests',
  'artifacts.list'
]);

function truncate(value, limit = 8000) {
  const text = String(value || '').trim();
  return text.length > limit ? `${text.slice(0, limit)}\n[output truncated]` : text;
}

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function replacementDiff(relativePath, oldText, newText) {
  const removed = String(oldText).split(/\r?\n/).map(line => `-${line}`).join('\n');
  const added = String(newText).split(/\r?\n/).map(line => `+${line}`).join('\n');
  return truncate(`--- a/${relativePath}\n+++ b/${relativePath}\n@@ exact replacement @@\n${removed}\n${added}`, 5000);
}

function containedPath(root, relativePath) {
  const target = path.resolve(root, String(relativePath || '.'));
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error('Path must stay inside the approved project.');
  return target;
}

function createLocalToolExecutor({ appVersion, projectDir, artifactDirs = [], editHistoryDir, execFile }) {
  if (typeof execFile !== 'function') throw new Error('A fixed-command executor is required.');
  const safeProjectDir = path.resolve(projectDir);
  const historyRoot = path.resolve(editHistoryDir || path.join(safeProjectDir, '.master-chief-edit-history'));
  function atomicWrite(target, content, mode) { const temp = `${target}.${process.pid}.agent-edit.tmp`; fs.writeFileSync(temp, content, { mode }); fs.renameSync(temp, target); }
  function receiptPath(kind, id) { if (!/^[a-f0-9-]{36}$/.test(String(id || ''))) throw new Error(`A valid ${kind} receipt is required.`); return path.join(historyRoot, `${kind}-${id}.json`); }
  function readReceipt(kind, id) { const file = receiptPath(kind, id); if (!fs.existsSync(file)) throw new Error(`${kind === 'preview' ? 'Preview' : 'Rollback'} receipt was not found or has expired.`); return { file, value: JSON.parse(fs.readFileSync(file, 'utf8')) }; }
  function writeReceipt(kind, id, value) { fs.mkdirSync(historyRoot, { recursive: true, mode: 0o700 }); const file = receiptPath(kind, id); fs.writeFileSync(file, JSON.stringify(value), { mode: 0o600 }); return file; }
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
      if (id === 'project.preview_replace') {
        const relativePath = String(input.path || '').trim(); const oldText = String(input.oldText || ''); const newText = String(input.newText || '');
        if (!relativePath || !oldText) throw new Error('A project-relative path and non-empty oldText are required.');
        if (oldText.length > 20000 || newText.length > 20000) throw new Error('A single replacement is limited to 20,000 characters.');
        const target = containedPath(safeProjectDir, relativePath); const stat = fs.statSync(target);
        if (!stat.isFile() || stat.size > 512 * 1024) throw new Error('File must be a text file no larger than 512 KB.');
        const original = fs.readFileSync(target, 'utf8'); if (original.includes('\u0000')) throw new Error('Binary files are not supported by this tool.');
        const occurrences = original.split(oldText).length - 1;
        if (occurrences !== 1) throw new Error(`oldText must match exactly once; found ${occurrences}.`);
        const updated = original.replace(oldText, newText); const previewId = crypto.randomUUID();
        const receipt = { previewId, path: relativePath, oldText, newText, beforeSha256: sha256(original), afterSha256: sha256(updated), changedBytes: Buffer.byteLength(updated) - Buffer.byteLength(original), createdAt: new Date().toISOString() };
        writeReceipt('preview', previewId, receipt);
        return { tool: id, result: { ...receipt, diff: replacementDiff(relativePath, oldText, newText) }, summary: `Previewed one exact replacement in ${relativePath}; apply with preview receipt ${previewId}.` };
      }
      if (id === 'project.replace_text') {
        const { file: previewFile, value: preview } = readReceipt('preview', input.previewId);
        const target = containedPath(safeProjectDir, preview.path); const stat = fs.statSync(target); const original = fs.readFileSync(target, 'utf8');
        if (sha256(original) !== preview.beforeSha256) throw new Error('The file changed after preview. Create a fresh preview before applying.');
        const updated = original.replace(preview.oldText, preview.newText);
        if (sha256(updated) !== preview.afterSha256) throw new Error('Preview verification failed; no change was written.');
        atomicWrite(target, updated, stat.mode); const rollbackId = crypto.randomUUID();
        writeReceipt('rollback', rollbackId, { rollbackId, path: preview.path, beforeSha256: preview.beforeSha256, afterSha256: preview.afterSha256, original, createdAt: new Date().toISOString() });
        fs.unlinkSync(previewFile);
        return { tool: id, result: { path: preview.path, previewId: preview.previewId, rollbackId, beforeSha256: preview.beforeSha256, afterSha256: preview.afterSha256, changedBytes: preview.changedBytes }, summary: `Applied the verified preview to ${preview.path}. Rollback receipt: ${rollbackId}.` };
      }
      if (id === 'project.rollback_edit') {
        const { file: rollbackFile, value: rollback } = readReceipt('rollback', input.rollbackId); const target = containedPath(safeProjectDir, rollback.path);
        const stat = fs.statSync(target); const current = fs.readFileSync(target, 'utf8');
        if (sha256(current) !== rollback.afterSha256) throw new Error('The file changed after this edit. Rollback stopped to preserve newer work.');
        atomicWrite(target, rollback.original, stat.mode); fs.unlinkSync(rollbackFile);
        return { tool: id, result: { path: rollback.path, rollbackId: rollback.rollbackId, restoredSha256: rollback.beforeSha256 }, summary: `Rolled back the verified edit to ${rollback.path}.` };
      }
      if (id === 'project.run_tests') {
        const result = await execFile('npm', ['test'], { cwd: safeProjectDir, timeout: 180000, maxBuffer: 2 * 1024 * 1024, windowsHide: true });
        const output = truncate(result.stdout || result.stderr || 'Tests completed.', 12000);
        return { tool: id, result: { output }, summary: 'Completed the fixed project test command.' };
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
