const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('masterChief', {
  getProviderStatus: () => ipcRenderer.invoke('provider-status'),
  getCredentialStatus: () => ipcRenderer.invoke('credential-status'),
  getModelCatalog: () => ipcRenderer.invoke('model-catalog'),
  chat: payload => ipcRenderer.invoke('chat', payload),
  onChatEvent: callback => { const listener = (_event, data) => callback(data); ipcRenderer.on('chat-event', listener); return () => ipcRenderer.removeListener('chat-event', listener); },
  cancelChat: () => ipcRenderer.invoke('cancel-chat'),
  transcribeAudio: (audio, type) => ipcRenderer.invoke('transcribe-audio', { audio, type }),
  windowAction: action => ipcRenderer.invoke('window-action', action)
});
