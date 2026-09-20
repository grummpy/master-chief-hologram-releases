'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeOllamaOptions, ollamaSystemPrompt, modelCard, selectToolModel, agentToolSchemas, resolveAgentTool } = require('../ollama-runtime');

test('Ollama controls clamp operator values and preserve task mode', () => {
  const value = normalizeOllamaOptions({ mode: 'creative', temperature: 7, topP: -1, context: 999999, maxTokens: 4, seed: 42, think: 'high', format: 'json', keepAlive: '30m' });
  assert.equal(value.mode, 'creative');
  assert.equal(value.options.temperature, 2);
  assert.equal(value.options.top_p, 0);
  assert.equal(value.options.num_ctx, 131072);
  assert.equal(value.options.num_predict, 64);
  assert.equal(value.options.seed, 42);
  assert.equal(value.think, 'high');
  assert.equal(value.format, 'json');
  assert.equal(value.keep_alive, '30m');
});

test('Ollama system profiles require evidence and do not invent actions', () => {
  const prompt = ollamaSystemPrompt({ masterMode: true, mode: 'coding' });
  assert.match(prompt, /Never claim a file, command, tool result/);
  assert.match(prompt, /Produce the finished deliverable now/);
  assert.match(prompt, /TASK MODE: CODING/);
  assert.match(prompt, /Inspect before changing/);
});

test('model cards merge installed capabilities with running memory state', () => {
  const card = modelCard({ name: 'qwen:test', size: 10, capabilities: ['completion', 'tools'], details: { parameter_size: '1B' } }, [{ name: 'qwen:test', size_vram: 8, context_length: 4096, expires_at: 'later' }]);
  assert.equal(card.loaded, true);
  assert.equal(card.sizeVram, 8);
  assert.deepEqual(card.capabilities, ['completion', 'tools']);
});

test('agent exposes only explicitly mapped local tools', () => {
  assert.equal(resolveAgentTool('diagnostics_local_runtime'), 'diagnostics.local_runtime');
  assert.equal(resolveAgentTool('shell'), null);
  assert.deepEqual(agentToolSchemas().map(item => item.function.name), [
    'diagnostics_local_runtime', 'diagnostics_git_status', 'project_list_files', 'project_read_text_file', 'project_preview_replace', 'project_replace_text', 'project_rollback_edit', 'project_preview_patch_set', 'project_apply_patch_set', 'project_rollback_patch_set', 'project_run_tests', 'artifacts_list',
    'knowledge_search_local', 'connectors_status', 'scheduler_list', 'scheduler_create', 'scheduler_action', 'monitors_list', 'monitors_create', 'monitors_action', 'artifacts_create', 'research_public_web'
  ]);
  assert.equal(resolveAgentTool('research_web_codex'), null);
});

test('agent prefers the strongest installed tool model unless the operator selects one', () => {
  const models = [
    { name: 'tiny', size: 1, capabilities: ['tools'], details: { parameter_size: '0.5B' } },
    { name: 'agent', size: 2, capabilities: ['tools'], details: { parameter_size: '8.0B' } },
    { name: 'chat-only', size: 3, capabilities: ['completion'], details: { parameter_size: '14B' } }
  ];
  assert.equal(selectToolModel(models).name, 'agent');
  assert.equal(selectToolModel(models, 'tiny').name, 'tiny');
});
