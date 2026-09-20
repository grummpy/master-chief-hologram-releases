'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('approved MCP tools participate in the bounded Ollama agent loop', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /discoverApprovedMcpAgentTools/);
  assert.match(main, /Object\.values\(server\.permissions \|\| \{\}\)\.some\(Boolean\)/);
  assert.match(main, /mcp\.schemas/);
  assert.match(main, /executeMcpAgentTool/);
  assert.match(main, /callMcp\(route\.serverId, 'tools\/call'/);
  assert.match(main, /auditToolEvent\(\{ id: auditId, outcome: 'error'/);
});

test('local agent normalizes object or JSON-string tool arguments and rejects malformed values', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /normalizeToolArguments\(call\.function\?\.arguments\)/);
  assert.match(main, /The local model returned invalid JSON tool arguments/);
});

test('ordinary local chat dynamically routes across the installed model catalog', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /const catalog = await modelCatalog\(\)/);
  assert.match(main, /routeLocalModel\(\{ objective: routingObjective, models: catalog\.ollamaDetails/);
  assert.doesNotMatch(main, /requestedModel \|\| process\.env\.OLLAMA_MODEL \|\| 'llama3\.2'/);
});
