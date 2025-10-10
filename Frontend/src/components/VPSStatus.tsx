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
    status, 
    isLoading, 
    refreshStatus 
  } = useVPSConnection();

  const getStatusColor = () => {
    if (!status.isConnected) return 'bg-red-500';
    if (isLoading) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isLoading) return 'Verificando...';
    if (!status.isConnected) return 'Desconectado';
    return 'Conectado';
  };

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCcw className="h-4 w-4 animate-spin" />;
    if (!status.isConnected) return <CloudOff className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
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
            {status.latency && (
              <span className="ml-1">({status.latency}ms)</span>
            )}
          </span>
        )}
      </Badge>

      {showDetails && (
        <div className="flex flex-col text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Signal className="h-3 w-3" />
            <span>VPS: {status.isConnected ? 'Online' : 'Offline'}</span>
          </div>
          {status.lastCheck && (
            <span>
              Última verificação: {status.lastCheck}
            </span>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={refreshStatus}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        <RefreshCcw className={cn(
          "h-4 w-4",
          isLoading && "animate-spin"
        )} />
      </Button>
    </div>
  );
};