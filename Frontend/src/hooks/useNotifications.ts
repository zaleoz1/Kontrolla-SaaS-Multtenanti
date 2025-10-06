import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'venda' | 'estoque' | 'financeiro' | 'sistema' | 'cliente';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  action_text?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    venda: number;
    estoque: number;
    financeiro: number;
    sistema: number;
    cliente: number;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    by_type: { venda: 0, estoque: 0, financeiro: 0, sistema: 0, cliente: 0 }
  });
  const [loading, setLoading] = useState(false);
  const { makeRequest } = useApi();

  // Carregar notificações do servidor
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await makeRequest('/notifications', 'GET');
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setStats(response.data.stats || {
          total: 0,
          unread: 0,
          by_type: { venda: 0, estoque: 0, financeiro: 0, sistema: 0, cliente: 0 }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await makeRequest(`/notifications/${id}/lida`, { method: 'PATCH' });
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1)
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [makeRequest]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await makeRequest('/notifications/marcar-todas-lidas', { method: 'PATCH' });
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setStats(prev => ({ ...prev, unread: 0 }));
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [makeRequest]);

  // Deletar notificação
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await makeRequest(`/notifications/${id}`, { method: 'DELETE' });
      if (response.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          unread: Math.max(0, prev.unread - 1)
        }));
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, [makeRequest]);

  // Deletar todas as notificações
  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await makeRequest('/notifications/lidas', { method: 'DELETE' });
      if (response.success) {
        setNotifications([]);
        setStats({ total: 0, unread: 0, by_type: { venda: 0, estoque: 0, financeiro: 0, sistema: 0 } });
      }
    } catch (error) {
      console.error('Erro ao deletar todas as notificações:', error);
    }
  }, [makeRequest]);

  // Adicionar notificação local (para feedback imediato)
  const addLocalNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      created_at: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      unread: prev.unread + 1,
      by_type: {
        ...(prev.by_type || { venda: 0, estoque: 0, financeiro: 0, sistema: 0 }),
        [notification.type]: ((prev.by_type || {})[notification.type as keyof typeof prev.by_type] || 0) + 1
      }
    }));
  }, []);

  // Carregar notificações na inicialização
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    stats,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    addLocalNotification
  };
}