'use strict';

const fs = require('fs');
const path = require('path');

function writeAtomic(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, file);
}

function createContextMemoryStore(file) {
  let state;
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { state = { version: 1, projects: {}, approvedPreferences: [] }; }
  if (!state.projects || typeof state.projects !== 'object') state.projects = {};
  if (!Array.isArray(state.approvedPreferences)) state.approvedPreferences = [];
  const save = () => writeAtomic(file, state);
  const bounded = value => String(value || '').trim().slice(0, 8000);
  return {
    get(project = 'default') { return { project: String(project), projectMemory: bounded(state.projects[String(project)] || ''), approvedPreferences: [...state.approvedPreferences] }; },
    setProject(project = 'default', value = '', approved = false) {
      if (!approved) throw new Error('Project memory requires explicit operator approval.');
      state.projects[String(project)] = bounded(value); save(); return this.get(project);
    },
    setPreferences(values = [], approved = false) {
      if (!approved) throw new Error('Preferences and corrections require explicit operator approval.');
      state.approvedPreferences = [...new Set((Array.isArray(values) ? values : [values]).map(bounded).filter(Boolean))].slice(0, 50); save(); return this.get('default');
    },
    clear(project = 'default', includePreferences = false) { delete state.projects[String(project)]; if (includePreferences) state.approvedPreferences = []; save(); return this.get(project); }
  };
}

module.exports = { createContextMemoryStore };
