'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function now() { return new Date().toISOString(); }
function writeAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file);
}

function createAgentTaskLedger(file) {
  let state;
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { state = { version: 1, tasks: [] }; }
  if (!Array.isArray(state.tasks)) state.tasks = [];
  for (const task of state.tasks) if (['planning', 'executing', 'verifying', 'repairing'].includes(task.status)) { task.status = 'recoverable'; task.updatedAt = now(); }
  writeAtomic(file, state);
  const save = () => writeAtomic(file, state);
  return {
    create(input = {}) {
      const idempotencyKey = String(input.idempotencyKey || '').trim();
      if (idempotencyKey) { const existing = state.tasks.find(task => task.idempotencyKey === idempotencyKey && task.status !== 'failed'); if (existing) return existing; }
      const task = { id: crypto.randomUUID(), idempotencyKey, objective: String(input.objective || ''), acceptance: Array.isArray(input.acceptance) ? input.acceptance.map(String) : [], status: 'understanding', stage: 'understand', plan: [], history: [], artifacts: [], errors: [], retries: 0, createdAt: now(), updatedAt: now() };
      state.tasks.unshift(task); save(); return task;
    },
    event(id, stage, detail = {}) {
      const task = state.tasks.find(item => item.id === id); if (!task) throw new Error('Unknown agent task.');
      task.stage = stage; task.status = detail.status || task.status; task.updatedAt = now();
      task.history.push({ at: task.updatedAt, stage, ...detail });
      if (detail.error) task.errors.push({ at: task.updatedAt, message: String(detail.error), kind: String(detail.kind || 'runtime') });
      if (detail.artifact) task.artifacts.push(detail.artifact);
      save(); return task;
    },
    setPlan(id, plan) { const task = state.tasks.find(item => item.id === id); if (!task) throw new Error('Unknown agent task.'); task.plan = plan; task.status = 'planning'; task.updatedAt = now(); save(); return task; },
    get(id) { return state.tasks.find(item => item.id === id) || null; },
    list(limit = 50) { return state.tasks.slice(0, Math.max(1, Math.min(200, Number(limit) || 50))); },
    resume(id) { const task = state.tasks.find(item => item.id === id); if (!task) throw new Error('Unknown agent task.'); if (!['recoverable', 'failed', 'paused'].includes(task.status)) return task; task.status = 'understanding'; task.updatedAt = now(); task.history.push({ at: task.updatedAt, stage: 'resume', status: 'understanding' }); save(); return task; }
  };
}

module.exports = { createAgentTaskLedger };
