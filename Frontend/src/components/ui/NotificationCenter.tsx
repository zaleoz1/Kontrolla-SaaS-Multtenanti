import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  ExternalLink,
  ShoppingBag,
  Package,
  DollarSign,
  Settings,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  className?: string;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'venda':
      return <ShoppingBag className="h-4 w-4 text-green-500" />;
    case 'estoque':
      return <Package className="h-4 w-4 text-orange-500" />;
    case 'financeiro':
      return <DollarSign className="h-4 w-4 text-blue-500" />;
    case 'sistema':
      return <Settings className="h-4 w-4 text-purple-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
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

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { 
    notifications, 
    stats, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications 
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'venda' | 'estoque' | 'financeiro' | 'sistema' | 'cliente'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {stats.unread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 sm:w-96 w-[calc(100vw-2rem)] max-w-sm p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notificações</h3>
              {stats.unread > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.unread} não lidas
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {stats.unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-8 px-2"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="h-8 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-2 border-b">
          <div className="flex flex-wrap gap-1 sm:flex-nowrap sm:overflow-x-auto">
            {[
              { key: 'all', label: 'Todas', mobileLabel: 'Todas', count: notifications.length },
              { key: 'unread', label: 'Não lidas', mobileLabel: 'Não lidas', count: stats?.unread || 0 },
              { key: 'venda', label: 'Vendas', mobileLabel: 'Vendas', count: stats?.by_type?.venda || 0 },
              { key: 'estoque', label: 'Estoque', mobileLabel: 'Estoque', count: stats?.by_type?.estoque || 0 },
              { key: 'financeiro', label: 'Financeiro', mobileLabel: 'Financeiro', count: stats?.by_type?.financeiro || 0 },
              { key: 'sistema', label: 'Sistema', mobileLabel: 'Sistema', count: stats?.by_type?.sistema || 0 },
              { key: 'cliente', label: 'Clientes', mobileLabel: 'Clientes', count: stats?.by_type?.cliente || 0 }
            ].map(({ key, label, mobileLabel, count }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(key as any)}
                className="h-8 px-2 text-xs flex-shrink-0"
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{mobileLabel}</span>
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de notificações */}
        <ScrollArea className="h-96 sm:h-96 h-80">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando notificações...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {filter === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação encontrada'}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-muted/50",
                    !notification.read && "bg-blue-50 dark:bg-blue-950/20",
                    getPriorityColor(notification.priority)
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {(() => {
                              try {
                                // Verificar se created_at existe e é válido
                                if (!notification.created_at) {
                                  return 'Data não disponível';
                                }
                                
                                const date = new Date(notification.created_at);
                                if (isNaN(date.getTime())) {
                                  console.warn('Data inválida:', notification.created_at);
                                  return 'Data inválida';
                                }
                                
                                // Usar formatação simples como fallback
                                const now = new Date();
                                const diffMs = now.getTime() - date.getTime();
                                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                
                                if (diffMinutes < 1) {
                                  return 'agora';
                                } else if (diffMinutes < 60) {
                                  return `há ${diffMinutes} min`;
                                } else if (diffHours < 24) {
                                  return `há ${diffHours}h`;
                                } else {
                                  return `há ${diffDays} dias`;
                                }
                              } catch (error) {
                                console.error('Erro ao formatar data:', error, 'Data:', notification.created_at);
                                return 'Data inválida';
                              }
                            })()}
                          </span>
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
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {notification.action_url && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(notification.action_url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <span className="truncate">{notification.action_text || 'Ver detalhes'}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // Implementar navegação para página de notificações
                  console.log('Ver todas as notificações');
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
