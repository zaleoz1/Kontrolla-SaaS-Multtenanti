import { query } from '../database/connection.js';

/**
 * Serviço para criar notificações automáticas
 */
class NotificationService {
  /**
   * Criar uma notificação
   * @param {number} tenantId - ID do tenant
   * @param {string} titulo - Título da notificação
   * @param {string} mensagem - Mensagem da notificação
   * @param {string} tipo - Tipo da notificação (venda, estoque, financeiro, sistema, cliente)
   * @param {object} data - Dados adicionais (opcional)
   */
  static async createNotification(tenantId, titulo, mensagem, tipo, data = null) {
    try {
      const result = await query(
        `INSERT INTO notificacoes (tenant_id, titulo, mensagem, tipo, data_criacao)
         VALUES (?, ?, ?, ?, NOW())`,
        [tenantId, titulo, mensagem, tipo]
      );

      console.log(`🔔 Notificação criada: ${titulo} (${tipo})`);
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Notificação de nova venda
   */
  static async notifyNewSale(tenantId, vendaId, total, clienteNome = null) {
    const titulo = 'Nova Venda Realizada';
    const mensagem = clienteNome 
      ? `Venda #${vendaId} para ${clienteNome} - R$ ${total.toFixed(2)}`
      : `Venda #${vendaId} - R$ ${total.toFixed(2)}`;
    
    return await this.createNotification(tenantId, titulo, mensagem, 'venda', {
      venda_id: vendaId,
      total: total,
      cliente: clienteNome
    });
  }

  /**
   * Notificação de estoque baixo
   */
  static async notifyLowStock(tenantId, produtoId, produtoNome, estoqueAtual, estoqueMinimo) {
    const titulo = 'Estoque Baixo';
    const mensagem = `${produtoNome} - Estoque: ${estoqueAtual} (Mínimo: ${estoqueMinimo})`;
    
    return await this.createNotification(tenantId, titulo, mensagem, 'estoque', {
      produto_id: produtoId,
      produto_nome: produtoNome,
      estoque_atual: estoqueAtual,
      estoque_minimo: estoqueMinimo
    });
  }

  /**
   * Notificação de produto sem estoque
   */
  static async notifyOutOfStock(tenantId, produtoId, produtoNome) {
    const titulo = 'Produto Sem Estoque';
    const mensagem = `${produtoNome} está sem estoque`;
    
    return await this.createNotification(tenantId, titulo, mensagem, 'estoque', {
      produto_id: produtoId,
      produto_nome: produtoNome
    });
  }

  /**
   * Notificação de nova transação financeira
   */
  static async notifyNewTransaction(tenantId, tipo, valor, descricao) {
    const titulo = tipo === 'receita' ? 'Nova Receita' : 'Nova Despesa';
    const mensagem = `${descricao} - R$ ${valor.toFixed(2)}`;
    
    return await this.createNotification(tenantId, titulo, mensagem, 'financeiro', {
      tipo: tipo,
      valor: valor,
      descricao: descricao
    });
  }

  /**
   * Notificação de novo cliente
   */
  static async notifyNewClient(tenantId, clienteId, clienteNome) {
    const titulo = 'Novo Cliente Cadastrado';
    const mensagem = `${clienteNome} foi cadastrado no sistema`;
    
    return await this.createNotification(tenantId, titulo, mensagem, 'cliente', {
      cliente_id: clienteId,
      cliente_nome: clienteNome
    });
  }

  /**
   * Notificação de novo produto
   */
  static async notifyNewProduct(tenantId, produtoId, produtoNome) {
    const titulo = 'Novo Produto Cadastrado';
    const mensagem = `${produtoNome} foi adicionado ao catálogo`;
    
    return await this.createNotification(tenantId, titulo, mensagem, 'estoque', {
      produto_id: produtoId,
      produto_nome: produtoNome
    });
  }

  /**
   * Notificação de sistema
   */
  static async notifySystem(tenantId, titulo, mensagem) {
    return await this.createNotification(tenantId, titulo, mensagem, 'sistema');
  }

  /**
   * Verificar e notificar sobre estoque baixo
   */
  static async checkAndNotifyLowStock(tenantId) {
    try {
      // Buscar produtos com estoque baixo
      const produtos = await query(
        `SELECT id, nome, estoque, estoque_minimo, estoque_kg, estoque_litros, 
                estoque_minimo_kg, estoque_minimo_litros, tipo_preco
         FROM produtos 
         WHERE tenant_id = ? AND status = 'ativo'`,
        [tenantId]
      );

      for (const produto of produtos) {
        let estoqueAtual = 0;
        let estoqueMinimo = 0;
        let precisaNotificar = false;

        // Verificar estoque baseado no tipo de preço
        if (produto.tipo_preco === 'kg') {
          estoqueAtual = produto.estoque_kg || 0;
          estoqueMinimo = produto.estoque_minimo_kg || 0;
        } else if (produto.tipo_preco === 'litros') {
          estoqueAtual = produto.estoque_litros || 0;
          estoqueMinimo = produto.estoque_minimo_litros || 0;
        } else {
          estoqueAtual = produto.estoque || 0;
          estoqueMinimo = produto.estoque_minimo || 0;
        }

        // Verificar se precisa notificar
        if (estoqueAtual <= 0) {
          await this.notifyOutOfStock(tenantId, produto.id, produto.nome);
        } else if (estoqueAtual <= estoqueMinimo && estoqueMinimo > 0) {
          await this.notifyLowStock(tenantId, produto.id, produto.nome, estoqueAtual, estoqueMinimo);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar estoque baixo:', error);
    }
  }
}

export default NotificationService;
