const fs = require('fs');
const path = require('path');
function createLocalAiAudit(filePath, { now = () => new Date().toISOString(), maxBytes = 256 * 1024 } = {}) {
  function record({ model, outcome, latencyMs, errorCode = '' }) {
    const event = { at: now(), runtime: 'ollama', model: String(model || '').slice(0, 120), outcome: outcome === 'success' ? 'success' : 'error', latencyMs: Math.max(0, Number(latencyMs) || 0), errorCode: outcome === 'success' ? '' : 'local_request_failed' };
    fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > maxBytes) fs.renameSync(filePath, `${filePath}.previous`);
    fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, { mode: 0o600 });
    return event;
  }
  return { record };
}
module.exports = { createLocalAiAudit };
