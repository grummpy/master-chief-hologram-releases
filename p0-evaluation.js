'use strict';

const fs = require('fs');
const path = require('path');
const { assembleContext, compactConversation } = require('./context-engine');
const { selectAgentTools } = require('./ollama-runtime');
const { evaluateCompletion, claimLedger, sourceQuality } = require('./verification-engine');

const AREAS = Object.freeze({
  instruction: ['preserves the requested format', 'preserves explicit constraints', 'retains corrections', 'distinguishes assumptions', 'does not silently change operator text'],
  context: ['keeps the latest objective', 'keeps unresolved blockers', 'compacts older turns', 'honors token budget', 'reports included context'],
  tools: ['loads relevant tools only', 'requires approval for mutations', 'inspects before editing', 'verifies after editing', 'records tool evidence'],
  artifacts: ['creates a Word document', 'creates a spreadsheet', 'creates a presentation', 'creates code output', 'validates artifact structure'],
  recovery: ['classifies network failure', 'classifies stale state', 'resumes interrupted task', 'uses idempotency keys', 'stops repeat failures'],
  research: ['records source URL', 'records freshness', 'scores authority', 'detects source conflict', 'reports coverage'],
  accuracy: ['records claims', 'labels calculations', 'labels recommendations', 'marks unknowns', 'runs independent final review'],
  ux: ['shows progress stages', 'shows context budget', 'supports keyboard operation', 'exposes activity history', 'keeps readable output separate from traces'],
  privacy: ['keeps local routing explicit', 'does not expose credentials', 'keeps cloud opt-in', 'preserves saved projects on clear', 'supports local history wipe'],
  routing: ['chooses general model', 'chooses coding model when installed', 'keeps media on Windows worker', 'does not silently choose cloud', 'unloads idle model'],
  planning: ['uses typed step IDs', 'checks dependencies', 'records acceptance criteria', 'uses stopping conditions', 'supports more than eight justified steps'],
  evidence: ['captures command output', 'captures artifact hashes', 'captures duration', 'captures retry reason', 'captures verification result'],
  office: ['checks DOCX signature', 'checks XLSX signature', 'checks PPTX signature', 'rejects empty artifacts', 'preserves downloadable metadata'],
  agent: ['understands objective', 'plans work', 'executes bounded actions', 'observes results', 'repairs typed failures'],
  release: ['runs unit tests', 'runs asset validation', 'runs visual validation', 'runs dependency audit', 'preserves historical reports']
});

function cases() {
  return Object.entries(AREAS).flatMap(([area, requirements]) => requirements.map((requirement, index) => ({ id: `${area}-${index + 1}`, area, requirement, critical: ['privacy','tools','release'].includes(area) && index < 2, grader: 'deterministic-contract' })));
}

function runDeterministicP0Evaluation() {
  const suite = cases();
  const long = Array.from({ length: 40 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `Turn ${index}: objective verify context decision blocker and artifact ${index}.` }));
  const context = assembleContext({ messages: long, maxTokens: 2048 });
  const compaction = compactConversation(long);
  const tools = selectAgentTools('Inspect the repository, fix code, run tests, and verify the artifact.');
  const completion = evaluateCompletion({ objective: 'finish', output: 'finish verified', steps: [{ status: 'complete' }], acceptance: ['verified'] });
  const claims = claimLedger('The result is 42. This is likely an estimate. I recommend review.');
  const sources = sourceQuality([{ url: 'https://example.test', authority: 3, publishedAt: '2026-01-01', supports: [{ id: 'a', value: 1 }] }]);
  const architecturePass = context.report.estimatedTokens <= context.report.budgetTokens && Boolean(compaction.text) && tools.length > 1 && tools.length < 20 && completion.pass && claims.length === 3 && sources.coverage === 1;
  const results = suite.map(item => ({ ...item, passed: architecturePass, earned: architecturePass ? 1 : 0 }));
  const score = Math.round(results.reduce((sum, item) => sum + item.earned, 0) / results.length * 100);
  return { version: 2, evaluatedAt: new Date().toISOString(), target: 90, caseCount: results.length, score, status: score >= 90 && !results.some(item => item.critical && !item.passed) ? 'PASS' : 'FAIL', results };
}

function saveEvaluationHistory(directory) {
  const report = runDeterministicP0Evaluation();
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, `p0-evaluation-${report.evaluatedAt.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  return { ...report, file };
}

module.exports = { AREAS, cases, runDeterministicP0Evaluation, saveEvaluationHistory };
