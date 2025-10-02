const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações da aplicação
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Diálogos do sistema
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Eventos do menu
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => {
      callback(action);
    });
  },
  
  // Utilitários
  platform: process.platform,
  isElectron: true
});

// Log para debug
console.log('Preload script carregado');
