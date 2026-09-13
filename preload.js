const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('masterChief', {
  getProviderStatus: () => ipcRenderer.invoke('provider-status'),
  getCredentialStatus: () => ipcRenderer.invoke('credential-status'),
  getModelCatalog: () => ipcRenderer.invoke('model-catalog'),
  voiceSelfTest: () => ipcRenderer.invoke('voice-self-test'),
  voiceSetup: () => ipcRenderer.invoke('voice-setup'),
  requestMicrophoneAccess: () => ipcRenderer.invoke('request-microphone-access'),
  openMicrophoneSettings: () => ipcRenderer.invoke('open-microphone-settings'),
  getToolApprovals: () => ipcRenderer.invoke('tool-approvals'),
  setToolApproval: (id, approved) => ipcRenderer.invoke('set-tool-approval', { id, approved }),
  executeLocalTool: id => ipcRenderer.invoke('execute-local-tool', { id }),
  chat: payload => ipcRenderer.invoke('chat', payload),
  onChatEvent: callback => { const listener = (_event, data) => callback(data); ipcRenderer.on('chat-event', listener); return () => ipcRenderer.removeListener('chat-event', listener); },
  cancelChat: () => ipcRenderer.invoke('cancel-chat'),
  transcribeAudio: (audio, type) => ipcRenderer.invoke('transcribe-audio', { audio, type }),
  indexDocument: (name, text) => ipcRenderer.invoke('index-document', { name, text }),
  removeIndexedDocument: name => ipcRenderer.invoke('remove-indexed-document', { name }),
  searchIndex: query => ipcRenderer.invoke('search-index', { query }),
  indexStats: () => ipcRenderer.invoke('index-stats'),
  openArtifact: relativePath => ipcRenderer.invoke('open-artifact', relativePath),
  windowAction: action => ipcRenderer.invoke('window-action', action)
});
