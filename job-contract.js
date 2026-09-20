'use strict';

const crypto = require('node:crypto');

const JOB_REQUEST_VERSION = 1;
const JOB_KINDS = Object.freeze(['chat','agent','research','artifact','image','video','audio','code','data']);
const JOB_EVENTS = Object.freeze(['accepted','routing','planning','waiting','executing','tool','generating','validating','transferring','complete','failed','cancelled']);
const TERMINAL_JOB_EVENTS = new Set(['complete','failed','cancelled']);
const CAPABILITIES = Object.freeze(['chat','reason','code','vision','tools','embedding','rerank','image','video','speech']);

function cleanArray(value, limit = 100) { return Array.isArray(value) ? value.slice(0, limit).map(String) : []; }
function createJobRequest(input = {}) {
  const kind = String(input.kind || 'chat').toLowerCase();
  if (!JOB_KINDS.includes(kind)) throw new Error(`Unsupported job kind: ${kind}`);
  const requestId = String(input.requestId || input.idempotencyKey || crypto.randomUUID()).trim();
  if (!requestId || requestId.length > 200) throw new Error('A valid request ID is required.');
  return {
    schemaVersion: JOB_REQUEST_VERSION,
    requestId,
    idempotencyKey: String(input.idempotencyKey || requestId),
    kind,
    objective: String(input.objective || input.prompt || '').slice(0, 50000),
    provider: input.provider ? String(input.provider) : null,
    model: input.model ? String(input.model) : null,
    projectId: input.projectId ? String(input.projectId) : null,
    parentRequestId: input.parentRequestId ? String(input.parentRequestId) : null,
    capabilities: cleanArray(input.capabilities).filter(item => CAPABILITIES.includes(item)),
    attachments: Array.isArray(input.attachments) ? input.attachments.slice(0, 50) : [],
    parameters: input.parameters && typeof input.parameters === 'object' ? { ...input.parameters } : {},
    privacy: input.privacy === 'cloud' ? 'cloud' : 'local',
    createdAt: String(input.createdAt || new Date().toISOString())
  };
}

function createJobEvent(requestId, event, detail = {}) {
  if (!JOB_EVENTS.includes(event)) throw new Error(`Unsupported job event: ${event}`);
  return {
    sequence: Number(detail.sequence || 0), requestId: String(requestId), event,
    at: String(detail.at || new Date().toISOString()), message: String(detail.message || ''),
    progress: Math.max(0, Math.min(100, Number(detail.progress || 0))),
    evidence: Array.isArray(detail.evidence) ? detail.evidence.slice(0, 100) : [],
    receipt: detail.receipt && typeof detail.receipt === 'object' ? { ...detail.receipt } : null,
    error: detail.error || null
  };
}

function typedJobError(error, context = {}) {
  const message = String(error?.message || error || 'Unknown job failure');
  let code = 'JOB_EXECUTION_FAILED'; let recovery = 'retry';
  if (/not configured|missing endpoint|missing model/i.test(message)) { code = 'RUNTIME_NOT_CONFIGURED'; recovery = 'configure'; }
  else if (/connect|network|ECONN|fetch/i.test(message)) { code = 'RUNTIME_UNREACHABLE'; recovery = 'reconnect'; }
  else if (/model.*not found|select.*model/i.test(message)) { code = 'MODEL_NOT_SELECTED'; recovery = 'select-model'; }
  else if (/log/i.test(message)) { code = 'RUNTIME_LOG_REQUIRED'; recovery = 'reveal-log'; }
  else if (/cancel/i.test(message)) { code = 'JOB_CANCELLED'; recovery = 'resume'; }
  return { code, message, recovery, retryable: !['JOB_CANCELLED'].includes(code), provider: context.provider || null, details: context.details || null };
}

module.exports = { JOB_REQUEST_VERSION, JOB_KINDS, JOB_EVENTS, TERMINAL_JOB_EVENTS, CAPABILITIES, createJobRequest, createJobEvent, typedJobError };
