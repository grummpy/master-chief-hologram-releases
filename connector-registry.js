'use strict';

const CONNECTORS = Object.freeze([
  Object.freeze({
    id: 'ollama.local', label: 'Ollama · Local reasoning', kind: 'local-ai', residency: 'local',
    capabilities: Object.freeze(['chat', 'tools', 'structured-output']), approvalRequired: false, costClass: 'local-free'
  }),
  Object.freeze({
    id: 'codex.desktop', label: 'Codex Desktop · Research and workspace', kind: 'agent-bridge', residency: 'cloud-and-local',
    capabilities: Object.freeze(['web.research', 'workspace.inspect', 'workspace.change', 'test.execute']), approvalRequired: true, costClass: 'selected-cloud-plan'
  }),
  Object.freeze({
    id: 'huggingface.inference', label: 'Hugging Face · Inference', kind: 'cloud-ai', residency: 'cloud',
    capabilities: Object.freeze(['chat']), approvalRequired: true, costClass: 'provider-billed'
  }),
  Object.freeze({
    id: 'openai.responses', label: 'OpenAI · Responses', kind: 'cloud-ai', residency: 'cloud',
    capabilities: Object.freeze(['chat']), approvalRequired: true, costClass: 'provider-billed'
  }),
  Object.freeze({
    id: 'xai.grok', label: 'xAI · Grok', kind: 'cloud-ai', residency: 'cloud',
    capabilities: Object.freeze(['chat']), approvalRequired: true, costClass: 'provider-billed'
  }),
  Object.freeze({
    id: 'github.account', label: 'GitHub · Repository account', kind: 'developer-service', residency: 'cloud',
    capabilities: Object.freeze(['identity', 'repository']), approvalRequired: true, costClass: 'account-plan'
  }),
  Object.freeze({
    id: 'google.gemini', label: 'Google Gemini · AI', kind: 'cloud-ai', residency: 'cloud',
    capabilities: Object.freeze(['chat', 'tools', 'multimodal']), approvalRequired: true, costClass: 'account-plan'
  }),
  Object.freeze({
    id: 'google.gmail', label: 'Gmail · Mail account', kind: 'account-connector', residency: 'cloud',
    capabilities: Object.freeze(['mail.read', 'mail.search', 'mail.draft']), approvalRequired: true, costClass: 'account-plan'
  }),
  Object.freeze({
    id: 'suno.music', label: 'Suno · Music production', kind: 'cloud-audio', residency: 'cloud',
    capabilities: Object.freeze(['music.generate']), approvalRequired: true, costClass: 'account-plan'
  }),
  Object.freeze({
    id: 'cursor.agent', label: 'Cursor · Coding agent', kind: 'developer-agent', residency: 'cloud-and-local',
    capabilities: Object.freeze(['workspace.inspect', 'workspace.change', 'test.execute']), approvalRequired: true, costClass: 'account-plan'
  }),
  Object.freeze({
    id: 'comfyui.local',
    label: 'ComfyUI · Local GPU',
    kind: 'local-media',
    residency: 'local-network',
    capabilities: Object.freeze(['image.generate', 'video.generate']), costClass: 'local-free',
    approvalRequired: true
  }),
  Object.freeze({
    id: 'elevenlabs.tts',
    label: 'ElevenLabs · Voice',
    kind: 'cloud-audio',
    residency: 'cloud',
    capabilities: Object.freeze(['audio.tts']), costClass: 'provider-billed',
    approvalRequired: true
  })
]);

function getConnectorRegistry() {
  return CONNECTORS.map(connector => ({ ...connector, capabilities: [...connector.capabilities] }));
}

function getConnector(id) {
  return CONNECTORS.find(connector => connector.id === id) || null;
}

function withConnectorState(states = {}) {
  return getConnectorRegistry().map(connector => ({ ...connector, status: states[connector.id] || { state: 'missing', label: `${connector.label} · setup required` } }));
}

module.exports = { CONNECTORS, getConnectorRegistry, getConnector, withConnectorState };
