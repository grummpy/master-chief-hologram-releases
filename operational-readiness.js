'use strict';

const VALID_STATES = new Set(['ready', 'warning', 'error']);

function readinessCheck({ id, label, weight, state, evidence, repair = '' }) {
  if (!/^[a-z0-9.-]{2,80}$/.test(String(id || ''))) throw new Error('Readiness check ID is invalid.');
  const boundedWeight = Math.max(1, Math.min(100, Math.round(Number(weight) || 0)));
  const normalizedState = VALID_STATES.has(state) ? state : 'error';
  return {
    id: String(id), label: String(label || id).slice(0, 120), weight: boundedWeight,
    state: normalizedState, evidence: String(evidence || 'No evidence returned.').slice(0, 500),
    repair: normalizedState === 'ready' ? '' : String(repair || 'Open Runtime Center and refresh the affected service.').slice(0, 500)
  };
}

function summarizeReadiness(items) {
  const checks = (Array.isArray(items) ? items : []).map(readinessCheck);
  const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight !== 100) throw new Error(`Operational readiness weights must total 100, received ${totalWeight}.`);
  const factor = state => state === 'ready' ? 1 : state === 'warning' ? 0.5 : 0;
  const score = Math.round(checks.reduce((sum, item) => sum + item.weight * factor(item.state), 0));
  const status = score >= 90 && checks.every(item => item.state !== 'error') ? 'READY' : score >= 75 ? 'DEGRADED' : 'NOT READY';
  return { score, status, checks, failed: checks.filter(item => item.state === 'error').length, warnings: checks.filter(item => item.state === 'warning').length };
}

module.exports = { readinessCheck, summarizeReadiness };
