import { useVPSConnection } from '@/hooks/useVPSConnection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCcw,
  Signal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VPSStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const VPSStatus = ({ className, showDetails = false }: VPSStatusProps) => {
  const { 
    isOnline, 
    vpsStatus, 
    lastCheck, 
    latency, 
    isVPSAvailable, 
    checkConnection 
  } = useVPSConnection();

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (vpsStatus === 'connected') return 'bg-green-500';
    if (vpsStatus === 'checking') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (vpsStatus === 'connected') return 'Conectado';
    if (vpsStatus === 'checking') return 'Verificando...';
    return 'Desconectado';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (vpsStatus === 'connected') return <Cloud className="h-4 w-4" />;
    if (vpsStatus === 'checking') return <RefreshCcw className="h-4 w-4 animate-spin" />;
    return <CloudOff className="h-4 w-4" />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-2 text-white border-none",
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        {showDetails && (
          <span className="text-xs">
            {getStatusText()}
            {latency && (
              <span className="ml-1">({latency}ms)</span>
            )}
          </span>
        )}
      </Badge>

      {showDetails && (
        <div className="flex flex-col text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Signal className="h-3 w-3" />
            <span>VPS: {isVPSAvailable ? 'Online' : 'Offline'}</span>
          </div>
          {lastCheck && (
            <span>
              Última verificação: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={checkConnection}
        disabled={vpsStatus === 'checking'}
        className="h-8 w-8 p-0"
      >
        <RefreshCcw className={cn(
          "h-4 w-4",
          vpsStatus === 'checking' && "animate-spin"
        )} />
      </Button>
    </div>
  );
};