import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateVenda, validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';
import NotificationService from '../services/notificationService.js';
import { 
  getFocusNfeConfig, 
  emitirNfe as focusEmitirNfe,
  validarConfiguracoes as validarConfigNfe
} from '../services/focusNfeService.js';

const router = express.Router();

// Função auxiliar para obter nome do método de pagamento
function getPaymentMethodName(metodo) {
  const metodos = {
    'dinheiro': 'Dinheiro',
    'cartao_credito': 'Cartão de Crédito',
    'cartao_debito': 'Cartão de Débito',
    'pix': 'PIX',
    'transferencia': 'Transferência',
    'boleto': 'Boleto',
    'cheque': 'Cheque',
    'prazo': 'A Prazo'
  };
  return metodos[metodo] || metodo;
}

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar vendas com paginação e busca
router.get('/', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE v.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de busca
    if (q && q.trim().length > 0) {
      whereClause += ' AND (v.numero_venda LIKE ? OR c.nome LIKE ? OR c.email LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Adicionar filtro de status
    if (status) {
      // Para vendas com pagamento múltiplo, buscar tanto pagas quanto pendentes
      // para que possam ser separadas no frontend
      if (status === 'pago' || status === 'pendente') {
        whereClause += ` AND (
          v.status = ? OR 
          (EXISTS(SELECT 1 FROM venda_pagamentos vp WHERE vp.venda_id = v.id) AND EXISTS(SELECT 1 FROM contas_receber cr WHERE cr.venda_id = v.id))
        )`;
        params.push(status);
      } else {
        whereClause += ' AND v.status = ?';
        params.push(status);
      }
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClause += ' AND DATE(v.data_venda) >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      whereClause += ' AND DATE(v.data_venda) <= ?';
      params.push(data_fim);
    }

    // Buscar vendas com informações do cliente (otimizada)
    const vendas = await query(
      `SELECT v.id, v.numero_venda, v.data_venda, v.status, 
              CAST(v.subtotal AS DECIMAL(10,2)) as subtotal, 
              CAST(v.desconto AS DECIMAL(10,2)) as desconto, 
              CAST(v.total AS DECIMAL(10,2)) as total, 
              v.forma_pagamento, v.parcelas, v.observacoes, v.cliente_id, v.usuario_id,
              c.nome as cliente_nome, c.email as cliente_email, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id AND c.tenant_id = v.tenant_id
       LEFT JOIN usuarios u ON v.usuario_id = u.id AND u.tenant_id = v.tenant_id
       ${whereClause} 
       ORDER BY v.data_venda DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    // Buscar itens e métodos de pagamento para cada venda
    const vendasComItens = await Promise.all(
      vendas.map(async (venda) => {
        const itens = await query(
          `SELECT vi.*, p.nome as produto_nome, p.codigo_barras, p.sku, p.tipo_preco
           FROM venda_itens vi
           JOIN produtos p ON vi.produto_id = p.id
           WHERE vi.venda_id = ?
           ORDER BY vi.id`,
          [venda.id]
        );

        // Buscar métodos de pagamento
        const metodosPagamento = await query(
          `SELECT metodo, 
                  CAST(valor AS DECIMAL(10,2)) as valor, 
                  CAST(troco AS DECIMAL(10,2)) as troco,
                  parcelas,
                  CAST(taxa_parcela AS DECIMAL(5,2)) as taxa_parcela,
                  CAST(valor_original AS DECIMAL(10,2)) as valor_original
           FROM venda_pagamentos
           WHERE venda_id = ?
           ORDER BY id`,
          [venda.id]
        );

        // Buscar pagamento a prazo (se houver) - agora em contas_receber
        const pagamentoPrazo = await query(
          `SELECT 
            dias,
            juros,
            valor_original,
            valor_com_juros,
            data_vencimento, 
            status
           FROM contas_receber
           WHERE venda_id = ? AND descricao LIKE 'Pagamento a prazo%'
           ORDER BY id`,
          [venda.id]
        );
        
        return {
          ...venda,
          itens,
          metodos_pagamento: metodosPagamento,
          pagamento_prazo: pagamentoPrazo.length > 0 ? pagamentoPrazo[0] : null
        };
      })
    );

    // Contar total de registros (otimizada)
    const [totalResult] = await query(
      `SELECT COUNT(*) as total 
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id AND c.tenant_id = v.tenant_id
       LEFT JOIN usuarios u ON v.usuario_id = u.id AND u.tenant_id = v.tenant_id
       ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    // Calcular saldo efetivo (soma dos pagamentos da tabela venda_pagamentos)
    // Sempre calcular sem filtro de status para mostrar total de pagamentos recebidos
    let saldoEfetivoWhereClause = 'WHERE v.tenant_id = ?';
    let saldoEfetivoParams = [req.user.tenant_id];
    
    // Aplicar apenas filtros de busca e data, mas não de status
    if (q && q.trim().length > 0) {
      saldoEfetivoWhereClause += ' AND (v.numero_venda LIKE ? OR c.nome LIKE ? OR c.email LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      saldoEfetivoParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (data_inicio) {
      saldoEfetivoWhereClause += ' AND DATE(v.data_venda) >= ?';
      saldoEfetivoParams.push(data_inicio);
    }
    
    if (data_fim) {
      saldoEfetivoWhereClause += ' AND DATE(v.data_venda) <= ?';
      saldoEfetivoParams.push(data_fim);
    }
    
    const [saldoEfetivoResult] = await query(
      `SELECT COALESCE(SUM(vp.valor - COALESCE(vp.troco, 0)), 0) as saldo_efetivo
       FROM vendas v
       LEFT JOIN venda_pagamentos vp ON v.id = vp.venda_id
       LEFT JOIN clientes c ON v.cliente_id = c.id AND c.tenant_id = v.tenant_id
       ${saldoEfetivoWhereClause}`,
      saldoEfetivoParams
    );

    res.json({
      vendas: vendasComItens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      saldoEfetivo: saldoEfetivoResult.saldo_efetivo
    });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar venda por ID
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar venda
    const vendas = await query(
      `SELECT v.*, c.nome as cliente_nome, c.email as cliente_email, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ? AND v.tenant_id = ?`,
      [id, req.user.tenant_id]
    );

    if (vendas.length === 0) {
      return res.status(404).json({
        error: 'Venda não encontrada'
      });
    }

    // Buscar itens da venda
    const itens = await query(
      `SELECT vi.*, p.nome as produto_nome, p.codigo_barras, p.sku, p.tipo_preco
       FROM venda_itens vi
       JOIN produtos p ON vi.produto_id = p.id
       WHERE vi.venda_id = ?
       ORDER BY vi.id`,
      [id]
    );

    // Buscar métodos de pagamento
    const metodosPagamento = await query(
      `SELECT metodo, 
              CAST(valor AS DECIMAL(10,2)) as valor, 
              CAST(troco AS DECIMAL(10,2)) as troco,
              parcelas,
              CAST(taxa_parcela AS DECIMAL(5,2)) as taxa_parcela,
              CAST(valor_original AS DECIMAL(10,2)) as valor_original
       FROM venda_pagamentos
       WHERE venda_id = ?
       ORDER BY id`,
      [id]
    );

    // Buscar pagamento a prazo (se houver) - agora em contas_receber
    const pagamentoPrazo = await query(
      `SELECT 
        dias,
        juros,
        valor_original,
        valor_com_juros,
        data_vencimento, 
        status
       FROM contas_receber
       WHERE venda_id = ? AND descricao LIKE 'Pagamento a prazo%'
       ORDER BY id`,
      [id]
    );

    res.json({
      venda: {
        ...vendas[0],
        itens,
        metodos_pagamento: metodosPagamento,
        pagamento_prazo: pagamentoPrazo.length > 0 ? pagamentoPrazo[0] : null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar nova venda
router.post('/', validateVenda, async (req, res) => {
  try {
    const {
      cliente_id,
      itens = [],
      subtotal,
      desconto = 0,
      total,
      forma_pagamento,
      metodos_pagamento = [],
      pagamento_prazo,
      parcelas = 1,
      observacoes,
      status = 'pendente',
      emitir_nfe = false // Opção para emitir NF-e automaticamente
    } = req.body;

    // Debug: verificar dados recebidos
    console.log('Dados recebidos na criação da venda:', {
      cliente_id,
      total,
      forma_pagamento,
      metodos_pagamento,
      pagamento_prazo,
      status,
      usarPagamentoPrazo: req.body.pagamento_prazo ? true : false
    });
    
    // Debug: verificar estrutura dos métodos de pagamento
    if (metodos_pagamento && metodos_pagamento.length > 0) {
      console.log('Métodos de pagamento detalhados:', metodos_pagamento);
    }
    
    // Debug: verificar estrutura do pagamento a prazo
    if (pagamento_prazo) {
      console.log('Pagamento a prazo detalhado:', pagamento_prazo);
    }

    // Verificar se cliente existe (se fornecido)
    if (cliente_id) {
      const clientes = await query(
        'SELECT id FROM clientes WHERE id = ? AND tenant_id = ?',
        [cliente_id, req.user.tenant_id]
      );

      if (clientes.length === 0) {
        return res.status(400).json({
          error: 'Cliente não encontrado'
        });
      }
    }

    // Verificar se há itens
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        error: 'Venda deve ter pelo menos um item'
      });
    }

    // Verificar produtos e estoque
    for (const item of itens) {
      const produtos = await query(
        `SELECT id, nome, estoque, preco, tipo_preco, estoque_kg, estoque_litros,
                CASE 
                  WHEN tipo_preco = 'kg' THEN estoque_kg
                  WHEN tipo_preco = 'litros' THEN estoque_litros
                  ELSE estoque
                END as estoque_atual
         FROM produtos WHERE id = ? AND tenant_id = ? AND status = "ativo"`,
        [item.produto_id, req.user.tenant_id]
      );

      if (produtos.length === 0) {
        return res.status(400).json({
          error: `Produto com ID ${item.produto_id} não encontrado ou inativo`
        });
      }

      const produto = produtos[0];
      const estoqueDisponivel = produto.estoque_atual || 0;
      
      if (estoqueDisponivel < item.quantidade) {
        return res.status(400).json({
          error: `Estoque insuficiente para o produto ${produto.nome}. Disponível: ${estoqueDisponivel}`
        });
      }
    }

    // Gerar número da venda
    const numeroVenda = await gerarNumeroVenda(req.user.tenant_id);

    // Determinar forma de pagamento principal (para compatibilidade)
    let formaPagamentoPrincipal = forma_pagamento;
    if (metodos_pagamento && metodos_pagamento.length > 0) {
      formaPagamentoPrincipal = metodos_pagamento[0].metodo;
    } else if (pagamento_prazo) {
      // Se há pagamento a prazo mas não há métodos de pagamento, usar 'prazo'
      formaPagamentoPrincipal = 'prazo';
    }

    // Calcular o total correto para a tabela vendas
    let totalVenda = total;
    
    // Se há pagamento a prazo e métodos de pagamento à vista, o total da venda deve ser apenas o valor pago à vista
    if (pagamento_prazo && metodos_pagamento && metodos_pagamento.length > 0) {
      totalVenda = metodos_pagamento.reduce((sum, metodo) => {
        return sum + (parseFloat(metodo.valor) || 0);
      }, 0);
    }
    
    // Debug: verificar cálculo do total
    console.log('Debug - Cálculo do total da venda:', {
      totalOriginal: total,
      totalVenda,
      temPagamentoPrazo: !!pagamento_prazo,
      metodosPagamento: metodos_pagamento?.length || 0,
      metodosPagamentoValores: metodos_pagamento?.map(m => parseFloat(m.valor) || 0) || []
    });

    // Iniciar transação
    const result = await queryWithResult(
      `INSERT INTO vendas (
        tenant_id, cliente_id, usuario_id, numero_venda, subtotal, desconto, total,
        forma_pagamento, parcelas, observacoes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, cliente_id, req.user.id, numeroVenda, subtotal,
        desconto, totalVenda, formaPagamentoPrincipal, parcelas, observacoes, status
      ]
    );

    const vendaId = result.insertId;

    // Inserir itens da venda e atualizar estoque
    for (const item of itens) {
      // Inserir item da venda
      await query(
        `INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, preco_total, desconto)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          vendaId, item.produto_id, item.quantidade, item.preco_unitario,
          item.preco_total, item.desconto || 0
        ]
      );

      // Atualizar estoque do produto baseado no tipo
      const produtoInfo = await query(
        'SELECT tipo_preco FROM produtos WHERE id = ?',
        [item.produto_id]
      );
      
      if (produtoInfo.length > 0) {
        const produto = produtoInfo[0];
        if (produto.tipo_preco === 'kg') {
          await query(
            'UPDATE produtos SET estoque_kg = estoque_kg - ? WHERE id = ?',
            [item.quantidade, item.produto_id]
          );
        } else if (produto.tipo_preco === 'litros') {
          await query(
            'UPDATE produtos SET estoque_litros = estoque_litros - ? WHERE id = ?',
            [item.quantidade, item.produto_id]
          );
        } else {
          await query(
            'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
            [item.quantidade, item.produto_id]
          );
        }
      }
    }

    // Salvar métodos de pagamento (se houver)
    if (metodos_pagamento && metodos_pagamento.length > 0) {
      for (const metodo of metodos_pagamento) {
        // O valor já vem do frontend como valor original (sem taxas da máquina)
        // As taxas são apenas para controle da máquina, não afetam o valor da venda
        let valorOriginal = parseFloat(metodo.valor);
        
        await query(
          `INSERT INTO venda_pagamentos (venda_id, metodo, valor, troco, parcelas, taxa_parcela, valor_original)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            vendaId, 
            metodo.metodo, 
            metodo.valor, 
            metodo.troco || 0,
            metodo.parcelas || 1,
            metodo.taxaParcela || 0,
            valorOriginal
          ]
        );

        // Criar transação de entrada para pagamentos à vista
        if (metodo.metodo !== 'prazo') {
          const valorTransacao = parseFloat(metodo.valor) - (metodo.troco || 0);
          
          // Calcular valor com taxa se aplicável
          let valorComTaxa = valorOriginal;
          if (metodo.taxaParcela && metodo.taxaParcela > 0) {
            valorComTaxa = valorOriginal * (1 + metodo.taxaParcela / 100);
          }

          await query(
            `INSERT INTO transacoes (
              tenant_id, tipo, categoria, descricao, valor, data_transacao,
              metodo_pagamento, conta, cliente_id, observacoes, status, venda_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.user.tenant_id,
              'entrada',
              'Vendas',
              `Venda #${numeroVenda} - ${getPaymentMethodName(metodo.metodo)}`,
              valorComTaxa,
              new Date().toISOString().split('T')[0],
              metodo.metodo,
              'Caixa',
              cliente_id,
              `Pagamento à vista da venda #${numeroVenda}`,
              'concluida',
              vendaId
            ]
          );
        }
      }
    } else if (forma_pagamento && !pagamento_prazo) {
      // Fallback para método único (compatibilidade) - apenas se não há pagamento a prazo
      await query(
        `INSERT INTO venda_pagamentos (venda_id, metodo, valor, troco)
         VALUES (?, ?, ?, ?)`,
        [vendaId, forma_pagamento, total, 0]
      );

      // Criar transação de entrada para método único
      await query(
        `INSERT INTO transacoes (
          tenant_id, tipo, categoria, descricao, valor, data_transacao,
          metodo_pagamento, conta, cliente_id, observacoes, status, venda_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id,
          'entrada',
          'Vendas',
          `Venda #${numeroVenda} - ${getPaymentMethodName(forma_pagamento)}`,
          total,
          new Date().toISOString().split('T')[0],
          forma_pagamento,
          'Caixa',
          cliente_id,
          `Pagamento à vista da venda #${numeroVenda}`,
          'concluida',
          vendaId
        ]
      );
    }

    // Salvar pagamento a prazo (se houver) - agora como conta a receber
    if (pagamento_prazo) {
      // Usar o valor original que vem do frontend (já calculado corretamente)
      const valorOriginal = pagamento_prazo.valorOriginal || total;
      const valorComJuros = pagamento_prazo.valorComJuros || valorOriginal;
      const dias = pagamento_prazo.dias ? parseInt(pagamento_prazo.dias) : null;
      const juros = pagamento_prazo.juros ? parseFloat(pagamento_prazo.juros) : 0;
      const dataVencimento = new Date(pagamento_prazo.dataVencimento).toISOString().split('T')[0];

      await query(
        `INSERT INTO contas_receber (
          tenant_id, cliente_id, venda_id, descricao, valor, data_vencimento, status, observacoes,
          dias, juros, valor_original, valor_com_juros
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id,
          cliente_id,
          vendaId,
          `Pagamento a prazo - Venda ${numeroVenda}`,
          valorComJuros,
          dataVencimento,
          'pendente',
          'Pagamento a prazo',
          dias,
          juros,
          valorOriginal,
          valorComJuros
        ]
      );
    }

    // Atualizar total de compras do cliente (se houver)
    // Somar apenas o valor pago à vista (métodos de pagamento), não incluir pagamentos a prazo
    if (cliente_id) {
      let valorPagoAVista = 0;
      
      // Se há métodos de pagamento à vista, somar apenas esses valores
      if (metodos_pagamento && metodos_pagamento.length > 0) {
        valorPagoAVista = metodos_pagamento.reduce((sum, metodo) => {
          return sum + (parseFloat(metodo.valor) || 0);
        }, 0);
      } else if (!pagamento_prazo) {
        // Se não há pagamento a prazo e não há métodos de pagamento, usar o total da venda
        valorPagoAVista = total;
      }
      
      // Atualizar total_compras apenas com o valor pago à vista
      if (valorPagoAVista > 0) {
        await query(
          'UPDATE clientes SET total_compras = total_compras + ? WHERE id = ?',
          [valorPagoAVista, cliente_id]
        );
      }
    }

    // Buscar venda criada com métodos de pagamento
    const [venda] = await query(
      `SELECT v.*, c.nome as cliente_nome, c.email as cliente_email, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?`,
      [vendaId]
    );

    // Buscar métodos de pagamento da venda criada
    const metodosPagamento = await query(
      `SELECT metodo, 
              CAST(valor AS DECIMAL(10,2)) as valor, 
              CAST(troco AS DECIMAL(10,2)) as troco,
              parcelas,
              CAST(taxa_parcela AS DECIMAL(5,2)) as taxa_parcela,
              CAST(valor_original AS DECIMAL(10,2)) as valor_original
       FROM venda_pagamentos
       WHERE venda_id = ?
       ORDER BY id`,
      [vendaId]
    );

    // Buscar pagamento a prazo (se houver) - agora em contas_receber
    const pagamentoPrazo = await query(
      `SELECT 
        dias,
        juros,
        valor_original,
        valor_com_juros,
        data_vencimento, 
        status
       FROM contas_receber
       WHERE venda_id = ? AND descricao LIKE 'Pagamento a prazo%'
       ORDER BY id`,
      [vendaId]
    );

    // Criar notificação da nova venda
    try {
      const clienteNome = venda.cliente_nome || null;
      await NotificationService.notifyNewSale(req.user.tenant_id, vendaId, parseFloat(total), clienteNome);
    } catch (notificationError) {
      console.error('Erro ao criar notificação da venda:', notificationError);
      // Não falhar a venda por causa da notificação
    }

    // Verificar estoque baixo após a venda
    try {
      await NotificationService.checkAndNotifyLowStock(req.user.tenant_id);
    } catch (stockError) {
      console.error('Erro ao verificar estoque baixo:', stockError);
      // Não falhar a venda por causa da verificação de estoque
    }

    // Emissão de NF-e (se solicitado)
    let nfeResult = null;
    if (emitir_nfe) {
      try {
        console.log(`[Venda] Iniciando emissão de NF-e para venda #${numeroVenda}...`);
        
        // Verificar configurações da Focus NFe
        const focusConfig = await getFocusNfeConfig(req.user.tenant_id);
        const validacao = await validarConfigNfe(req.user.tenant_id);
        
        if (validacao.valid) {
          // Buscar dados do cliente para a NF-e
          let clienteData = null;
          if (cliente_id) {
            const [c] = await query(
              'SELECT * FROM clientes WHERE id = ? AND tenant_id = ?',
              [cliente_id, req.user.tenant_id]
            );
            clienteData = c;
          }
          
          // Preparar itens da NF-e
          const itensNfe = itens.map((item, index) => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario
          }));
          
          // Criar NF-e no banco
          const ambienteAtual = focusConfig.ambiente || 'homologacao';
          const seriePadrao = focusConfig.serie_padrao || '001';
          
          // Gerar número da NF-e
          const [ultimaNfe] = await query(
            `SELECT MAX(CAST(numero AS UNSIGNED)) as ultimo FROM nfe WHERE tenant_id = ?`,
            [req.user.tenant_id]
          );
          const numeroNfe = (ultimaNfe?.ultimo || 0) + 1;
          
          // Criar registro da NF-e
          const nfeInsert = await queryWithResult(
            `INSERT INTO nfe (
              tenant_id, venda_id, cliente_id, cnpj_cpf, numero, serie, valor_total,
              status, ambiente, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.user.tenant_id,
              vendaId,
              cliente_id ?? null,
              clienteData?.cpf_cnpj ?? null,
              numeroNfe.toString(),
              seriePadrao,
              total,
              'pendente',
              ambienteAtual,
              `NF-e gerada automaticamente da venda #${numeroVenda}`
            ]
          );
          
          const nfeId = nfeInsert.insertId;
          
          // Inserir itens da NF-e
          for (const item of itens) {
            await query(
              `INSERT INTO nfe_itens (nfe_id, produto_id, quantidade, preco_unitario, preco_total)
               VALUES (?, ?, ?, ?, ?)`,
              [nfeId, item.produto_id, item.quantidade, item.preco_unitario, item.preco_total]
            );
          }
          
          console.log(`[Venda] NF-e #${numeroNfe} criada. Ambiente: ${ambienteAtual.toUpperCase()}`);
          
          // Emitir NF-e via Focus NFe
          try {
            const emissaoResult = await focusEmitirNfe(req.user.tenant_id, nfeId);
            nfeResult = {
              success: emissaoResult.success,
              nfe_id: nfeId,
              numero: numeroNfe.toString(),
              ambiente: ambienteAtual,
              status: emissaoResult.status,
              chave_acesso: emissaoResult.chave_acesso,
              protocolo: emissaoResult.protocolo,
              mensagem: emissaoResult.mensagem
            };
            console.log(`[Venda] NF-e emitida: ${emissaoResult.status}`);
          } catch (emissaoError) {
            console.error('[Venda] Erro ao emitir NF-e:', emissaoError.message);
            nfeResult = {
              success: false,
              nfe_id: nfeId,
              numero: numeroNfe.toString(),
              ambiente: ambienteAtual,
              status: 'erro',
              mensagem: emissaoError.message
            };
          }
        } else {
          console.log('[Venda] Configurações de NF-e inválidas:', validacao.errors);
          nfeResult = {
            success: false,
            status: 'nao_configurado',
            mensagem: 'Configurações de NF-e incompletas: ' + (validacao.errors || []).join(', ')
          };
        }
      } catch (nfeError) {
        console.error('[Venda] Erro ao processar NF-e:', nfeError);
        nfeResult = {
          success: false,
          status: 'erro',
          mensagem: nfeError.message
        };
      }
    }

    res.status(201).json({
      message: 'Venda criada com sucesso',
      venda: {
        ...venda,
        metodos_pagamento: metodosPagamento,
        pagamento_prazo: pagamentoPrazo.length > 0 ? pagamentoPrazo[0] : null
      },
      nfe: nfeResult // Resultado da emissão de NF-e (se solicitado)
    });
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});


