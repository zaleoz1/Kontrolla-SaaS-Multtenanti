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
  
  // Controle de zoom
  getZoomFactor: () => ipcRenderer.invoke('get-zoom-factor'),
  setZoomFactor: (zoomFactor) => ipcRenderer.invoke('set-zoom-factor', zoomFactor),
  getResponsiveZoom: () => ipcRenderer.invoke('get-responsive-zoom'),
  resetZoom: () => ipcRenderer.invoke('reset-zoom'),
  
  // Controle de tela cheia
  isFullScreen: () => ipcRenderer.invoke('is-fullscreen'),
  setFullScreen: (fullscreen) => ipcRenderer.invoke('set-fullscreen', fullscreen),
  toggleFullScreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  
  // Utilitários
  platform: process.platform,
  isElectron: true
});

// Log para debug
console.log('Preload script carregado');
