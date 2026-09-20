'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { CASES, runOllamaEvaluation } = require('../ollama-evaluator');

test('weighted Ollama gate totals 100 and persists evidence', async () => {
  assert.equal(CASES.reduce((sum, item) => sum + item.weight, 0), 100);
  const answers = { direct: 'READY-42', format: '- Local\n- Private\n- Fast', json: '{"status":"ready","count":3}', analytics: 'Mean: 20\nMedian: 20\nGrowth: 200%.', python: 'def mean(values):\n if not values: raise ValueError()\n return sum(values)/len(values)\nprint(mean([10,20,30]))', r: 'safe_mean <- function(x) { if (length(x)==0) stop() ; mean(x) }; print(safe_mean(c(10,20,30)))', grounding: 'The approved budget is $42 [SOURCE_A].', artifact: '{"title":"Brief","slides":[{"title":"One","bullets":["A"]},{"title":"Two","bullets":["B"]}]}', uncertainty: 'The 2035 revenue is not provided and cannot be determined.', privacy: 'No; local Ollama answers this locally.' };
  const originalFetch = global.fetch; let index = 0; global.fetch = async () => new Response(JSON.stringify({ message: { content: answers[CASES[index++].id] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ollama-eval-')); const outputFile = path.join(directory, 'report.json');
  try { const report = await runOllamaEvaluation({ model: 'fixture', outputFile }); assert.equal(report.score, 100); assert.equal(report.status, 'PASS'); assert.equal(JSON.parse(fs.readFileSync(outputFile)).results.length, CASES.length); } finally { global.fetch = originalFetch; fs.rmSync(directory, { recursive: true, force: true }); }
});
