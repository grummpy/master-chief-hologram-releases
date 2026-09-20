'use strict';
const CRITERIA = Object.freeze([
  { id: 'integration', weight: 15 }, { id: 'resume', weight: 15 }, { id: 'crashRecovery', weight: 10 },
  { id: 'packageIntegrity', weight: 15, blocker: true }, { id: 'security', weight: 10 }, { id: 'privacy', weight: 5 },
  { id: 'accessibility', weight: 5 }, { id: 'functionalRegression', weight: 10 }, { id: 'operations', weight: 5 },
  { id: 'commercialSigning', weight: 10, blocker: true }
]);
const TARGET = 95;
function scoreReleaseGate(evidence = {}) {
  const results = CRITERIA.map(item => ({ ...item, pass: evidence[item.id] === true, evidence: evidence[`${item.id}Evidence`] || '' }));
  const score = results.reduce((sum, item) => sum + (item.pass ? item.weight : 0), 0); const blockers = results.filter(item => item.blocker && !item.pass).map(item => item.id);
  return { target: TARGET, score, status: score >= TARGET && !blockers.length ? 'PASS' : 'HOLD', blockers, results };
}
module.exports = { CRITERIA, TARGET, scoreReleaseGate };
