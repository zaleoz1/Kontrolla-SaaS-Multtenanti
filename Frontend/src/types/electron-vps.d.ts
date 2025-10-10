// Tipos específicos para funcionalidades VPS no Electron
export interface ElectronVPSAPI {
  vpsHealthCheck: () => Promise<{
    isConnected: boolean;
    status?: number;
    timestamp: string;
    error?: string;
  }>;
  onVPSStatusUpdate: (callback: (status: any) => void) => void;
}

// Estender Window para incluir APIs VPS
declare global {
  interface Window {
    electronVPS?: ElectronVPSAPI;
  }
}