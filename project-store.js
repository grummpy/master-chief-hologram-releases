'use strict';

const fs = require('fs');
const path = require('path');

function safeName(value, fallback = 'Untitled Project') {
  const clean = String(value || '').trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, '-').replace(/\s+/g, ' ').slice(0, 120);
  return clean || fallback;
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function createProjectStore(root) {
  const base = path.resolve(root);
  fs.mkdirSync(base, { recursive: true, mode: 0o700 });
  function resolveProject(name) {
    const target = path.join(base, safeName(name));
    if (!inside(base, target)) throw new Error('Invalid project name.');
    return target;
  }
  function create(name) {
    const target = resolveProject(name);
    fs.mkdirSync(target, { recursive: true, mode: 0o700 });
    const manifest = path.join(target, 'project.json');
    if (!fs.existsSync(manifest)) fs.writeFileSync(manifest, JSON.stringify({ name: path.basename(target), createdAt: new Date().toISOString(), protectedFromClear: true }, null, 2), { mode: 0o600 });
    return { name: path.basename(target), path: target };
  }
  function list() {
    if (!fs.existsSync(base)) return [];
    return fs.readdirSync(base, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => {
      const target = path.join(base, entry.name);
      const files = fs.readdirSync(target, { withFileTypes: true }).filter(item => item.isFile() && item.name !== 'project.json').map(item => {
        const stat = fs.statSync(path.join(target, item.name));
        return { name: item.name, bytes: stat.size, modifiedAt: stat.mtime.toISOString() };
      }).sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
      return { name: entry.name, path: target, files };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }
  function importFile(projectName, sourcePath) {
    const project = create(projectName);
    const source = path.resolve(String(sourcePath || ''));
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error('The source artifact is unavailable.');
    const filename = safeName(path.basename(source), 'artifact');
    let destination = path.join(project.path, filename);
    if (fs.existsSync(destination)) destination = path.join(project.path, `${path.parse(filename).name}-${Date.now()}${path.extname(filename)}`);
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    return { project: project.name, name: path.basename(destination), path: destination };
  }
  return { root: base, create, list, importFile, resolveProject };
}

module.exports = { createProjectStore, safeName };
