import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar notificações
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    // Query mais simples sem paginação por enquanto
    const notificationsQuery = `
      SELECT 
        id,
        titulo,
        mensagem,
        tipo,
        lida,
        data_criacao,
        data_leitura
      FROM notificacoes 
      WHERE tenant_id = ?
      ORDER BY data_criacao DESC
    `;

    const notifications = await queryWithResult(notificationsQuery, [tenantId]);

    // Mapear os campos para o formato esperado pelo frontend
    const mappedNotifications = notifications.map(notification => ({
      id: notification.id.toString(),
      type: notification.tipo,
      title: notification.titulo,
      message: notification.mensagem,
      read: Boolean(notification.lida),
      created_at: notification.data_criacao ? new Date(notification.data_criacao).toISOString() : null,
      data_leitura: notification.data_leitura ? new Date(notification.data_leitura).toISOString() : null,
      priority: 'medium' // Valor padrão, pode ser ajustado conforme necessário
    }));

    // Calcular estatísticas por tipo
    const statsByType = {
      venda: notifications.filter(n => n.tipo === 'venda').length,
      estoque: notifications.filter(n => n.tipo === 'estoque').length,
      financeiro: notifications.filter(n => n.tipo === 'financeiro').length,
      sistema: notifications.filter(n => n.tipo === 'sistema').length,
      cliente: notifications.filter(n => n.tipo === 'cliente').length
    };

    res.json({
      success: true,
      data: {
        notifications: mappedNotifications,
        stats: {
          total: notifications.length,
          unread: notifications.filter(n => !n.lida).length,
          by_type: statsByType
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Marcar notificação como lida
router.patch('/:id/lida', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    const updateQuery = `
      UPDATE notificacoes 
      SET lida = 1, data_leitura = NOW() 
      WHERE id = ? AND tenant_id = ?
    `;

    const result = await query(updateQuery, [id, tenantId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Marcar todas as notificações como lidas
router.patch('/marcar-todas-lidas', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const updateQuery = `
      UPDATE notificacoes 
      SET lida = 1, data_leitura = NOW() 
      WHERE tenant_id = ? AND lida = 0
    `;

    const result = await query(updateQuery, [tenantId]);

    res.json({
      success: true,
      message: `${result.affectedRows} notificações marcadas como lidas`
    });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Deletar todas as notificações lidas
router.delete('/lidas', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const deleteQuery = `
      DELETE FROM notificacoes 
      WHERE tenant_id = ? AND lida = 1
    `;

    const result = await query(deleteQuery, [tenantId]);

    res.json({
      success: true,
      message: `${result.affectedRows} notificações lidas excluídas`
    });
  } catch (error) {
    console.error('Erro ao excluir notificações lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Deletar notificação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    const deleteQuery = `
      DELETE FROM notificacoes 
      WHERE id = ? AND tenant_id = ?
    `;

    const result = await query(deleteQuery, [id, tenantId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Contar notificações não lidas
router.get('/contador', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const countQuery = `
      SELECT COUNT(*) as total_nao_lidas
      FROM notificacoes 
      WHERE tenant_id = ? AND lida = 0
    `;

    const result = await queryWithResult(countQuery, [tenantId]);
    const totalNaoLidas = result[0].total_nao_lidas;

    res.json({
      success: true,
      data: {
        total_nao_lidas: totalNaoLidas
      }
    });
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verificar estoque baixo manualmente
router.post('/verificar-estoque', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    // Importar o NotificationService dinamicamente para evitar dependência circular
    const NotificationService = (await import('../services/notificationService.js')).default;
    
    await NotificationService.checkAndNotifyLowStock(tenantId);
    
    res.json({
      success: true,
      message: 'Verificação de estoque baixo concluída'
    });
  } catch (error) {
    console.error('Erro ao verificar estoque baixo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
