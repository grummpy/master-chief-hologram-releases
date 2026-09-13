'use strict';
const TOOL_REGISTRY = Object.freeze([
  Object.freeze({ id: 'diagnostics.provider_status', label: 'Provider diagnostics', risk: 'read-only', approvalRequired: false }),
  Object.freeze({ id: 'models.discover_local', label: 'Discover local models', risk: 'read-only', approvalRequired: false }),
  Object.freeze({ id: 'files.attach_local_text', label: 'Read attached local text files', risk: 'local-read', approvalRequired: true }),
  Object.freeze({ id: 'voice.transcribe_microphone', label: 'Transcribe microphone audio', risk: 'local-read', approvalRequired: true }),
  Object.freeze({ id: 'chat.send_to_configured_provider', label: 'Send command to selected provider', risk: 'network', approvalRequired: true })
]);
const DEFAULT_APPROVALS = Object.freeze({ 'files.attach_local_text': false, 'voice.transcribe_microphone': false, 'chat.send_to_configured_provider': false });
function getToolRegistry() { return TOOL_REGISTRY.map(tool => ({ ...tool })); }
function normalizeApprovals(value) { const source = value && typeof value === 'object' ? value : {}; const result = { ...DEFAULT_APPROVALS }; for (const tool of TOOL_REGISTRY) if (tool.approvalRequired && typeof source[tool.id] === 'boolean') result[tool.id] = source[tool.id]; return result; }
function setToolApproval(approvals, id, approved) { const tool = TOOL_REGISTRY.find(item => item.id === id); if (!tool || !tool.approvalRequired) throw new Error('Tool is not user-approvable.'); if (typeof approved !== 'boolean') throw new Error('Approval must be a boolean.'); return { ...normalizeApprovals(approvals), [id]: approved }; }
function isToolApproved(approvals, id) { const tool = TOOL_REGISTRY.find(item => item.id === id); return Boolean(tool && (!tool.approvalRequired || normalizeApprovals(approvals)[id])); }
module.exports = { TOOL_REGISTRY, DEFAULT_APPROVALS, getToolRegistry, normalizeApprovals, setToolApproval, isToolApproved };
