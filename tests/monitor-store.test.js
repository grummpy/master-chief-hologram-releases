'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createMonitorStore } = require('../monitor-store');

test('monitor stays quiet while unchanged and flags state transitions', () => {
  let now = Date.parse('2026-09-19T12:00:00Z'); const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mc-monitor-')), 'monitors.json'); const store = createMonitorStore(file, () => now);
  const item = store.create({ target: 'ollama', intervalMinutes: 5 }); assert.equal(store.due().length, 1);
  const first = store.record(item.id, { state: 'ready', label: 'Ollama ready' }); assert.equal(first.changed, false); assert.equal(first.initial, true);
  now += 5 * 60000; const same = store.record(item.id, { state: 'ready', label: 'Ollama ready' }); assert.equal(same.changed, false);
  now += 5 * 60000; const changed = store.record(item.id, { state: 'error', label: 'Ollama unavailable' }); assert.equal(changed.changed, true);
});

test('monitor state survives restart and supports pause resume cancel', () => {
  let now = Date.parse('2026-09-19T12:00:00Z'); const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mc-monitor-')), 'monitors.json'); let store = createMonitorStore(file, () => now);
  const item = store.create({ target: 'comfyui', intervalMinutes: 10 }); store.action(item.id, 'pause'); store = createMonitorStore(file, () => now); assert.equal(store.due().length, 0);
  store.action(item.id, 'resume'); assert.equal(store.due().length, 1); store.action(item.id, 'cancel'); assert.equal(store.list()[0].status, 'cancelled');
});
