'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TARGETS = Object.freeze(['ollama', 'comfyui']);

function createMonitorStore(filePath, clock = () => Date.now()) {
  function blank() { return { version: 1, monitors: [] }; }
  function load() { try { const value = JSON.parse(fs.readFileSync(filePath, 'utf8')); return value?.version === 1 && Array.isArray(value.monitors) ? value : blank(); } catch { return blank(); } }
  function save(state) { fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 }); const temp = `${filePath}.${process.pid}.tmp`; fs.writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 }); fs.renameSync(temp, filePath); }
  function list() { return load().monitors.slice().sort((a, b) => String(a.nextCheckAt || '9999').localeCompare(String(b.nextCheckAt || '9999'))); }
  function create(input = {}) {
    const target = String(input.target || ''); if (!TARGETS.includes(target)) throw new Error('Monitor target must be Ollama or ComfyUI.');
    const intervalMinutes = Number(input.intervalMinutes || 5); if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1 || intervalMinutes > 1440) throw new Error('Check interval must be between 1 and 1440 minutes.');
    const state = load(); const existing = state.monitors.find(item => item.target === target && !['cancelled'].includes(item.status)); if (existing) throw new Error(`A ${target} monitor already exists.`);
    const monitor = { id: crypto.randomUUID(), target, title: target === 'ollama' ? 'Ollama health' : 'ComfyUI worker health', status: 'active', intervalMinutes, createdAt: new Date(clock()).toISOString(), nextCheckAt: new Date(clock()).toISOString(), lastCheckAt: null, lastState: null, lastLabel: null, history: [] };
    state.monitors.unshift(monitor); save(state); return { ...monitor };
  }
  function action(id, requested) {
    const state = load(); const monitor = state.monitors.find(item => item.id === String(id || '')); if (!monitor) throw new Error('Monitor was not found.');
    if (requested === 'pause') { if (monitor.status !== 'active') throw new Error('Only active monitors can be paused.'); monitor.status = 'paused'; }
    else if (requested === 'resume') { if (monitor.status !== 'paused') throw new Error('Only paused monitors can be resumed.'); monitor.status = 'active'; monitor.nextCheckAt = new Date(clock()).toISOString(); }
    else if (requested === 'cancel') { monitor.status = 'cancelled'; monitor.nextCheckAt = null; }
    else throw new Error('Unknown monitor action.');
    monitor.history.unshift({ at: new Date(clock()).toISOString(), event: requested }); monitor.history = monitor.history.slice(0, 50); save(state); return { ...monitor };
  }
  function due(at = clock()) { return load().monitors.filter(item => item.status === 'active' && item.nextCheckAt && Date.parse(item.nextCheckAt) <= at).map(item => ({ ...item })); }
  function record(id, result, at = clock()) {
    const state = load(); const monitor = state.monitors.find(item => item.id === String(id || '')); if (!monitor) throw new Error('Monitor was not found.');
    const nextState = String(result?.state || 'error'); const label = String(result?.label || nextState).slice(0, 240); const changed = monitor.lastState !== null && (monitor.lastState !== nextState || monitor.lastLabel !== label);
    monitor.lastCheckAt = new Date(at).toISOString(); monitor.nextCheckAt = new Date(at + monitor.intervalMinutes * 60000).toISOString(); monitor.lastState = nextState; monitor.lastLabel = label;
    monitor.history.unshift({ at: monitor.lastCheckAt, event: 'check', state: nextState, label, changed }); monitor.history = monitor.history.slice(0, 50); save(state);
    return { monitor: { ...monitor }, changed, initial: monitor.history.length === 1 };
  }
  return { list, create, action, due, record };
}

module.exports = { TARGETS, createMonitorStore };
