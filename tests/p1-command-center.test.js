'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createConversationStore } = require('../conversation-store');
const { createAgentTaskLedger } = require('../agent-task-ledger');
const { createDiagnosticsStore, redact } = require('../diagnostics-store');
const { providerCapabilities, normalizeProviderResult, normalizeProviderFailure } = require('../provider-contract');

function temp(name){const root=fs.mkdtempSync(path.join(os.tmpdir(),'mc-p1-'));return path.join(root,name)}

test('P1 conversations persist, search, branch, archive, and recover deletion',()=>{
  const store=createConversationStore(temp('conversations.json'));
  const saved=store.upsert({title:'Quarterly readiness',provider:'ollama:qwen',messages:[{role:'user',content:'Analyze readiness'},{role:'assistant',content:'Evidence follows'}]});
  assert.equal(store.list({query:'evidence'}).length,1);
  store.action(saved.id,'pin',true); store.action(saved.id,'archive',true);
  assert.equal(store.list({archived:true})[0].pinned,true);
  const branch=store.branch(saved.id,1); assert.equal(branch.parentId,saved.id); assert.equal(branch.messages.length,1);
  assert.equal(store.remove(branch.id).recoverable,true); assert.equal(store.restore(branch.id).id,branch.id);
});

test('P1 agent tasks resume the exact incomplete step with durable receipts',()=>{
  const file=temp('tasks.json'); const ledger=createAgentTaskLedger(file); const task=ledger.create({objective:'Build report',idempotencyKey:'report-1'});
  ledger.setPlan(task.id,[{id:'collect',tool:'safe'},{id:'write',tool:'safe'}]);
  ledger.checkpoint(task.id,{cursor:1,receipt:{id:'collect',status:'complete',idempotencyKey:'report-1:collect'}});
  assert.equal(ledger.action(task.id,'pause').status,'paused');
  assert.equal(ledger.action(task.id,'resume').status,'executing');
  assert.equal(ledger.get(task.id).stage,'step:write');
  const restarted=createAgentTaskLedger(file); assert.equal(restarted.get(task.id).cursor,1); assert.equal(restarted.get(task.id).receipts.length,1);
  assert.equal(ledger.action(task.id,'cancel').status,'cancelled');
  assert.equal(ledger.action(task.id,'resume').stage,'step:write');
});

test('P1 provider contract normalizes capabilities usage and typed errors',()=>{
  assert.equal(providerCapabilities('ollama').local,true);
  const result=normalizeProviderResult('ollama',{reply:'ok',metrics:{promptTokens:12,generatedTokens:4}},Date.now()-10);
  assert.equal(result.adapter,'provider-contract-v1'); assert.deepEqual(result.usage,{promptTokens:12,generatedTokens:4});
  const failure=normalizeProviderFailure('openai',new Error('Bearer sk-secret network timeout'));
  assert.equal(failure.kind,'network'); assert.doesNotMatch(failure.message,/sk-secret/);
});

test('P1 diagnostics redact credentials and export bounded structured evidence',()=>{
  const file=temp('diagnostics.jsonl'); const store=createDiagnosticsStore(file);
  store.record({area:'provider',event:'failed',outcome:'error',detail:'Bearer hf_abcdefghijklmnopqrstuvwxyz at /Users/person/project'});
  const row=store.list(10)[0]; assert.doesNotMatch(row.detail,/hf_|person/);
  const out=temp('export.json'); store.exportBundle(out,{version:'1.37.0'}); assert.equal(JSON.parse(fs.readFileSync(out)).diagnostics.length,1);
  assert.equal(redact('github_pat_abcdef'),'[redacted credential]');
});

test('P1 interface exposes conversations, Agent Center, diagnostics, and accommodations',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const renderer=fs.readFileSync(path.join(__dirname,'..','renderer.js'),'utf8');
  const css=fs.readFileSync(path.join(__dirname,'..','styles.css'),'utf8');
  for(const id of ['conversationsNavBtn','agentTabBtn','agentTaskList','accessibilityBtn','exportDiagnosticsBtn'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(renderer,/renderConversations/); assert.match(renderer,/refreshAgentTasks/); assert.match(renderer,/persistCurrentConversation/);
  assert.match(css,/data-contrast=high/); assert.match(css,/data-reduce-motion=true/);
});
