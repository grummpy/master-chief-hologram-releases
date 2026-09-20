'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SHOT_STATUSES = new Set(['draft', 'queued', 'running', 'complete', 'failed', 'cancelled', 'recoverable']);
const REVIEW_STATUSES = new Set(['candidate', 'approved', 'rejected']);
const REFERENCE_MODES = new Set(['approved', 'selected', 'none']);
const CONTROL_MODES = new Set(['revision', 'pose', 'faceid', 'canny', 'instantid', 'tile', 'poselora']);
const iso = () => new Date().toISOString();
const id = value => cleanText(value, 100) || crypto.randomUUID();
function cleanText(value, max = 4000) { return String(value || '').trim().slice(0, max); }
function number(value, fallback, min = 0, max = 1) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback; }
function integer(value, fallback, min, max) { const parsed = Number(value); return Number.isSafeInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback; }

function normalizeVariant(input = {}, existing = {}) {
  return {
    id: id(input.id || existing.id),
    artifact: cleanText(input.artifact ?? existing.artifact, 1000),
    sha256: cleanText(input.sha256 ?? existing.sha256, 64),
    requestId: cleanText(input.requestId ?? existing.requestId, 100),
    status: REVIEW_STATUSES.has(input.status) ? input.status : (existing.status || 'candidate'),
    annotation: cleanText(input.annotation ?? existing.annotation, 2000),
    parentVariantId: cleanText(input.parentVariantId ?? existing.parentVariantId, 100),
    branchLabel: cleanText(input.branchLabel ?? existing.branchLabel, 160),
    createdAt: existing.createdAt || iso(), updatedAt: iso()
  };
}

function normalizeShot(input = {}, existing = {}) {
  const status = SHOT_STATUSES.has(input.status) ? input.status : (existing.status || 'draft');
  return {
    id: id(input.id || existing.id),
    title: cleanText(input.title ?? existing.title, 160) || 'Untitled shot',
    positivePrompt: cleanText(input.positivePrompt ?? existing.positivePrompt),
    negativePrompt: cleanText(input.negativePrompt ?? existing.negativePrompt),
    referenceArtifact: cleanText(input.referenceArtifact ?? existing.referenceArtifact, 1000),
    pose: cleanText(input.pose ?? existing.pose, 1000), environment: cleanText(input.environment ?? existing.environment, 1000),
    camera: cleanText(input.camera ?? existing.camera, 1000), lighting: cleanText(input.lighting ?? existing.lighting, 1000),
    model: cleanText(input.model ?? existing.model, 500), workflow: cleanText(input.workflow ?? existing.workflow, 200),
    referenceMode: REFERENCE_MODES.has(input.referenceMode) ? input.referenceMode : (existing.referenceMode || (cleanText(input.referenceArtifact ?? existing.referenceArtifact, 1000) ? 'selected' : 'approved')),
    referenceSha256: cleanText(input.referenceSha256 ?? existing.referenceSha256, 64),
    controlMode: CONTROL_MODES.has(input.controlMode) ? input.controlMode : (CONTROL_MODES.has(existing.controlMode) ? existing.controlMode : 'revision'),
    controlnet: cleanText(input.controlnet ?? existing.controlnet, 500) || 'OpenPoseXL2.safetensors',
    controlStrength: number(input.controlStrength ?? existing.controlStrength, 1, 0, 2), controlStart: number(input.controlStart ?? existing.controlStart, 0), controlEnd: number(input.controlEnd ?? existing.controlEnd, 1),
    faceIdV2Strength: number(input.faceIdV2Strength ?? existing.faceIdV2Strength, 1, -1, 5), faceIdLoraStrength: number(input.faceIdLoraStrength ?? existing.faceIdLoraStrength, .6, 0, 1),
    cannyLow: number(input.cannyLow ?? existing.cannyLow, .35, .01, .99), cannyHigh: number(input.cannyHigh ?? existing.cannyHigh, .75, .01, .99),
    instantIdControlStrength: number(input.instantIdControlStrength ?? existing.instantIdControlStrength, .8, 0, 10), instantIdNoise: number(input.instantIdNoise ?? existing.instantIdNoise, 0, 0, 1),
    seed: integer(input.seed ?? existing.seed, null, 1, 2147483646),
    sampler: cleanText(input.sampler ?? existing.sampler, 80) || 'dpmpp_2m', scheduler: cleanText(input.scheduler ?? existing.scheduler, 80) || 'karras',
    steps: integer(input.steps ?? existing.steps, 28, 1, 100), cfg: number(input.cfg ?? existing.cfg, 6.5, 0, 30),
    width: integer(input.width ?? existing.width, 768, 256, 2048), height: integer(input.height ?? existing.height, 1024, 256, 2048), batch: integer(input.batch ?? existing.batch, 1, 1, 4),
    continuityLocks: cleanText(input.continuityLocks ?? existing.continuityLocks, 2000),
    referenceStrength: number(input.referenceStrength ?? existing.referenceStrength, .75),
    denoise: number(input.denoise ?? existing.denoise, .84, .2, .99),
    status, requestId: cleanText(input.requestId ?? existing.requestId, 100),
    error: cleanText(input.error ?? existing.error, 1000),
    variants: Array.isArray(existing.variants) ? existing.variants : [],
    createdAt: existing.createdAt || iso(), updatedAt: iso()
  };
}

