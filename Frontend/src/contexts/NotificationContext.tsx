import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';

interface NotificationContextType {
  // Estado das notificações
  notifications: any[];
  stats: any;
  loading: boolean;
  
  // Ações das notificações
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  addLocalNotification: (notification: any) => void;
  
  // Triggers de notificações
  triggerNovaVenda: (vendaData: any) => void;
  triggerVendaCancelada: (vendaData: any) => void;
  triggerEstoqueBaixo: (produtoData: any) => void;
  triggerEstoqueZerado: (produtoData: any) => void;
  triggerContaVencida: (contaData: any) => void;
  triggerContaVencendo: (contaData: any) => void;
  triggerBackupRealizado: () => void;
  triggerErroSistema: (erroData: any) => void;
  triggerAtualizacaoDisponivel: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notifications = useNotifications();
  const realtimeNotifications = useRealtimeNotifications();
  const notificationTriggers = useNotificationTriggers();

  const value: NotificationContextType = {
    // Estado das notificações
    notifications: notifications.notifications,
    stats: notifications.stats,
    loading: notifications.loading,
    
    // Ações das notificações
    loadNotifications: notifications.loadNotifications,
    markAsRead: notifications.markAsRead,
    markAllAsRead: notifications.markAllAsRead,
    deleteNotification: notifications.deleteNotification,
    deleteAllNotifications: notifications.deleteAllNotifications,
    addLocalNotification: notifications.addLocalNotification,
    
    // Triggers de notificações
    triggerNovaVenda: notificationTriggers.triggerNovaVenda,
    triggerVendaCancelada: notificationTriggers.triggerVendaCancelada,
    triggerEstoqueBaixo: notificationTriggers.triggerEstoqueBaixo,
    triggerEstoqueZerado: notificationTriggers.triggerEstoqueZerado,
    triggerContaVencida: notificationTriggers.triggerContaVencida,
    triggerContaVencendo: notificationTriggers.triggerContaVencendo,
    triggerBackupRealizado: notificationTriggers.triggerBackupRealizado,
    triggerErroSistema: notificationTriggers.triggerErroSistema,
    triggerAtualizacaoDisponivel: notificationTriggers.triggerAtualizacaoDisponivel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
