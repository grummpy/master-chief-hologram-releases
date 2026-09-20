'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }

function evaluateWorkflowReadiness(workflows, availableNodes = [], catalogs = {}) {
  const nodeSet = new Set((availableNodes || []).map(String));
  const modelReady = requirement => {
    const [kind, requested = ''] = String(requirement).split(':', 2);
    const values = kind === 'checkpoint' ? catalogs.checkpoints : kind === 'vae' ? catalogs.vaes : kind === 'upscaler' ? catalogs.upscalers : kind === 'controlnet' ? catalogs.controlnets : kind === 'diffusion' ? catalogs.diffusionModels : kind === 'text_encoder' ? catalogs.textEncoders : kind === 'aux' ? catalogs.auxModels : [];
    if (!Array.isArray(values)) return false;
    if (kind === 'checkpoint' && requested === 'sdxl') return values.some(name => /(?:sd.?xl|juggernaut.*xl)/i.test(String(name)));
    return values.some(name => String(name).toLowerCase() === requested.toLowerCase());
  };
  return (workflows || []).map(workflow => {
    const missingNodes = (workflow.requiredNodes || []).filter(node => !nodeSet.has(String(node)));
    const missingModels = (workflow.requiredModels || []).filter(requirement => !modelReady(requirement));
    return { ...workflow, readiness: missingNodes.length || missingModels.length || workflow.enabled === false ? 'blocked' : 'ready', missingNodes, missingModels };
  });
}

function createWorkflowRegistry(root, manifestPath = path.join(root, 'workflows', 'registry.json')) {
  const base = path.resolve(root);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.workflows)) throw new Error('Workflow registry is invalid.');
  const workflows = manifest.workflows.map(entry => {
    const file = path.resolve(base, entry.file);
    if (!file.startsWith(`${base}${path.sep}`) || !fs.existsSync(file)) throw new Error(`Workflow file is missing: ${entry.file}`);
    return { ...entry, file, sha256: sha256(file) };
  });
  function get(id) {
    const item = workflows.find(entry => entry.id === String(id));
    if (!item) throw new Error(`Workflow is not registered: ${id}`);
    return { ...item };
  }
  function forKind(kind) {
    const item = workflows.find(entry => entry.contract === String(kind) && entry.enabled !== false);
    if (!item) throw new Error(`No enabled workflow supports ${kind}.`);
    return { ...item };
  }
  function list() { return workflows.map(({ file, ...entry }) => ({ ...entry, file: path.relative(base, file) })); }
  return { get, forKind, list, version: manifest.version };
}

module.exports = { createWorkflowRegistry, evaluateWorkflowReadiness };
