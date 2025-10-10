import { useState, useEffect } from 'react';

interface VPSStatus {
  isConnected: boolean;
  latency?: number;
  lastCheck?: string;
  error?: string;
}

export function useVPSConnection() {
  const [status, setStatus] = useState<VPSStatus>({
    isConnected: false,
    lastCheck: undefined
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkVPSHealth = async (): Promise<VPSStatus> => {
    const startTime = Date.now();
    
    try {
      // Se estiver no Electron, usar API nativa se disponível
      if ((window as any).electronVPS?.vpsHealthCheck) {
        const result = await (window as any).electronVPS.vpsHealthCheck();
        const latency = Date.now() - startTime;
        
        return {
          isConnected: result.isConnected,
          latency,
          lastCheck: new Date().toLocaleTimeString(),
          error: result.error
        };
      }
      
      // Fallback para web browser
      const response = await fetch('https://pvd.kontrollapro.com.br/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const latency = Date.now() - startTime;
      
      return {
        isConnected: response.ok,
        latency,
        lastCheck: new Date().toLocaleTimeString()
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        isConnected: false,
        latency,
        lastCheck: new Date().toLocaleTimeString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    const newStatus = await checkVPSHealth();
    setStatus(newStatus);
    setIsLoading(false);
  };

  useEffect(() => {
    // Verificação inicial
    refreshStatus();

    // Se estiver no Electron, escutar atualizações automáticas
    if ((window as any).electronVPS?.onVPSStatusUpdate) {
      (window as any).electronVPS.onVPSStatusUpdate((vpsStatus: any) => {
        setStatus({
          isConnected: vpsStatus.isConnected,
          latency: undefined, // Latency será calculada no próximo refresh manual
          lastCheck: new Date().toLocaleTimeString(),
          error: vpsStatus.error
        });
      });
    } else {
      // Para web browser, verificar periodicamente
      const interval = setInterval(refreshStatus, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  return {
    status,
    isLoading,
    refreshStatus
  };
}