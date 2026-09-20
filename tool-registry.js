'use strict';
const TOOL_REGISTRY = Object.freeze([
  Object.freeze({ id: 'diagnostics.provider_status', label: 'Provider diagnostics', risk: 'read-only', scope: 'Checks configured connection status; sends no command content.', approvalRequired: false }),
  Object.freeze({ id: 'models.discover_local', label: 'Discover local models', risk: 'read-only', scope: 'Lists locally available model names.', approvalRequired: false }),
  Object.freeze({ id: 'diagnostics.local_runtime', label: 'Inspect local runtime', risk: 'read-only', scope: 'Returns the app version, platform, and Node runtime. Does not run a shell command.', approvalRequired: false }),
  Object.freeze({ id: 'diagnostics.git_status', label: 'Inspect project Git status', risk: 'local-read', scope: 'Runs only git status --short --branch in this app project. It cannot change Git state or access another folder.', approvalRequired: true }),
  Object.freeze({ id: 'files.attach_local_text', label: 'Read explicitly attached local files', risk: 'local-read', scope: 'Accepts files you explicitly attach up to 25 MB each; supported documents are extracted locally and unknown formats remain metadata-only.', approvalRequired: true }),
  Object.freeze({ id: 'voice.transcribe_microphone', label: 'Transcribe microphone audio', risk: 'local-read', scope: 'Captures audio after you press MIC and sends it to the selected transcription provider.', approvalRequired: true }),
  Object.freeze({ id: 'chat.send_to_configured_provider', label: 'Send command to selected provider', risk: 'network', scope: 'Sends your command and selected local context to the provider shown above.', approvalRequired: true })
  ,Object.freeze({ id: 'media.generate_local', label: 'Generate local media', risk: 'local-network-write', scope: 'Creates image, video, or audio with configured local/private providers and archives the returned media.', approvalRequired: true })
  ,Object.freeze({ id: 'agents.run_bounded_plan', label: 'Run bounded agent plan', risk: 'controlled-actions', scope: 'Runs up to eight allowlisted steps. Every underlying protected tool still requires approval.', approvalRequired: true })
]);
const DEFAULT_APPROVALS = Object.freeze({ 'diagnostics.git_status': false, 'files.attach_local_text': false, 'voice.transcribe_microphone': false, 'chat.send_to_configured_provider': false, 'media.generate_local': false, 'agents.run_bounded_plan': false });
function getToolRegistry() { return TOOL_REGISTRY.map(tool => ({ ...tool })); }
function normalizeApprovals(value) { const source = value && typeof value === 'object' ? value : {}; const result = { ...DEFAULT_APPROVALS }; for (const tool of TOOL_REGISTRY) if (tool.approvalRequired && typeof source[tool.id] === 'boolean') result[tool.id] = source[tool.id]; return result; }
function setToolApproval(approvals, id, approved) { const tool = TOOL_REGISTRY.find(item => item.id === id); if (!tool || !tool.approvalRequired) throw new Error('Tool is not user-approvable.'); if (typeof approved !== 'boolean') throw new Error('Approval must be a boolean.'); return { ...normalizeApprovals(approvals), [id]: approved }; }
function isToolApproved(approvals, id) { const tool = TOOL_REGISTRY.find(item => item.id === id); return Boolean(tool && (!tool.approvalRequired || normalizeApprovals(approvals)[id])); }
module.exports = { TOOL_REGISTRY, DEFAULT_APPROVALS, getToolRegistry, normalizeApprovals, setToolApproval, isToolApproved };