// Deletar venda
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Extrair ID numérico real (remover sufixos como -prazo, -avista)
    const idNumerico = id.includes('-') ? id.split('-')[0] : id;

    // Verificar se venda existe
    const existingVendas = await query(
      'SELECT id, status, cliente_id, total FROM vendas WHERE id = ? AND tenant_id = ?',
      [idNumerico, req.user.tenant_id]
    );

    if (existingVendas.length === 0) {
      return res.status(404).json({
        error: 'Venda não encontrada'
      });
    }

    const venda = existingVendas[0];

    // Permitir deletar vendas de qualquer status
    // A lógica de reversão será aplicada conforme o status da venda

    // Restaurar estoque dos produtos
    const itens = await query(
      'SELECT produto_id, quantidade FROM venda_itens WHERE venda_id = ?',
      [idNumerico]
    );

    for (const item of itens) {
      // Verificar tipo do produto para restaurar o estoque correto
      const produtoInfo = await query(
        'SELECT tipo_preco FROM produtos WHERE id = ?',
        [item.produto_id]
      );
      
      if (produtoInfo.length > 0) {
        const produto = produtoInfo[0];
        if (produto.tipo_preco === 'kg') {
          await query(
            'UPDATE produtos SET estoque_kg = estoque_kg + ? WHERE id = ?',
            [item.quantidade, item.produto_id]
          );
        } else if (produto.tipo_preco === 'litros') {
          await query(
            'UPDATE produtos SET estoque_litros = estoque_litros + ? WHERE id = ?',
            [item.quantidade, item.produto_id]
          );
        } else {
          await query(
            'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
            [item.quantidade, item.produto_id]
          );
        }
      }
    }

    // Reverter total_compras do cliente (se houver)
    if (venda.cliente_id) {
      // Buscar métodos de pagamento da venda para calcular o valor pago à vista
      const metodosPagamento = await query(
        'SELECT valor FROM venda_pagamentos WHERE venda_id = ?',
        [idNumerico]
      );
      
      let valorPagoAVista = 0;
      if (metodosPagamento.length > 0) {
        // Se há métodos de pagamento, somar apenas esses valores
        valorPagoAVista = metodosPagamento.reduce((sum, metodo) => {
          return sum + (parseFloat(metodo.valor) || 0);
        }, 0);
      } else {
        // Se não há métodos de pagamento, usar o total da venda
        valorPagoAVista = venda.total;
      }
      
      // Reverter o total_compras do cliente
      if (valorPagoAVista > 0) {
        await query(
          'UPDATE clientes SET total_compras = total_compras - ? WHERE id = ?',
          [valorPagoAVista, venda.cliente_id]
        );
      }
    }

    // Nota: As transações serão removidas automaticamente no final da função

    // Verificar se é uma venda com pagamento múltiplo (tem tanto métodos de pagamento quanto pagamento a prazo)
    const temMetodosPagamento = await query(
      'SELECT COUNT(*) as count FROM venda_pagamentos WHERE venda_id = ?',
      [idNumerico]
    );
    
    const temPagamentoPrazo = await query(
      'SELECT COUNT(*) as count FROM contas_receber WHERE venda_id = ? AND descricao LIKE "Pagamento a prazo%"',
      [idNumerico]
    );

    const isVendaMultipla = temMetodosPagamento[0].count > 0 && temPagamentoPrazo[0].count > 0;

    if (isVendaMultipla) {
      // Para vendas com pagamento múltiplo, precisamos encontrar e remover a venda "parceira"
      // A venda parceira terá o mesmo número base (sem sufixos -AV ou -PZ)
      const numeroBase = venda.numero_venda ? venda.numero_venda.replace(/-AV$|-PZ$/, '') : '';
      
      // Buscar vendas com o mesmo número base
      const vendasRelacionadas = await query(
        'SELECT id, numero_venda, status FROM vendas WHERE tenant_id = ? AND (numero_venda = ? OR numero_venda LIKE ?)',
        [req.user.tenant_id, numeroBase, `${numeroBase}-%`]
      );

      // Remover todas as vendas relacionadas (incluindo a atual)
      for (const vendaRelacionada of vendasRelacionadas) {
        if (vendaRelacionada.id !== parseInt(idNumerico)) {
          console.log(`Removendo venda relacionada: ${vendaRelacionada.numero_venda} (ID: ${vendaRelacionada.id})`);
          
          // Restaurar estoque da venda relacionada
          const itensRelacionados = await query(
            'SELECT produto_id, quantidade FROM venda_itens WHERE venda_id = ?',
            [vendaRelacionada.id]
          );

          for (const item of itensRelacionados) {
            const produtoInfo = await query(
              'SELECT tipo_preco FROM produtos WHERE id = ?',
              [item.produto_id]
            );
            
            if (produtoInfo.length > 0) {
              const produto = produtoInfo[0];
              if (produto.tipo_preco === 'kg') {
                await query(
                  'UPDATE produtos SET estoque_kg = estoque_kg + ? WHERE id = ?',
                  [item.quantidade, item.produto_id]
                );
              } else if (produto.tipo_preco === 'litros') {
                await query(
                  'UPDATE produtos SET estoque_litros = estoque_litros + ? WHERE id = ?',
                  [item.quantidade, item.produto_id]
                );
              } else {
                await query(
                  'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
                  [item.quantidade, item.produto_id]
                );
              }
            }
          }

          // Reverter total_compras do cliente para a venda relacionada
          if (venda.cliente_id) {
            const metodosPagamentoRelacionados = await query(
              'SELECT valor FROM venda_pagamentos WHERE venda_id = ?',
              [vendaRelacionada.id]
            );
            
            let valorPagoAVistaRelacionado = 0;
            if (metodosPagamentoRelacionados.length > 0) {
              valorPagoAVistaRelacionado = metodosPagamentoRelacionados.reduce((sum, metodo) => {
                return sum + (parseFloat(metodo.valor) || 0);
              }, 0);
            } else {
              valorPagoAVistaRelacionado = vendaRelacionada.total || 0;
            }
            
            if (valorPagoAVistaRelacionado > 0) {
              await query(
                'UPDATE clientes SET total_compras = total_compras - ? WHERE id = ?',
                [valorPagoAVistaRelacionado, venda.cliente_id]
              );
            }
          }

          // Deletar todas as transações relacionadas à venda relacionada
          await query('DELETE FROM transacoes WHERE venda_id = ?', [vendaRelacionada.id]);

          // Deletar todas as contas a receber relacionadas à venda relacionada
          await query('DELETE FROM contas_receber WHERE venda_id = ?', [vendaRelacionada.id]);

          // Deletar dados da venda relacionada
          await query('DELETE FROM venda_itens WHERE venda_id = ?', [vendaRelacionada.id]);
          await query('DELETE FROM venda_pagamentos WHERE venda_id = ?', [vendaRelacionada.id]);
          await query('DELETE FROM vendas WHERE id = ? AND tenant_id = ?', [vendaRelacionada.id, req.user.tenant_id]);
        }
      }
    }

    // Deletar todas as transações relacionadas à venda
    await query('DELETE FROM transacoes WHERE venda_id = ?', [idNumerico]);

    // Deletar todas as contas a receber relacionadas à venda
    await query('DELETE FROM contas_receber WHERE venda_id = ?', [idNumerico]);

    // Deletar itens da venda
    await query('DELETE FROM venda_itens WHERE venda_id = ?', [idNumerico]);

    // Deletar métodos de pagamento da venda
    await query('DELETE FROM venda_pagamentos WHERE venda_id = ?', [idNumerico]);

    // Deletar venda (último para manter integridade referencial)
    await query('DELETE FROM vendas WHERE id = ? AND tenant_id = ?', [idNumerico, req.user.tenant_id]);

    res.json({
      message: 'Venda deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar venda:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Estatísticas das vendas
router.get('/stats/overview', async (req, res) => {
  try {
    const { periodo = 'hoje' } = req.query;
    
    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de período
    switch (periodo) {
      case 'hoje':
        whereClause += ' AND DATE(data_venda) = CURDATE()';
        break;
      case 'semana':
        whereClause += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'mes':
        whereClause += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case 'ano':
        whereClause += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
    }

    const stats = await query(
      `SELECT 
        COUNT(*) as total_vendas,
        COUNT(CASE 
          WHEN status = 'pago' OR EXISTS(
            SELECT 1 FROM venda_pagamentos vp 
            WHERE vp.venda_id = v.id
          ) THEN 1 
        END) as vendas_pagas,
        COUNT(CASE 
          WHEN status = 'pendente' AND NOT EXISTS(
            SELECT 1 FROM venda_pagamentos vp 
            WHERE vp.venda_id = v.id
          ) THEN 1 
        END) as vendas_pendentes,
        CAST(COALESCE(
          SUM(CASE 
            WHEN status = 'pago' OR EXISTS(
              SELECT 1 FROM venda_pagamentos vp 
              WHERE vp.venda_id = v.id
            ) THEN 
              COALESCE(
                (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) FROM venda_pagamentos vp WHERE vp.venda_id = v.id), 
                v.total
              )
            ELSE 0 
          END), 0
        ) AS DECIMAL(10,2)) as receita_total,
        CAST(COALESCE(
          AVG(CASE 
            WHEN status = 'pago' OR EXISTS(
              SELECT 1 FROM venda_pagamentos vp 
              WHERE vp.venda_id = v.id
            ) THEN 
              COALESCE(
                (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) FROM venda_pagamentos vp WHERE vp.venda_id = v.id), 
                v.total
              )
            ELSE NULL 
          END), 0
        ) AS DECIMAL(10,2)) as ticket_medio
      FROM vendas v
      ${whereClause}`,
      params
    );

    res.json({
      stats: stats[0],
      periodo
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas das vendas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Função auxiliar para gerar número da venda
async function gerarNumeroVenda(tenantId) {
  const result = await query(
    'SELECT MAX(CAST(SUBSTRING(numero_venda, 2) AS UNSIGNED)) as ultimo_numero FROM vendas WHERE tenant_id = ? AND numero_venda REGEXP "^V[0-9]+$"',
    [tenantId]
  );

  const ultimoNumero = result[0]?.ultimo_numero || 0;
  const proximoNumero = ultimoNumero + 1;
  
  return `V${proximoNumero.toString().padStart(6, '0')}`;
}

export default router;
