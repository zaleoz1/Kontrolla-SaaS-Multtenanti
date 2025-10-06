import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBellProps {
  className?: string;
  compact?: boolean;
}

export function NotificationBell({ className, compact = false }: NotificationBellProps) {
  const { stats } = useNotifications();

  if (compact) {
    return (
      <div className="relative">
        <NotificationCenter className={className} />
        {stats.unread > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {stats.unread > 99 ? '99+' : stats.unread}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className="gap-2">
        <Bell className="h-5 w-5" />
        <span className="hidden sm:inline">Notificações</span>
        {stats.unread > 0 && (
          <Badge 
            variant="destructive" 
            className="ml-1"
          >
            {stats.unread > 99 ? '99+' : stats.unread}
          </Badge>
        )}
      </Button>
    </div>
  );
}
