'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createSchedulerStore(filePath, clock = () => Date.now()) {
  function blank() { return { version: 1, jobs: [] }; }
  function load() { try { const value = JSON.parse(fs.readFileSync(filePath, 'utf8')); return value?.version === 1 && Array.isArray(value.jobs) ? value : blank(); } catch { return blank(); } }
  function save(state) { fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 }); const temp = `${filePath}.${process.pid}.tmp`; fs.writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 }); fs.renameSync(temp, filePath); }
  function cleanText(value, field, max) { const text = String(value || '').trim(); if (!text || text.length > max) throw new Error(`${field} is required and must be ${max} characters or fewer.`); return text; }
  function find(state, id) { const job = state.jobs.find(item => item.id === String(id || '')); if (!job) throw new Error('Scheduled reminder was not found.'); return job; }
  function list() { return load().jobs.slice().sort((a, b) => String(a.nextRunAt || '9999').localeCompare(String(b.nextRunAt || '9999'))); }
  function create(input = {}) {
    const title = cleanText(input.title, 'Title', 160); const message = cleanText(input.message, 'Reminder', 2000);
    const dueMs = Date.parse(String(input.dueAt || '')); if (!Number.isFinite(dueMs) || dueMs < clock() - 60000) throw new Error('Choose a valid future date and time.');
    const intervalMinutes = Number(input.intervalMinutes || 0); if (!Number.isInteger(intervalMinutes) || intervalMinutes < 0 || intervalMinutes > 525600 || (intervalMinutes > 0 && intervalMinutes < 1)) throw new Error('Repeat interval must be 0 or between 1 and 525600 minutes.');
    const job = { id: crypto.randomUUID(), title, message, status: 'active', createdAt: new Date(clock()).toISOString(), nextRunAt: new Date(dueMs).toISOString(), intervalMinutes, lastRunAt: null, history: [] };
    const state = load(); state.jobs.unshift(job); state.jobs = state.jobs.slice(0, 200); save(state); return { ...job };
  }
  function action(id, requested) {
    const state = load(); const job = find(state, id); const now = new Date(clock()).toISOString();
    if (requested === 'pause') { if (job.status !== 'active') throw new Error('Only active reminders can be paused.'); job.status = 'paused'; }
    else if (requested === 'resume') { if (job.status !== 'paused') throw new Error('Only paused reminders can be resumed.'); job.status = 'active'; if (Date.parse(job.nextRunAt) < clock()) job.nextRunAt = now; }
    else if (requested === 'cancel') { if (['completed','cancelled'].includes(job.status)) throw new Error('This reminder is already finished.'); job.status = 'cancelled'; job.nextRunAt = null; }
    else throw new Error('Unknown scheduler action.');
    job.history.unshift({ at: now, event: requested }); job.history = job.history.slice(0, 50); save(state); return { ...job };
  }
  function tick(at = clock()) {
    const state = load(); const due = [];
    for (const job of state.jobs) {
      if (job.status !== 'active' || !job.nextRunAt || Date.parse(job.nextRunAt) > at) continue;
      const deliveredAt = new Date(at).toISOString(); job.lastRunAt = deliveredAt; job.history.unshift({ at: deliveredAt, event: 'delivered' }); job.history = job.history.slice(0, 50); due.push({ ...job });
      if (job.intervalMinutes > 0) { let next = Date.parse(job.nextRunAt); const step = job.intervalMinutes * 60000; while (next <= at) next += step; job.nextRunAt = new Date(next).toISOString(); }
      else { job.status = 'completed'; job.nextRunAt = null; }
    }
    if (due.length) save(state); return due;
  }
  return { list, create, action, tick };
}

module.exports = { createSchedulerStore };
