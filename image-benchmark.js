'use strict';

function validateBenchmark(definition) {
  if (definition?.schemaVersion !== 1) throw new Error('Image benchmark schema is unsupported.');
  const dimensions = Array.isArray(definition.dimensions) ? definition.dimensions : [];
  const cases = Array.isArray(definition.cases) ? definition.cases : [];
  const weight = dimensions.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (weight !== 100) throw new Error('Image benchmark weights must total 100.');
  if (new Set(dimensions.map(item => item.id)).size !== dimensions.length) throw new Error('Image benchmark dimension IDs must be unique.');
  if (new Set(cases.map(item => item.id)).size !== cases.length) throw new Error('Image benchmark case IDs must be unique.');
  if (!cases.length || cases.some(item => !item.contract || !item.goal)) throw new Error('Every image benchmark case requires a contract and goal.');
  return { dimensionCount: dimensions.length, caseCount: cases.length, weight, gate: definition.gate };
}

function scoreBenchmark(definition, scores) {
  validateBenchmark(definition);
  const rows = definition.dimensions.map(item => ({ ...item, score: Math.min(100, Math.max(0, Number(scores?.[item.id] ?? 0))) }));
  const weightedScore = rows.reduce((sum, item) => sum + item.score * item.weight / 100, 0);
  return { weightedScore: Math.round(weightedScore * 10) / 10, passed: weightedScore >= definition.gate.minimumWeightedScore, rows };
}

module.exports = { validateBenchmark, scoreBenchmark };
