import { useCallback } from 'react';
import { useRealtimeNotifications } from './useRealtimeNotifications';

export function useNotificationTriggers() {
  const { 
    createVendaNotification, 
    createEstoqueNotification, 
    createFinanceiroNotification, 
    createSistemaNotification 
  } = useRealtimeNotifications();

  // Notificações de vendas
  const triggerNovaVenda = useCallback((vendaData: any) => {
    createVendaNotification({
      id: vendaData.id,
      numero_venda: vendaData.numero_venda,
      total: vendaData.total,
      cliente_nome: vendaData.cliente_nome,
      vendedor_nome: vendaData.vendedor_nome,
      data_venda: vendaData.data_venda
    });
  }, [createVendaNotification]);

  const triggerVendaCancelada = useCallback((vendaData: any) => {
    createSistemaNotification({
      title: 'Venda cancelada',
      message: `Venda #${vendaData.numero_venda} foi cancelada`,
      priority: 'medium',
      action_url: `/dashboard/vendas/${vendaData.id}`,
      action_text: 'Ver venda'
    });
  }, [createSistemaNotification]);

  // Notificações de estoque
  const triggerEstoqueBaixo = useCallback((produtoData: any) => {
    createEstoqueNotification({
      id: produtoData.id,
      nome: produtoData.nome,
      estoque_atual: produtoData.estoque_atual,
      estoque_minimo: produtoData.estoque_minimo,
      categoria_nome: produtoData.categoria_nome
    });
  }, [createEstoqueNotification]);

  const triggerEstoqueZerado = useCallback((produtoData: any) => {
    createEstoqueNotification({
      id: produtoData.id,
      nome: produtoData.nome,
      estoque_atual: 0,
      estoque_minimo: produtoData.estoque_minimo,
      categoria_nome: produtoData.categoria_nome
    });
  }, [createEstoqueNotification]);

  // Notificações financeiras
  const triggerContaVencida = useCallback((contaData: any) => {
    createFinanceiroNotification({
      id: contaData.id,
      descricao: contaData.descricao,
      valor: contaData.valor,
      data_vencimento: contaData.data_vencimento,
      cliente_nome: contaData.cliente_nome,
      fornecedor_nome: contaData.fornecedor_nome
    });
  }, [createFinanceiroNotification]);

  const triggerContaVencendo = useCallback((contaData: any) => {
    createFinanceiroNotification({
      id: contaData.id,
      descricao: contaData.descricao,
      valor: contaData.valor,
      data_vencimento: contaData.data_vencimento,
      cliente_nome: contaData.cliente_nome,
      fornecedor_nome: contaData.fornecedor_nome
    });
  }, [createFinanceiroNotification]);

  // Notificações de sistema
  const triggerBackupRealizado = useCallback(() => {
    createSistemaNotification({
      title: 'Backup realizado',
      message: 'Backup automático foi concluído com sucesso',
      priority: 'low'
    });
  }, [createSistemaNotification]);

  const triggerErroSistema = useCallback((erroData: any) => {
    createSistemaNotification({
      title: 'Erro no sistema',
      message: erroData.message || 'Ocorreu um erro no sistema',
      priority: 'urgent',
      action_url: '/dashboard/configuracoes',
      action_text: 'Ver configurações'
    });
  }, [createSistemaNotification]);

  const triggerAtualizacaoDisponivel = useCallback(() => {
    createSistemaNotification({
      title: 'Atualização disponível',
      message: 'Uma nova versão do sistema está disponível',
      priority: 'medium',
      action_url: '/dashboard/download',
      action_text: 'Baixar atualização'
    });
  }, [createSistemaNotification]);

  return {
    // Vendas
    triggerNovaVenda,
    triggerVendaCancelada,
    
    // Estoque
    triggerEstoqueBaixo,
    triggerEstoqueZerado,
    
    // Financeiro
    triggerContaVencida,
    triggerContaVencendo,
    
    // Sistema
    triggerBackupRealizado,
    triggerErroSistema,
    triggerAtualizacaoDisponivel
  };
}
