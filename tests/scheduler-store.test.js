'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createSchedulerStore } = require('../scheduler-store');

test('one-time reminders survive restart and complete exactly once', () => {
  let now = Date.parse('2026-09-19T12:00:00Z'); const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mc-schedule-')), 'jobs.json');
  let store = createSchedulerStore(file, () => now); const job = store.create({ title: 'Check worker', message: 'Review ComfyUI health', dueAt: '2026-09-19T12:01:00Z' });
  store = createSchedulerStore(file, () => now); assert.equal(store.list()[0].id, job.id); assert.equal(store.tick().length, 0);
  now += 60000; assert.equal(store.tick().length, 1); assert.equal(store.tick().length, 0); assert.equal(store.list()[0].status, 'completed');
});

test('repeating reminders advance past downtime and support pause resume cancel', () => {
  let now = Date.parse('2026-09-19T12:00:00Z'); const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mc-schedule-')), 'jobs.json'); const store = createSchedulerStore(file, () => now);
  const job = store.create({ title: 'Monthly statement', message: 'Upload the released statement', dueAt: '2026-09-19T12:01:00Z', intervalMinutes: 5 });
  store.action(job.id, 'pause'); now += 120000; assert.equal(store.tick().length, 0); store.action(job.id, 'resume'); assert.equal(store.tick().length, 1);
  now += 20 * 60000; assert.equal(store.tick().length, 1); assert.ok(Date.parse(store.list()[0].nextRunAt) > now); store.action(job.id, 'cancel'); assert.equal(store.list()[0].status, 'cancelled');
});
