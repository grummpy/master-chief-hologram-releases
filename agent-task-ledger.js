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
  for (const task of state.tasks) {
    task.cursor = Number.isInteger(task.cursor) ? task.cursor : 0;
    task.receipts = Array.isArray(task.receipts) ? task.receipts : [];
    task.compensations = Array.isArray(task.compensations) ? task.compensations : [];
    if (['planning', 'executing', 'verifying', 'repairing'].includes(task.status)) { task.status = 'recoverable'; task.updatedAt = now(); }
  }
  writeAtomic(file, state);
  const save = () => writeAtomic(file, state);
  return {
    create(input = {}) {
      const idempotencyKey = String(input.idempotencyKey || '').trim();
      if (idempotencyKey) { const existing = state.tasks.find(task => task.idempotencyKey === idempotencyKey && task.status !== 'failed'); if (existing) return existing; }
      const task = { id: crypto.randomUUID(), idempotencyKey, objective: String(input.objective || ''), acceptance: Array.isArray(input.acceptance) ? input.acceptance.map(String) : [], status: 'understanding', stage: 'understand', plan: [], cursor: 0, receipts: [], compensations: [], history: [], artifacts: [], errors: [], retries: 0, createdAt: now(), updatedAt: now() };
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
    checkpoint(id, input = {}) {
      const task = state.tasks.find(item => item.id === id); if (!task) throw new Error('Unknown agent task.');
      const cursor = Number(input.cursor); if (!Number.isInteger(cursor) || cursor < 0 || cursor > task.plan.length) throw new Error('Invalid agent task cursor.');
      if (cursor !== task.cursor && cursor !== task.cursor + 1) throw new Error('Agent task checkpoints must advance exactly one step.');
      if (cursor === task.cursor + 1 && (!input.receipt || String(input.receipt.id || '') !== String(task.plan[cursor - 1]?.id || ''))) throw new Error('Agent task receipt does not match the completed step.');
      task.cursor = cursor;
      if (input.receipt) {
        const receipt = { ...input.receipt, idempotencyKey: String(input.receipt.idempotencyKey || '') };
        if (!receipt.idempotencyKey) throw new Error('Agent task receipt requires an idempotency key.');
        const existing = task.receipts.findIndex(item => item.idempotencyKey && item.idempotencyKey === receipt.idempotencyKey);
        if (existing >= 0) task.receipts[existing] = receipt; else task.receipts.push(receipt);
      }
      if (input.compensation) task.compensations.push(input.compensation);
      task.stage = cursor >= task.plan.length ? 'verify' : `step:${task.plan[cursor]?.id || cursor}`;
      task.status = input.status || (cursor >= task.plan.length ? 'verifying' : 'executing'); task.updatedAt = now(); save(); return task;
    },
    get(id) { return state.tasks.find(item => item.id === id) || null; },
    list(limit = 50) { return state.tasks.slice(0, Math.max(1, Math.min(200, Number(limit) || 50))); },
    action(id, action) {
      const task = state.tasks.find(item => item.id === id); if (!task) throw new Error('Unknown agent task.');
      if (action === 'resume') { if (!['recoverable', 'failed', 'paused', 'cancelled'].includes(task.status)) return task; task.status = task.cursor >= task.plan.length && task.plan.length ? 'verifying' : 'executing'; task.stage = task.cursor >= task.plan.length && task.plan.length ? 'verify' : `step:${task.plan[task.cursor]?.id || task.cursor}`; }
      else if (action === 'pause') { if (['complete', 'failed', 'cancelled'].includes(task.status)) return task; task.status = 'paused'; task.stage = 'paused'; }
      else if (action === 'cancel') { if (task.status === 'complete') return task; task.status = 'cancelled'; task.stage = 'cancelled'; }
      else throw new Error('Unknown agent task action.');
      task.updatedAt = now(); task.history.push({ at: task.updatedAt, stage: task.stage, status: task.status }); save(); return task;
    },
    resume(id) { return this.action(id, 'resume'); }
  };
}

module.exports = { createAgentTaskLedger };
