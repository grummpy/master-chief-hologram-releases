'use strict';

const MAX_STEPS = 8;
const MAX_RUNTIME_MS = 2 * 60 * 1000;

function validatePlan(plan, knownTools) {
  if (!plan || !Array.isArray(plan.steps) || !plan.steps.length) throw new Error('Agent plan requires at least one step.');
  if (plan.steps.length > MAX_STEPS) throw new Error(`Agent plan exceeds the ${MAX_STEPS}-step limit.`);
  return plan.steps.map((step, index) => {
    const tool = String(step?.tool || '');
    if (!knownTools.includes(tool)) throw new Error(`Step ${index + 1} requests an unavailable tool.`);
    const input = step.input && typeof step.input === 'object' && !Array.isArray(step.input) ? step.input : {};
    return { id: String(step.id || `step-${index + 1}`), tool, input };
  });
}

async function runAgentPlan(plan, { knownTools, approved, execute, maxRuntimeMs = MAX_RUNTIME_MS }) {
  const steps = validatePlan(plan, knownTools);
  const startedAt = Date.now();
  const results = [];
  for (const step of steps) {
    if (Date.now() - startedAt > maxRuntimeMs) throw new Error('Agent run exceeded its time limit.');
    if (!approved(step.tool)) throw new Error(`Approval is required for ${step.tool}.`);
    const result = await execute(step.tool, step.input);
    results.push({ id: step.id, tool: step.tool, status: 'complete', result });
  }
  return { status: 'complete', steps: results, durationMs: Date.now() - startedAt };
}

module.exports = { MAX_STEPS, MAX_RUNTIME_MS, validatePlan, runAgentPlan };
