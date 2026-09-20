'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { assembleContext, compactConversation } = require('../context-engine');
const { createAgentTaskLedger } = require('../agent-task-ledger');
const { createContextMemoryStore } = require('../context-memory-store');
const { selectAgentTools, normalizeOllamaOptions, ollamaSystemPrompt } = require('../ollama-runtime');
const { evaluateCompletion, claimLedger, sourceQuality, validateArtifact } = require('../verification-engine');
const { routeLocalModel } = require('../local-model-router');
const { cases, runDeterministicP0Evaluation } = require('../p0-evaluation');

test('context assembler honors budget, relevance, layers, and compaction', () => {
  const messages = Array.from({ length: 80 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `Message ${index} ` + 'evidence decision blocker '.repeat(40) }));
  messages.push({ role: 'user', content: 'Latest objective: verify the launch report.' });
  const result = assembleContext({ messages, maxTokens: 2048, projectMemory: 'Approved project fact.', preferences: 'Use concise status.' });
  assert.ok(result.report.estimatedTokens <= result.report.budgetTokens);
  assert.ok(result.report.omittedMessages > 0);
  assert.equal(result.report.compacted, true);
  assert.match(result.messages.at(-1).content, /Latest objective/);
  assert.deepEqual(result.report.layers, ['approved preferences', 'project memory']);
  assert.match(compactConversation(messages).text, /OBJECTIVE/);
});

test('agent ledger is durable, idempotent, and recovers interrupted work', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-agent-'));
  const file = path.join(directory, 'ledger.json');
  const first = createAgentTaskLedger(file);
  const task = first.create({ objective: 'test', idempotencyKey: 'same' });
  assert.equal(first.create({ objective: 'duplicate', idempotencyKey: 'same' }).id, task.id);
  first.event(task.id, 'execute', { status: 'executing' });
  const recovered = createAgentTaskLedger(file).get(task.id);
  assert.equal(recovered.status, 'recoverable');
});

test('durable memory stores only explicitly approved project facts and preferences', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-memory-')); const file = path.join(directory, 'memory.json');
  const memory = createContextMemoryStore(file);
  assert.throws(() => memory.setProject('alpha', 'fact', false), /explicit operator approval/);
  memory.setProject('alpha', 'verified project fact', true);
  memory.setPreferences(['Use concise status.', 'Correction: call it Nova.'], true);
  const restored = createContextMemoryStore(file).get('alpha');
  assert.equal(restored.projectMemory, 'verified project fact');
  assert.equal(restored.approvedPreferences.length, 2);
});

test('dynamic tools, modes, routing, and model idle policy are explicit', () => {
  const tools = selectAgentTools('Inspect code, fix it, then run tests and verify.');
  assert.ok(tools.some(item => item.alias === 'project_run_tests'));
  assert.ok(tools.some(item => item.alias === 'project_preview_patch_set'));
  assert.ok(tools.length < 20);
  assert.equal(normalizeOllamaOptions({}).keep_alive, '30m');
  assert.match(ollamaSystemPrompt({ masterMode: true, depth: 'deep', detail: 'technical' }), /DEEP REVIEW|TECHNICAL/);
  const routed = routeLocalModel({ objective: 'write python code', models: [{ name: 'qwen3:8b', size: 8 }, { name: 'qwen-coder:7b', size: 7 }] });
  assert.equal(routed.model, 'qwen-coder:7b');
});

test('verification records claims, sources, completion, and artifact hashes', () => {
  assert.equal(claimLedger('The value is 42. I recommend review.')[1].type, 'recommendation');
  assert.equal(sourceQuality([{ url: 'a', supports: [{ id: 'x', value: 1 }] }, { url: 'b', supports: [{ id: 'x', value: 2 }] }]).conflicts.length, 1);
  assert.equal(evaluateCompletion({ objective: 'x', output: 'verified', acceptance: ['verified'], steps: [{ status: 'complete' }] }).pass, true);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-artifact-')); const file = path.join(directory, 'test.docx'); fs.writeFileSync(file, Buffer.from([0x50,0x4b,1,2]));
  assert.equal(validateArtifact(file).valid, true);
});

test('P0 evaluation contains 75 deterministic cases and clears the 90 gate', () => {
  assert.equal(cases().length, 75);
  const report = runDeterministicP0Evaluation();
  assert.equal(report.status, 'PASS');
  assert.ok(report.score >= 90);
  assert.equal(report.results.filter(item => item.critical && !item.passed).length, 0);
});

test('P0 controls and accessible tab semantics are present', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /id="contextInspectorBtn"/);
  assert.match(html, /id="ollamaDepth"/);
  assert.match(html, /id="ollamaDetail"/);
  assert.match(html, /role="tab" aria-controls="systemsTab"/);
});
