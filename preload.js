const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('masterChief', {
  getProviderStatus: () => ipcRenderer.invoke('provider-status'),
  chat: payload => ipcRenderer.invoke('chat', payload),
  cancelChat: () => ipcRenderer.invoke('cancel-chat'),
  windowAction: action => ipcRenderer.invoke('window-action', action)
});
