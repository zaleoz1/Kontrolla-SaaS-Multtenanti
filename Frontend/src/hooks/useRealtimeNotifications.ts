import { useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

interface RealtimeNotificationData {
  type: 'venda' | 'estoque' | 'financeiro' | 'sistema';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  action_text?: string;
}

export function useRealtimeNotifications() {
  const { addLocalNotification } = useNotifications();

  // Simular notificações em tempo real (em produção, usar WebSocket ou Server-Sent Events)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular notificações aleatórias para demonstração
      const shouldNotify = Math.random() < 0.1; // 10% de chance a cada intervalo
      
      if (shouldNotify) {
        const notificationTypes: RealtimeNotificationData[] = [
          {
            type: 'venda',
            title: 'Nova venda realizada',
            message: 'Uma nova venda foi registrada no sistema',
            priority: 'medium',
            action_url: '/dashboard/vendas',
            action_text: 'Ver vendas'
          },
          {
            type: 'estoque',
            title: 'Estoque baixo',
            message: 'Produto "Produto Exemplo" está com estoque baixo',
            priority: 'high',
            action_url: '/dashboard/produtos',
            action_text: 'Ver produtos'
          },
          {
            type: 'financeiro',
            title: 'Conta a receber vencida',
            message: 'Uma conta a receber venceu hoje',
            priority: 'urgent',
            action_url: '/dashboard/financeiro',
            action_text: 'Ver financeiro'
          },
          {
            type: 'sistema',
            title: 'Backup realizado',
            message: 'Backup automático foi concluído com sucesso',
            priority: 'low'
          }
        ];

        const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        addLocalNotification(randomNotification);
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [addLocalNotification]);

  // Função para criar notificações específicas
  const createVendaNotification = useCallback((vendaData: any) => {
    addLocalNotification({
      type: 'venda',
      title: 'Nova venda realizada',
      message: `Venda #${vendaData.numero_venda} no valor de R$ ${vendaData.total.toFixed(2)}`,
      priority: 'medium',
      action_url: `/dashboard/vendas/${vendaData.id}`,
      action_text: 'Ver venda',
      data: vendaData
    });
  }, [addLocalNotification]);

  const createEstoqueNotification = useCallback((produtoData: any) => {
    addLocalNotification({
      type: 'estoque',
      title: 'Estoque baixo',
      message: `Produto "${produtoData.nome}" está com estoque baixo (${produtoData.estoque_atual} unidades)`,
      priority: 'high',
      action_url: `/dashboard/produtos/${produtoData.id}`,
      action_text: 'Ver produto',
      data: produtoData
    });
  }, [addLocalNotification]);

  const createFinanceiroNotification = useCallback((contaData: any) => {
    addLocalNotification({
      type: 'financeiro',
      title: 'Conta vencida',
      message: `Conta "${contaData.descricao}" no valor de R$ ${contaData.valor.toFixed(2)} venceu`,
      priority: 'urgent',
      action_url: '/dashboard/financeiro',
      action_text: 'Ver financeiro',
      data: contaData
    });
  }, [addLocalNotification]);

  const createSistemaNotification = useCallback((sistemaData: any) => {
    addLocalNotification({
      type: 'sistema',
      title: sistemaData.title || 'Notificação do sistema',
      message: sistemaData.message,
      priority: sistemaData.priority || 'low',
      action_url: sistemaData.action_url,
      action_text: sistemaData.action_text,
      data: sistemaData
    });
  }, [addLocalNotification]);

  return {
    createVendaNotification,
    createEstoqueNotification,
    createFinanceiroNotification,
    createSistemaNotification
  };
}