function normalizeView(input = {}, existing = {}) {
  return {
    id: id(input.id || existing.id), artifact: cleanText(input.artifact ?? existing.artifact, 1000),
    label: cleanText(input.label ?? existing.label, 160) || 'Reference view',
    view: cleanText(input.view ?? existing.view, 100), status: REVIEW_STATUSES.has(input.status) ? input.status : (existing.status || 'candidate'),
    annotation: cleanText(input.annotation ?? existing.annotation, 2000), parentViewId: cleanText(input.parentViewId ?? existing.parentViewId, 100),
    createdAt: existing.createdAt || iso(), updatedAt: iso()
  };
}

function normalizeSheet(input = {}, existing = {}) {
  return {
    id: id(input.id || existing.id), title: cleanText(input.title ?? existing.title, 160) || 'Primary reference sheet',
    appearanceNotes: cleanText(input.appearanceNotes ?? existing.appearanceNotes), palette: cleanText(input.palette ?? existing.palette, 2000),
    continuityLocks: cleanText(input.continuityLocks ?? existing.continuityLocks),
    approvedViews: Array.isArray(existing.approvedViews) ? existing.approvedViews : [], shots: Array.isArray(existing.shots) ? existing.shots : [],
    createdAt: existing.createdAt || iso(), updatedAt: iso()
  };
}

function normalizeSubject(input = {}, existing = {}) {
  return {
    id: id(input.id || existing.id), name: cleanText(input.name ?? existing.name, 160) || 'Commander Nova',
    appearanceNotes: cleanText(input.appearanceNotes ?? existing.appearanceNotes), palette: cleanText(input.palette ?? existing.palette, 2000),
    continuityLocks: cleanText(input.continuityLocks ?? input.identityLock ?? existing.continuityLocks ?? existing.identityLock),
    referenceSheets: Array.isArray(existing.referenceSheets) ? existing.referenceSheets : [], createdAt: existing.createdAt || iso(), updatedAt: iso()
  };
}

function normalizeProject(input = {}, existing = {}) {
  return { schemaVersion: 2, id: id(input.id || existing.id), title: cleanText(input.title ?? existing.title, 160) || 'Commander Nova project', subjects: Array.isArray(existing.subjects) ? existing.subjects : [], createdAt: existing.createdAt || iso(), updatedAt: iso() };
}

function migrate(state) {
  if (state?.schemaVersion === 2 && Array.isArray(state.projects)) return state;
  const projects = Array.isArray(state?.projects) ? state.projects.map(old => {
    const project = normalizeProject(old, {});
    const subject = normalizeSubject({ id: `${project.id}-subject`, name: old.subject?.name, continuityLocks: old.subject?.identityLock }, {});
    const sheet = normalizeSheet({ id: `${project.id}-sheet`, title: 'Migrated reference sheet', continuityLocks: old.subject?.identityLock }, {});
    sheet.shots = (old.shots || []).map(shot => normalizeShot(shot, {}));
    subject.referenceSheets = [sheet]; project.subjects = [subject]; return project;
  }) : [];
  return { schemaVersion: 2, projects };
}

