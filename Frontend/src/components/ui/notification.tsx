import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Info, X, ShoppingBag, Package, DollarSign, Settings, Users } from 'lucide-react';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'venda' | 'estoque' | 'financeiro' | 'sistema' | 'cliente';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  venda: ShoppingBag,
  estoque: Package,
  financeiro: DollarSign,
  sistema: Settings,
  cliente: Users,
};

const notificationStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  venda: 'bg-green-50 border-green-200 text-green-800',
  estoque: 'bg-orange-50 border-orange-200 text-orange-800',
  financeiro: 'bg-blue-50 border-blue-200 text-blue-800',
  sistema: 'bg-purple-50 border-purple-200 text-purple-800',
  cliente: 'bg-cyan-50 border-cyan-200 text-cyan-800',
};

export function Notification({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: NotificationProps) {
  const Icon = notificationIcons[type] || Info; // Fallback para Info se o tipo não existir

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  // Verificação de segurança para o ícone
  if (!Icon) {
    console.error('Ícone não encontrado para o tipo:', type);
    return null;
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-2 sm:gap-3 rounded-lg border p-3 sm:p-4 shadow-lg transition-all duration-300',
        notificationStyles[type] || notificationStyles.info // Fallback para info se o tipo não existir
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold truncate">{title}</h4>
        {message && (
          <p className="mt-1 text-sm opacity-90 line-clamp-2">{message}</p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export interface NotificationContainerProps {
  notifications: any[]; // Mudança para aceitar qualquer estrutura de notificação
  onClose: (id: string) => void;
}

export function NotificationContainer({
  notifications,
  onClose,
}: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  // Função local para remover notificação apenas da interface (não do servidor)
  const handleClose = (id: string) => {
    // Por enquanto, apenas chama a função onClose original
    // Em um sistema real, isso deveria apenas remover da interface local
    onClose(id);
  };

  return (
    <div className="fixed top-4 right-4 sm:right-4 right-2 z-50 space-y-2 max-w-sm w-[calc(100vw-1rem)] sm:w-96">
      {notifications.map((notification) => {
        // Mapear a estrutura da notificação para o formato esperado pelo componente Notification
        const mappedNotification = {
          id: notification.id,
          type: notification.type || 'info',
          title: notification.title || notification.titulo || 'Notificação',
          message: notification.message || notification.mensagem || '',
          duration: 0, // Desabilitar auto-close para evitar chamadas desnecessárias
          onClose: handleClose
        };

        return (
          <Notification
            key={notification.id}
            {...mappedNotification}
          />
        );
      })}
    </div>
  );
}
