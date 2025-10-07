import { useState, useEffect } from 'react';

// Declaração de tipos para a API do Electron
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getAppVersion: () => Promise<string>;
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      showMessageBox: (options: any) => Promise<any>;
      getZoomFactor: () => Promise<number>;
      setZoomFactor: (zoomFactor: number) => Promise<number>;
      getResponsiveZoom: () => Promise<number>;
      resetZoom: () => Promise<number>;
      isFullScreen: () => Promise<boolean>;
      setFullScreen: (fullscreen: boolean) => Promise<boolean>;
      toggleFullScreen: () => Promise<boolean>;
      platform: string;
    };
  }
}

/**
 * Hook para detectar se a aplicação está rodando no Electron
 * @returns {boolean} true se estiver no Electron, false caso contrário
 */
export function useElectron(): boolean {
  // Verificação simples e direta
  return window.electronAPI?.isElectron || false;
}

/**
 * Hook para acessar funcionalidades específicas do Electron
 * @returns {object} Objeto com funcionalidades do Electron
 */
export function useElectronAPI() {
  const isElectron = useElectron();

  return {
    isElectron,
    // APIs disponíveis apenas no Electron
    getAppVersion: isElectron ? window.electronAPI?.getAppVersion : null,
    showSaveDialog: isElectron ? window.electronAPI?.showSaveDialog : null,
    showOpenDialog: isElectron ? window.electronAPI?.showOpenDialog : null,
    showMessageBox: isElectron ? window.electronAPI?.showMessageBox : null,
    getZoomFactor: isElectron ? window.electronAPI?.getZoomFactor : null,
    setZoomFactor: isElectron ? window.electronAPI?.setZoomFactor : null,
    getResponsiveZoom: isElectron ? window.electronAPI?.getResponsiveZoom : null,
    resetZoom: isElectron ? window.electronAPI?.resetZoom : null,
    isFullScreen: isElectron ? window.electronAPI?.isFullScreen : null,
    setFullScreen: isElectron ? window.electronAPI?.setFullScreen : null,
    toggleFullScreen: isElectron ? window.electronAPI?.toggleFullScreen : null,
    platform: isElectron ? window.electronAPI?.platform : null,
  };
}
