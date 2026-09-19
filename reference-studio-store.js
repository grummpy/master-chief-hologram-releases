'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SHOT_STATUSES = new Set(['draft', 'queued', 'running', 'complete', 'failed']);

function cleanText(value, max = 4000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeShot(input = {}, existing = {}) {
  const status = SHOT_STATUSES.has(input.status) ? input.status : (existing.status || 'draft');
  return {
    id: cleanText(input.id || existing.id, 100) || crypto.randomUUID(),
    title: cleanText(input.title ?? existing.title, 160) || 'Untitled shot',
    positivePrompt: cleanText(input.positivePrompt ?? existing.positivePrompt),
    negativePrompt: cleanText(input.negativePrompt ?? existing.negativePrompt, 2000),
    referenceArtifact: cleanText(input.referenceArtifact ?? existing.referenceArtifact, 1000),
    status,
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeProject(input = {}, existing = {}) {
  const shots = Array.isArray(existing.shots) ? existing.shots : [];
  return {
    schemaVersion: 1,
    id: cleanText(input.id || existing.id, 100) || crypto.randomUUID(),
    title: cleanText(input.title ?? existing.title, 160) || 'Commander Nova project',
    subject: {
      name: cleanText(input.subject?.name ?? existing.subject?.name, 160) || 'Commander Nova',
      identityLock: cleanText(input.subject?.identityLock ?? existing.subject?.identityLock),
      adultConfirmed: Boolean(input.subject?.adultConfirmed ?? existing.subject?.adultConfirmed)
    },
    shots,
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createReferenceStudioStore(filePath) {
  const target = path.resolve(filePath);
  function read() {
    try {
      const value = JSON.parse(fs.readFileSync(target, 'utf8'));
      return value && value.schemaVersion === 1 && Array.isArray(value.projects) ? value : { schemaVersion: 1, projects: [] };
    } catch { return { schemaVersion: 1, projects: [] }; }
  }
  function write(state) {
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, target);
    return state;
  }
  function saveProject(input) {
    const state = read();
    const index = state.projects.findIndex(item => item.id === input?.id);
    const existing = index >= 0 ? state.projects[index] : {};
    const project = normalizeProject(input, existing);
    if (index >= 0) state.projects[index] = project;
    else state.projects.push(project);
    write(state);
    return project;
  }
  function saveShot(projectId, input) {
    const state = read();
    const projectIndex = state.projects.findIndex(item => item.id === projectId);
    if (projectIndex < 0) throw new Error('Reference Studio project not found.');
    const project = state.projects[projectIndex];
    const shotIndex = project.shots.findIndex(item => item.id === input?.id);
    const shot = normalizeShot(input, shotIndex >= 0 ? project.shots[shotIndex] : {});
    if (shotIndex >= 0) project.shots[shotIndex] = shot;
    else project.shots.push(shot);
    project.updatedAt = new Date().toISOString();
    write(state);
    return shot;
  }
  function removeShot(projectId, shotId) {
    const state = read();
    const project = state.projects.find(item => item.id === projectId);
    if (!project) throw new Error('Reference Studio project not found.');
    project.shots = project.shots.filter(item => item.id !== shotId);
    project.updatedAt = new Date().toISOString();
    write(state);
    return { removed: true };
  }
  return { read, saveProject, saveShot, removeShot };
}

module.exports = { SHOT_STATUSES, normalizeProject, normalizeShot, createReferenceStudioStore };
