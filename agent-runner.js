'use strict';

const MAX_STEPS = 24;
const MAX_RUNTIME_MS = 10 * 60 * 1000;
const MAX_RETRIES = 2;

function validatePlan(plan, knownTools) {
  if (!plan || !Array.isArray(plan.steps) || !plan.steps.length) throw new Error('Agent plan requires at least one step.');
  if (plan.steps.length > MAX_STEPS) throw new Error(`Agent plan exceeds the ${MAX_STEPS}-step limit.`);
  const ids = new Set();
  const steps = plan.steps.map((step, index) => {
    const id = String(step?.id || `step-${index + 1}`);
    if (ids.has(id)) throw new Error(`Agent plan has a duplicate step ID: ${id}.`);
    ids.add(id);
    const tool = String(step?.tool || '');
    if (!knownTools.includes(tool)) throw new Error(`Step ${index + 1} requests an unavailable tool.`);
    const input = step.input && typeof step.input === 'object' && !Array.isArray(step.input) ? step.input : {};
    const dependsOn = Array.isArray(step.dependsOn) ? step.dependsOn.map(String) : [];
    return { id, tool, input, dependsOn, mutates: Boolean(step.mutates), verify: String(step.verify || '') };
  });
  for (const [index, step] of steps.entries()) for (const dependency of step.dependsOn) {
    const dependencyIndex = steps.findIndex(item => item.id === dependency);
    if (dependencyIndex < 0 || dependencyIndex >= index) throw new Error(`Step ${step.id} has an invalid or forward dependency: ${dependency}.`);
  }
  return steps;
}

function classifyFailure(error) {
  const message = String(error?.message || error || 'Unknown failure');
  if (/network|fetch|timeout|ECONN|socket/i.test(message)) return 'network';
  if (/model|context|token|memory|vram/i.test(message)) return 'model-runtime';
  if (/stale|hash|conflict/i.test(message)) return 'stale-state';
  if (/approval|permission|denied/i.test(message)) return 'authorization';
  return 'tool-runtime';
}

async function runAgentPlan(plan, { knownTools, approved, execute, verify, onEvent = () => {}, maxRuntimeMs = MAX_RUNTIME_MS, maxRetries = MAX_RETRIES }) {
  const steps = validatePlan(plan, knownTools);
  const startedAt = Date.now();
  const results = [];
  let mutationCount = 0;
  for (const step of steps) {
    if (Date.now() - startedAt > maxRuntimeMs) throw new Error('Agent run exceeded its time limit.');
    if (!step.dependsOn.every(id => results.find(result => result.id === id)?.status === 'complete')) throw new Error(`Dependencies for ${step.id} are incomplete.`);
    if (!approved(step.tool)) throw new Error(`Approval is required for ${step.tool}.`);
    if (step.mutates && ++mutationCount > 8) throw new Error('Agent run exceeded its mutation limit.');
    let attempt = 0; let lastError;
    while (attempt <= maxRetries) {
      attempt += 1; onEvent({ type: 'step-start', step: step.id, tool: step.tool, attempt });
      try {
        const result = await execute(step.tool, step.input, { idempotencyKey: `${plan.idempotencyKey || 'agent'}:${step.id}` });
        const verified = verify ? await verify(step, result) : { pass: true };
        if (verified === false || verified?.pass === false) throw new Error(`Verification failed for ${step.id}.`);
        const completed = { id: step.id, tool: step.tool, status: 'complete', attempt, result, verification: verified };
        results.push(completed); onEvent({ type: 'step-complete', ...completed }); lastError = null; break;
      } catch (error) {
        lastError = error; const kind = classifyFailure(error);
        onEvent({ type: 'step-error', step: step.id, tool: step.tool, attempt, kind, message: String(error.message || error) });
        if (kind === 'authorization' || kind === 'stale-state' || attempt > maxRetries) break;
      }
    }
    if (lastError) throw lastError;
  }
  return { status: 'complete', steps: results, durationMs: Date.now() - startedAt };
}

module.exports = { MAX_STEPS, MAX_RUNTIME_MS, MAX_RETRIES, validatePlan, classifyFailure, runAgentPlan };
