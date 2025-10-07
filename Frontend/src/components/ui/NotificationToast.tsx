import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  Settings,
  Users,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'venda':
      return <ShoppingBag className="h-5 w-5 text-green-500" />;
    case 'estoque':
      return <Package className="h-5 w-5 text-orange-500" />;
    case 'financeiro':
      return <DollarSign className="h-5 w-5 text-blue-500" />;
    case 'sistema':
      return <Settings className="h-5 w-5 text-purple-500" />;
    case 'cliente':
      return <Users className="h-5 w-5 text-cyan-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
    case 'high':
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
    case 'medium':
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
    case 'low':
    default:
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
  }
};

export function NotificationToast({ notification, onClose, onAction }: NotificationToastProps) {
  return (
    <div className={cn(
      "flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-lg border-l-4 shadow-lg bg-background border",
      getPriorityColor(notification.priority),
      !notification.read && "ring-2 ring-blue-500/20"
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <p className={cn(
                "text-sm font-medium truncate",
                !notification.read && "font-semibold"
              )}>
                {notification.title}
              </p>
              <div className="flex space-x-1">
                {notification.priority === 'urgent' && (
                  <Badge variant="destructive" className="text-xs">
                    Urgente
                  </Badge>
                )}
                {notification.priority === 'high' && (
                  <Badge variant="secondary" className="text-xs">
                    Alta
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>
          
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {notification.action_url && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full sm:w-auto"
              onClick={onAction}
            >
              <span className="truncate">{notification.action_text || 'Ver detalhes'}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
