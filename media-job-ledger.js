'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
const ACTIVE = new Set(['queued', 'loading', 'generating', 'saving', 'transferring', 'archiving']);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function now() { return new Date().toISOString(); }

function createMediaJobLedger(filePath) {
  const target = path.resolve(filePath);
  function readState() {
    try {
      const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
      return parsed?.version === 1 && Array.isArray(parsed.jobs) ? parsed : { version: 1, jobs: [] };
    } catch { return { version: 1, jobs: [] }; }
  }
  function writeState(state) {
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    const temp = `${target}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
    fs.renameSync(temp, target);
  }
  function sanitizePayload(payload = {}) {
    return {
      kind: String(payload.kind || 'image'),
      prompt: String(payload.prompt || ''),
      negativePrompt: String(payload.negativePrompt || ''),
      sourceArtifact: payload.sourceArtifact ? String(payload.sourceArtifact) : null,
      sessionId: String(payload.sessionId || crypto.randomUUID()),
      workflowId: payload.workflowId ? String(payload.workflowId) : null,
      checkpoint: payload.checkpoint ? String(payload.checkpoint) : null,
      vae: payload.vae ? String(payload.vae) : null,
      upscaler: payload.upscaler ? String(payload.upscaler) : null,
      controlnet: payload.controlnet ? String(payload.controlnet) : null,
      controlStrength: Number.isFinite(payload.controlStrength) ? Number(payload.controlStrength) : null,
      controlStart: Number.isFinite(payload.controlStart) ? Number(payload.controlStart) : null,
      controlEnd: Number.isFinite(payload.controlEnd) ? Number(payload.controlEnd) : null,
      seed: Number.isSafeInteger(payload.seed) ? payload.seed : null,
      sampler: payload.sampler ? String(payload.sampler) : null,
      scheduler: payload.scheduler ? String(payload.scheduler) : null,
      steps: Number.isFinite(payload.steps) ? Number(payload.steps) : null,
      cfg: Number.isFinite(payload.cfg) ? Number(payload.cfg) : null,
      width: Number.isFinite(payload.width) ? Number(payload.width) : null,
      height: Number.isFinite(payload.height) ? Number(payload.height) : null,
      batch: Number.isFinite(payload.batch) ? Number(payload.batch) : null,
      denoise: Number.isFinite(payload.denoise) ? Number(payload.denoise) : null,
      revisionStrength: Number.isFinite(payload.revisionStrength) ? Number(payload.revisionStrength) : null,
      scaleBy: Number.isFinite(payload.scaleBy) ? Number(payload.scaleBy) : null,
      references: Array.isArray(payload.references) ? payload.references.map(String).slice(0, 20) : []
    };
  }
  function create(payload = {}, options = {}) {
    const state = readState();
    const requestId = String(payload.requestId || crypto.randomUUID());
    const existing = state.jobs.find(job => job.requestId === requestId);
    if (existing) return { job: clone(existing), created: false };
    const timestamp = now();
    const cleanPayload = sanitizePayload(payload);
    const job = {
      requestId,
      sessionId: cleanPayload.sessionId,
      parentRequestId: options.parentRequestId ? String(options.parentRequestId) : null,
      parentRevision: options.parentRevision ? String(options.parentRevision) : null,
      attempt: Number(options.attempt || 1),
      route: 'comfyui-local',
      workflow: null,
      parameters: cleanPayload,
      status: 'queued',
      stage: 'queue',
      progress: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      startedAt: null,
      completedAt: null,
      promptId: null,
      errors: [],
      artifacts: []
    };
    state.jobs.unshift(job);
    state.jobs = state.jobs.slice(0, 500);
    writeState(state);
    return { job: clone(job), created: true };
  }
  function update(requestId, patch = {}) {
    const state = readState();
    const index = state.jobs.findIndex(job => job.requestId === String(requestId));
    if (index < 0) throw new Error('Media job was not found.');
    const current = state.jobs[index];
    const next = { ...current, ...clone(patch), requestId: current.requestId, updatedAt: now() };
    if (patch.error) next.errors = [...(current.errors || []), { at: now(), message: String(patch.error).slice(0, 1000) }];
    delete next.error;
    if (!next.startedAt && ACTIVE.has(next.status)) next.startedAt = now();
    if (TERMINAL.has(next.status) && !next.completedAt) next.completedAt = now();
    state.jobs[index] = next;
    writeState(state);
    return clone(next);
  }
  function get(requestId) { return clone(readState().jobs.find(job => job.requestId === String(requestId)) || null); }
  function list(limit = 100) { return clone(readState().jobs.slice(0, Math.min(500, Math.max(1, Number(limit) || 100)))); }
  function recoverInterrupted() {
    const state = readState();
    let changed = false;
    for (const job of state.jobs) {
      if (ACTIVE.has(job.status)) {
        job.status = 'recoverable';
        job.stage = 'paused';
        job.progress = Math.min(95, Number(job.progress) || 0);
        job.updatedAt = now();
        job.errors = [...(job.errors || []), { at: now(), message: 'Application or worker stopped before completion; job can be resumed.' }];
        changed = true;
      }
    }
    if (changed) writeState(state);
    return list();
  }
  function fork(requestId, mode) {
    const source = get(requestId);
    if (!source) throw new Error('Source media job was not found.');
    const payload = { ...source.parameters, requestId: crypto.randomUUID() };
    return create(payload, {
      parentRequestId: source.requestId,
      parentRevision: source.parentRevision,
      attempt: mode === 'retry' ? Number(source.attempt || 1) + 1 : 1
    });
  }
  function clear() { const removed = readState().jobs.length; writeState({ version: 1, jobs: [] }); return { removed }; }
  return { create, update, get, list, recoverInterrupted, fork, clear, filePath: target };
}

module.exports = { createMediaJobLedger, ACTIVE, TERMINAL };
