'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const JOB_KINDS = Object.freeze(['transcription', 'narration', 'dialogue', 'effects', 'mux']);
const PROVIDERS = Object.freeze(['whisper.cpp', 'macos-say', 'elevenlabs', 'local-file', 'ffmpeg']);
const TERMINAL = new Set(['completed', 'failed', 'cancelled']);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function now() { return new Date().toISOString(); }
function safeName(value, fallback = 'audio') { return String(value || fallback).replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 96) || fallback; }
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }

function normalizeSpeechContract(input = {}) {
  const kind = String(input.kind || 'narration').toLowerCase();
  if (!['narration', 'dialogue'].includes(kind)) throw new Error('Speech jobs must be narration or dialogue.');
  const provider = String(input.provider || 'macos-say').toLowerCase();
  if (!['macos-say', 'elevenlabs'].includes(provider)) throw new Error('Speech provider must be macos-say or elevenlabs.');
  const text = String(input.text || '').trim();
  if (!text || text.length > 20000) throw new Error('Speech text must contain 1–20,000 characters.');
  return {
    kind, provider, text, voice: String(input.voice || '').trim(), model: String(input.model || '').trim(),
    format: String(input.format || 'wav').toLowerCase(), sampleRate: Math.min(96000, Math.max(8000, Number(input.sampleRate) || 48000)),
    channels: Math.min(2, Math.max(1, Number(input.channels) || 1)), language: String(input.language || 'en'),
    cueId: safeName(input.cueId || crypto.randomUUID(), 'cue'), startMs: Math.max(0, Number(input.startMs) || 0),
    durationMs: Number.isFinite(input.durationMs) ? Math.max(0, Number(input.durationMs)) : null,
    metadata: input.metadata && typeof input.metadata === 'object' ? clone(input.metadata) : {}
  };
}

function createAudioJobStore(filePath, archiveRoot) {
  const target = path.resolve(filePath);
  const archive = path.resolve(archiveRoot);
  function read() { try { const value = JSON.parse(fs.readFileSync(target, 'utf8')); return value?.version === 1 && Array.isArray(value.jobs) ? value : { version: 1, jobs: [] }; } catch { return { version: 1, jobs: [] }; } }
  function write(state) { fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); const temp = `${target}.${process.pid}.tmp`; fs.writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 }); fs.renameSync(temp, target); }
  function create(input = {}) {
    const kind = String(input.kind || 'narration').toLowerCase();
    if (!JOB_KINDS.includes(kind)) throw new Error(`Unsupported audio job kind: ${kind}.`);
    const provider = String(input.provider || (kind === 'mux' ? 'ffmpeg' : 'local-file')).toLowerCase();
    if (!PROVIDERS.includes(provider)) throw new Error(`Unsupported audio provider: ${provider}.`);
    const state = read(); const id = String(input.id || crypto.randomUUID());
    const existing = state.jobs.find(job => job.id === id); if (existing) return clone(existing);
    const job = { id, sessionId: String(input.sessionId || crypto.randomUUID()), parentId: input.parentId ? String(input.parentId) : null,
      kind, provider, model: String(input.model || ''), voice: String(input.voice || ''), status: 'queued', stage: 'queue',
      cue: { id: safeName(input.cueId || id), startMs: Math.max(0, Number(input.startMs) || 0), durationMs: input.durationMs == null ? null : Math.max(0, Number(input.durationMs) || 0) },
      inputs: Array.isArray(input.inputs) ? input.inputs.map(String).slice(0, 100) : [], parameters: clone(input.parameters || {}), artifacts: [], errors: [],
      createdAt: now(), updatedAt: now(), completedAt: null };
    state.jobs.unshift(job); state.jobs = state.jobs.slice(0, 1000); write(state); return clone(job);
  }
  function update(id, patch = {}) { const state = read(); const index = state.jobs.findIndex(job => job.id === String(id)); if (index < 0) throw new Error('Audio job was not found.'); const current = state.jobs[index]; const next = { ...current, ...clone(patch), id: current.id, updatedAt: now() }; if (patch.error) next.errors = [...current.errors, { at: now(), message: String(patch.error).slice(0, 2000) }]; delete next.error; if (TERMINAL.has(next.status) && !next.completedAt) next.completedAt = now(); state.jobs[index] = next; write(state); return clone(next); }
  function addArtifact(id, bytes, info = {}) { const job = read().jobs.find(item => item.id === String(id)); if (!job) throw new Error('Audio job was not found.'); const extension = safeName(info.extension || 'wav').replace(/^\./, ''); const directory = path.join(archive, safeName(job.sessionId), safeName(job.id)); fs.mkdirSync(directory, { recursive: true, mode: 0o700 }); const digest = sha256(bytes); const filename = `${safeName(info.name || job.kind)}-${digest.slice(0, 12)}.${extension}`; const absolutePath = path.join(directory, filename); fs.writeFileSync(absolutePath, bytes, { mode: 0o600 }); const artifact = { filename, path: absolutePath, sha256: digest, mime: String(info.mime || 'audio/wav'), role: String(info.role || job.kind), bytes: bytes.length, createdAt: now() }; const updated = update(id, { artifacts: [...job.artifacts, artifact] }); return { artifact: clone(artifact), job: updated }; }
  function list(limit = 100) { return clone(read().jobs.slice(0, Math.min(1000, Math.max(1, Number(limit) || 100)))); }
  function get(id) { return clone(read().jobs.find(job => job.id === String(id)) || null); }
  return { create, update, addArtifact, list, get, filePath: target, archiveRoot: archive };
}

module.exports = { JOB_KINDS, PROVIDERS, normalizeSpeechContract, createAudioJobStore, sha256 };
