'use strict';

const fs = require('fs');
const path = require('path');

function redact(value) { return String(value || '').replace(/(?:sk|xai|hf|ghp|github_pat)[-_][A-Za-z0-9._-]+/gi,'[redacted credential]').replace(/Bearer\s+[^\s]+/gi,'Bearer [redacted credential]').replace(/\/(?:Users|home)\/[^\s/]+/g,'/[user]'); }
function createDiagnosticsStore(file, maxBytes = 256 * 1024) {
  function record(event = {}) { try { fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700}); const row = { at: new Date().toISOString(), area: redact(event.area).slice(0,80), event: redact(event.event).slice(0,100), outcome: redact(event.outcome).slice(0,40), durationMs: Math.max(0,Number(event.durationMs)||0), detail: redact(event.detail).slice(0,300) }; fs.appendFileSync(file,`${JSON.stringify(row)}\n`,{mode:0o600}); if(fs.statSync(file).size>maxBytes){ const prior=`${file}.previous`; if(fs.existsSync(prior))fs.unlinkSync(prior); fs.renameSync(file,prior); } return row; } catch { return null; } }
  function list(limit=200){ try{return fs.readFileSync(file,'utf8').trim().split(/\n+/).filter(Boolean).slice(-Math.max(1,Math.min(1000,Number(limit)||200))).map(line=>JSON.parse(line));}catch{return[];} }
  function exportBundle(destination, extra={}) { const bundle={generatedAt:new Date().toISOString(),diagnostics:list(1000),system:extra}; fs.writeFileSync(destination,JSON.stringify(bundle,null,2),{mode:0o600}); return destination; }
  return { record, list, exportBundle };
}

module.exports = { createDiagnosticsStore, redact };