function createReferenceStudioStore(filePath) {
  const target = path.resolve(filePath);
  function read() { try { return migrate(JSON.parse(fs.readFileSync(target, 'utf8'))); } catch { return { schemaVersion: 2, projects: [] }; } }
  function write(state) { fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); const temp = `${target}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`; fs.writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 }); fs.renameSync(temp, target); return state; }
  function locate(state, ids = {}) {
    const project = state.projects.find(item => item.id === ids.projectId); if (!project) throw new Error('Reference Studio project not found.');
    const subject = ids.subjectId ? project.subjects.find(item => item.id === ids.subjectId) : project.subjects[0]; if (ids.subjectId && !subject) throw new Error('Reference Studio subject not found.');
    const sheet = ids.sheetId && subject ? subject.referenceSheets.find(item => item.id === ids.sheetId) : subject?.referenceSheets[0]; if (ids.sheetId && !sheet) throw new Error('Reference sheet not found.');
    const shot = ids.shotId && sheet ? sheet.shots.find(item => item.id === ids.shotId) : null; if (ids.shotId && !shot) throw new Error('Reference Studio shot not found.');
    return { project, subject, sheet, shot };
  }
  function saveProject(input) { const state = read(); const index = state.projects.findIndex(item => item.id === input?.id); const project = normalizeProject(input, index >= 0 ? state.projects[index] : {}); if (index >= 0) state.projects[index] = project; else state.projects.push(project); write(state); return project; }
  function saveSubject(projectId, input) { const state = read(); const { project } = locate(state, { projectId }); const index = project.subjects.findIndex(item => item.id === input?.id); const subject = normalizeSubject(input, index >= 0 ? project.subjects[index] : {}); if (index >= 0) project.subjects[index] = subject; else project.subjects.push(subject); project.updatedAt = iso(); write(state); return subject; }
  function saveSheet(projectId, subjectId, input) { const state = read(); const { project, subject } = locate(state, { projectId, subjectId }); const index = subject.referenceSheets.findIndex(item => item.id === input?.id); const sheet = normalizeSheet(input, index >= 0 ? subject.referenceSheets[index] : {}); if (index >= 0) subject.referenceSheets[index] = sheet; else subject.referenceSheets.push(sheet); subject.updatedAt = project.updatedAt = iso(); write(state); return sheet; }
  function saveView(ids, input) { const state = read(); const { sheet } = locate(state, ids); const index = sheet.approvedViews.findIndex(item => item.id === input?.id); const view = normalizeView(input, index >= 0 ? sheet.approvedViews[index] : {}); if (index >= 0) sheet.approvedViews[index] = view; else sheet.approvedViews.push(view); sheet.updatedAt = iso(); write(state); return view; }
  function saveShot(projectId, input, subjectId, sheetId) { const state = read(); const located = locate(state, { projectId, subjectId, sheetId }); const sheet = located.sheet; if (!sheet) throw new Error('Reference sheet not found.'); const index = sheet.shots.findIndex(item => item.id === input?.id); const shot = normalizeShot(input, index >= 0 ? sheet.shots[index] : {}); if (index >= 0) sheet.shots[index] = shot; else sheet.shots.push(shot); sheet.updatedAt = located.project.updatedAt = iso(); write(state); return shot; }
  function saveVariant(ids, input) { const state = read(); const { shot } = locate(state, ids); const index = shot.variants.findIndex(item => item.id === input?.id); const variant = normalizeVariant(input, index >= 0 ? shot.variants[index] : {}); if (variant.status === 'approved') shot.variants = shot.variants.map(item => ({ ...item, status: item.id === variant.id ? 'approved' : item.status === 'approved' ? 'candidate' : item.status })); if (index >= 0) shot.variants[index] = variant; else shot.variants.push(variant); shot.updatedAt = iso(); write(state); return variant; }
  function updateShot(ids, patch) { const state = read(); const { sheet, shot } = locate(state, ids); const index = sheet.shots.findIndex(item => item.id === shot.id); sheet.shots[index] = normalizeShot({ ...shot, ...patch, id: shot.id }, shot); write(state); return sheet.shots[index]; }
  function removeShot(projectId, shotId, subjectId, sheetId) { const state = read(); const { sheet } = locate(state, { projectId, subjectId, sheetId }); if (!sheet) throw new Error('Reference sheet not found.'); sheet.shots = sheet.shots.filter(item => item.id !== shotId); write(state); return { removed: true }; }
  function clearQueue(ids) { const state = read(); const { sheet } = locate(state, ids); let cleared = 0; for (const shot of sheet.shots) if (['queued', 'failed', 'cancelled', 'recoverable'].includes(shot.status)) { shot.status = 'draft'; shot.error = ''; shot.updatedAt = iso(); cleared++; } write(state); return { cleared }; }
  function clear() { const removed = read().projects.length; write({ schemaVersion: 2, projects: [] }); return { removed }; }
  return { read, saveProject, saveSubject, saveSheet, saveView, saveShot, saveVariant, updateShot, removeShot, clearQueue, clear };
}

module.exports = { SHOT_STATUSES, REVIEW_STATUSES, REFERENCE_MODES, CONTROL_MODES, normalizeProject, normalizeSubject, normalizeSheet, normalizeView, normalizeShot, normalizeVariant, migrate, createReferenceStudioStore };
