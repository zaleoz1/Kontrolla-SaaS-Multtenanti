import { useState, useEffect } from 'react';

interface ZoomControls {
  currentZoom: number;
  responsiveZoom: number;
  setZoom: (zoom: number) => Promise<void>;
  resetToResponsive: () => Promise<void>;
  increaseZoom: () => Promise<void>;
  decreaseZoom: () => Promise<void>;
}

export function useZoom(): ZoomControls {
  const [currentZoom, setCurrentZoom] = useState(1.0);
  const [responsiveZoom, setResponsiveZoom] = useState(1.0);

  // Verificar se estamos no Electron
  const isElectron = window.electronAPI?.isElectron || false;

  // Carregar zoom inicial
  useEffect(() => {
    if (isElectron) {
      loadInitialZoom();
    }
  }, [isElectron]);

  const loadInitialZoom = async () => {
    try {
      const [current, responsive] = await Promise.all([
        window.electronAPI.getZoomFactor(),
        window.electronAPI.getResponsiveZoom()
      ]);
      
      setCurrentZoom(current);
      setResponsiveZoom(responsive);
      
      console.log(`🔍 Zoom atual: ${(current * 100).toFixed(0)}%`);
      console.log(`🔍 Zoom responsivo: ${(responsive * 100).toFixed(0)}%`);
    } catch (error) {
      console.error('Erro ao carregar zoom:', error);
    }
  };

  const setZoom = async (zoom: number) => {
    if (!isElectron) return;
    
    try {
      const newZoom = await window.electronAPI.setZoomFactor(zoom);
      setCurrentZoom(newZoom);
      console.log(`🔍 Zoom alterado para: ${(newZoom * 100).toFixed(0)}%`);
    } catch (error) {
      console.error('Erro ao definir zoom:', error);
    }
  };

  const resetToResponsive = async () => {
    if (!isElectron) return;
    
    try {
      const newZoom = await window.electronAPI.resetZoom();
      setCurrentZoom(newZoom);
      console.log(`🔍 Zoom resetado para: ${(newZoom * 100).toFixed(0)}%`);
    } catch (error) {
      console.error('Erro ao resetar zoom:', error);
    }
  };

  const increaseZoom = async () => {
    const newZoom = Math.min(currentZoom + 0.1, 2.0);
    await setZoom(newZoom);
  };

  const decreaseZoom = async () => {
    const newZoom = Math.max(currentZoom - 0.1, 0.5);
    await setZoom(newZoom);
  };

  return {
    currentZoom,
    responsiveZoom,
    setZoom,
    resetToResponsive,
    increaseZoom,
    decreaseZoom
  };
}
