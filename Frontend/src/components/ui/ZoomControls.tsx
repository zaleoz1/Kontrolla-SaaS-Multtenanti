import React from 'react';
import { Button } from './button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useZoom } from '@/hooks/useZoom';

interface ZoomControlsProps {
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

export function ZoomControls({ 
  className = '', 
  showLabels = true, 
  compact = false 
}: ZoomControlsProps) {
  const { 
    currentZoom, 
    increaseZoom, 
    decreaseZoom 
  } = useZoom();

  // Verificar se estamos no Electron
  const isElectron = window.electronAPI?.isElectron || false;

  if (!isElectron) {
    return null; // Não mostrar controles se não estiver no Electron
  }

  const zoomPercentage = Math.round(currentZoom * 100);

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={decreaseZoom}
          disabled={currentZoom <= 0.5}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-xs font-medium min-w-[3rem] text-center">
          {zoomPercentage}%
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={increaseZoom}
          disabled={currentZoom >= 2.0}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={decreaseZoom}
        disabled={currentZoom <= 0.5}
        className="flex items-center gap-2"
      >
        <ZoomOut className="h-4 w-4" />
        {showLabels && 'Diminuir'}
      </Button>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium min-w-[3rem] text-center">
          {zoomPercentage}%
        </span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={increaseZoom}
        disabled={currentZoom >= 2.0}
        className="flex items-center gap-2"
      >
        <ZoomIn className="h-4 w-4" />
        {showLabels && 'Aumentar'}
      </Button>
      
    </div>
  );
}
