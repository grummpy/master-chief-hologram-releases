'use strict';

const CONNECTORS = Object.freeze([
  Object.freeze({
    id: 'comfyui.local',
    label: 'ComfyUI · Local GPU',
    kind: 'local-media',
    residency: 'local-network',
    capabilities: Object.freeze(['image.generate', 'video.generate']),
    approvalRequired: true
  }),
  Object.freeze({
    id: 'elevenlabs.tts',
    label: 'ElevenLabs · Voice',
    kind: 'cloud-audio',
    residency: 'cloud',
    capabilities: Object.freeze(['audio.tts']),
    approvalRequired: true
  })
]);

function getConnectorRegistry() {
  return CONNECTORS.map(connector => ({ ...connector, capabilities: [...connector.capabilities] }));
}

function getConnector(id) {
  return CONNECTORS.find(connector => connector.id === id) || null;
}

module.exports = { CONNECTORS, getConnectorRegistry, getConnector };
