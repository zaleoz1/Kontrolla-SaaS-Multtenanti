import express from 'express';
import { query, queryWithResult, transaction } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateTransacao, validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';
import NotificationService from '../services/notificationService.js';
import { uploadImage } from '../services/uploadService.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar transações financeiras
router.get('/transacoes', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 1000, q = '', tipo = '', status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de busca
    if (q) {
      whereClause += ' AND (t.descricao LIKE ? OR t.categoria LIKE ? OR c.nome LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Adicionar filtro de tipo
    if (tipo) {
      whereClause += ' AND t.tipo = ?';
      params.push(tipo);
    }

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClause += ' AND t.data_transacao >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      whereClause += ' AND t.data_transacao <= ?';
      params.push(data_fim);
    }

    // Buscar transações
    const transacoes = await query(
      `SELECT t.*, c.nome as cliente_nome
       FROM transacoes t 
       LEFT JOIN clientes c ON t.cliente_id = c.id 
       ${whereClause} 
       ORDER BY t.data_transacao DESC, t.data_criacao DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM transacoes t ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      transacoes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar transação por ID
router.get('/transacoes/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const transacoes = await query(
      `SELECT t.*, c.nome as cliente_nome
       FROM transacoes t 
       LEFT JOIN clientes c ON t.cliente_id = c.id 
       WHERE t.id = ? AND t.tenant_id = ?`,
      [id, req.user.tenant_id]
    );

    if (transacoes.length === 0) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      });
    }

    res.json({
      transacao: transacoes[0]
    });
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar nova transação
router.post('/transacoes', validateTransacao, async (req, res) => {
  try {
    const {
      tipo,
      categoria,
      descricao,
      valor,
      data_transacao,
      metodo_pagamento,
      conta,
      fornecedor_id,
      cliente_id,
      observacoes,
      anexos = [],
      status = 'pendente'
    } = req.body;

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

    // Verificar se fornecedor existe (se fornecido)
    if (fornecedor_id) {
      const fornecedores = await query(
        'SELECT id FROM fornecedores WHERE id = ? AND tenant_id = ?',
        [fornecedor_id, req.user.tenant_id]
      );

      if (fornecedores.length === 0) {
        return res.status(400).json({
          error: 'Fornecedor não encontrado'
        });
      }
    }

    let result;
    let transacao;

    // Se for uma transação de saída pendente, salvar apenas na tabela contas_pagar
    if (tipo === 'saida' && status === 'pendente') {
      console.log('🔄 Salvando transação de saída pendente apenas em contas_pagar...');
      
      // Buscar nome do fornecedor se fornecedor_id foi fornecido
      let nomeFornecedor = 'Fornecedor não informado';
      if (fornecedor_id) {
        const fornecedores = await query(
          'SELECT nome FROM fornecedores WHERE id = ? AND tenant_id = ?',
          [fornecedor_id, req.user.tenant_id]
        );
        if (fornecedores.length > 0) {
          nomeFornecedor = fornecedores[0].nome;
        }
      }

      // Criar conta a pagar diretamente
      result = await queryWithResult(
        `INSERT INTO contas_pagar (
          tenant_id, fornecedor_id, descricao, valor, data_vencimento, 
          status, categoria, observacoes, anexos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id,
          fornecedor_id || null,
          descricao,
          valor,
          data_transacao, // Usar a data da transação como data de vencimento
          'pendente',
          categoria,
          observacoes || `Conta a pagar criada a partir de transação de saída pendente`,
          JSON.stringify(anexos || [])
        ]
      );

      // Buscar conta a pagar criada para retornar
      const [contaPagar] = await query(
        `SELECT cp.*, f.nome as fornecedor_nome
         FROM contas_pagar cp 
         LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
         WHERE cp.id = ?`,
        [result.insertId]
      );

      transacao = {
        id: result.insertId,
        tipo: 'saida',
        categoria,
        descricao,
        valor,
        data_transacao,
        metodo_pagamento,
        conta,
        fornecedor_id,
        cliente_id: null,
        observacoes,
        anexos: [],
        status: 'pendente',
        data_criacao: contaPagar.data_criacao,
        data_atualizacao: contaPagar.data_atualizacao,
        cliente_nome: null,
        fornecedor_nome: contaPagar.fornecedor_nome,
        // Flag para indicar que foi salva em contas_pagar
        salva_em_contas_pagar: true
      };

      console.log('✅ Conta a pagar criada diretamente:', result.insertId);
    } else if (tipo === 'entrada' && status === 'pendente') {
      // Se for uma transação de entrada pendente, salvar apenas na tabela contas_receber
      console.log('🔄 Salvando transação de entrada pendente apenas em contas_receber...');
      
      // Buscar nome do cliente se cliente_id foi fornecido
      let nomeCliente = 'Cliente não informado';
      if (cliente_id) {
        const clientes = await query(
          'SELECT nome FROM clientes WHERE id = ? AND tenant_id = ?',
          [cliente_id, req.user.tenant_id]
        );
        if (clientes.length > 0) {
          nomeCliente = clientes[0].nome;
        }
      }

      // Criar conta a receber diretamente
      result = await queryWithResult(
        `INSERT INTO contas_receber (
          tenant_id, cliente_id, descricao, valor, data_vencimento, 
          status, observacoes, anexos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id,
          cliente_id || null,
          descricao,
          valor,
          data_transacao, // Usar a data da transação como data de vencimento
          'pendente',
          observacoes || `Conta a receber criada a partir de transação de entrada pendente`,
          JSON.stringify(anexos || [])
        ]
      );

      // Buscar conta a receber criada para retornar
      const [contaReceber] = await query(
        `SELECT cr.*, c.nome as cliente_nome
         FROM contas_receber cr 
         LEFT JOIN clientes c ON cr.cliente_id = c.id
         WHERE cr.id = ?`,
        [result.insertId]
      );

      transacao = {
        id: result.insertId,
        tipo: 'entrada',
        categoria,
        descricao,
        valor,
        data_transacao,
        metodo_pagamento,
        conta,
        fornecedor_id: null,
        cliente_id,
        observacoes,
        anexos: [],
        status: 'pendente',
        data_criacao: contaReceber.data_criacao,
        data_atualizacao: contaReceber.data_atualizacao,
        cliente_nome: contaReceber.cliente_nome,
        fornecedor_nome: null,
        // Flag para indicar que foi salva em contas_receber
        salva_em_contas_receber: true
      };

      console.log('✅ Conta a receber criada diretamente:', result.insertId);
    } else {
      // Para outros tipos de transação, salvar na tabela transacoes normalmente
      result = await queryWithResult(
        `INSERT INTO transacoes (
          tenant_id, tipo, categoria, descricao, valor, data_transacao,
          metodo_pagamento, conta, fornecedor_id, cliente_id, observacoes, anexos, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id, tipo, categoria, descricao, valor, data_transacao,
          metodo_pagamento, conta, fornecedor_id || null, cliente_id || null, observacoes || null,
          JSON.stringify(anexos || []), status
        ]
      );

      // Buscar transação criada
      const [transacaoCriada] = await query(
        `SELECT t.*, c.nome as cliente_nome, f.nome as fornecedor_nome
         FROM transacoes t 
         LEFT JOIN clientes c ON t.cliente_id = c.id 
         LEFT JOIN fornecedores f ON t.fornecedor_id = f.id
         WHERE t.id = ?`,
        [result.insertId]
      );

      transacao = transacaoCriada;
    }

    // Criar notificação da nova transação
    try {
      await NotificationService.notifyNewTransaction(req.user.tenant_id, tipo, parseFloat(valor), descricao);
    } catch (notificationError) {
      console.error('Erro ao criar notificação da transação:', notificationError);
      // Não falhar a transação por causa da notificação
    }

    res.status(201).json({
      message: 'Transação criada com sucesso',
      transacao
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar transação
router.put('/transacoes/:id', validateId, validateTransacao, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      categoria,
      descricao,
      valor,
      data_transacao,
      metodo_pagamento,
      conta,
      fornecedor_id,
      cliente_id,
      observacoes,
      anexos,
      status
    } = req.body;

    // Verificar se transação existe (pode estar em transacoes, contas_pagar ou contas_receber)
    const existingTransacoes = await query(
      'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    const existingContasPagar = await query(
      'SELECT id FROM contas_pagar WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    const existingContasReceber = await query(
      'SELECT id FROM contas_receber WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    const isInContasPagar = existingContasPagar.length > 0;
    const isInContasReceber = existingContasReceber.length > 0;
    const isInTransacoes = existingTransacoes.length > 0;

    if (!isInTransacoes && !isInContasPagar && !isInContasReceber) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      });
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

    // Verificar se fornecedor existe (se fornecido)
    if (fornecedor_id) {
      const fornecedores = await query(
        'SELECT id FROM fornecedores WHERE id = ? AND tenant_id = ?',
        [fornecedor_id, req.user.tenant_id]
      );

      if (fornecedores.length === 0) {
        return res.status(400).json({
          error: 'Fornecedor não encontrado'
        });
      }
    }

    let transacao;

    if (isInContasPagar) {
      // Se a transação está em contas_pagar, atualizar lá
      console.log('🔄 Atualizando transação em contas_pagar...');
      
      await query(
        `UPDATE contas_pagar SET 
          fornecedor_id = ?, descricao = ?, valor = ?, data_vencimento = ?,
          status = ?, categoria = ?, observacoes = ?
        WHERE id = ? AND tenant_id = ?`,
        [
          fornecedor_id, descricao, valor, data_transacao,
          status === 'pendente' ? 'pendente' : status === 'concluida' ? 'pago' : 'cancelado',
          categoria, observacoes, id, req.user.tenant_id
        ]
      );

      // Buscar conta a pagar atualizada
      const [contaPagar] = await query(
        `SELECT cp.*, f.nome as fornecedor_nome
         FROM contas_pagar cp 
         LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
         WHERE cp.id = ?`,
        [id]
      );

      transacao = {
        id: contaPagar.id,
        tipo: 'saida',
        categoria: contaPagar.categoria,
        descricao: contaPagar.descricao,
        valor: contaPagar.valor,
        data_transacao: contaPagar.data_vencimento,
        metodo_pagamento: 'pix', // Default para contas a pagar
        conta: 'caixa', // Default para contas a pagar
        fornecedor_id: contaPagar.fornecedor_id,
        cliente_id: null,
        observacoes: contaPagar.observacoes,
        anexos: [],
        status: contaPagar.status === 'pago' ? 'concluida' : contaPagar.status === 'cancelado' ? 'cancelada' : 'pendente',
        data_criacao: contaPagar.data_criacao,
        data_atualizacao: contaPagar.data_atualizacao,
        cliente_nome: null,
        fornecedor_nome: contaPagar.fornecedor_nome,
        salva_em_contas_pagar: true
      };
    } else if (isInContasReceber) {
      // Se a transação está em contas_receber, atualizar lá
      console.log('🔄 Atualizando transação em contas_receber...');
      
      await query(
        `UPDATE contas_receber SET 
          cliente_id = ?, descricao = ?, valor = ?, data_vencimento = ?,
          status = ?, observacoes = ?
        WHERE id = ? AND tenant_id = ?`,
        [
          cliente_id, descricao, valor, data_transacao,
          status === 'pendente' ? 'pendente' : status === 'concluida' ? 'pago' : 'cancelado',
          observacoes, id, req.user.tenant_id
        ]
      );

      // Buscar conta a receber atualizada
      const [contaReceber] = await query(
        `SELECT cr.*, c.nome as cliente_nome
         FROM contas_receber cr 
         LEFT JOIN clientes c ON cr.cliente_id = c.id
         WHERE cr.id = ?`,
        [id]
      );

      transacao = {
        id: contaReceber.id,
        tipo: 'entrada',
        categoria: categoria,
        descricao: contaReceber.descricao,
        valor: contaReceber.valor,
        data_transacao: contaReceber.data_vencimento,
        metodo_pagamento: 'pix', // Default para contas a receber
        conta: 'caixa', // Default para contas a receber
        fornecedor_id: null,
        cliente_id: contaReceber.cliente_id,
        observacoes: contaReceber.observacoes,
        anexos: [],
        status: contaReceber.status === 'pago' ? 'concluida' : contaReceber.status === 'cancelado' ? 'cancelada' : 'pendente',
        data_criacao: contaReceber.data_criacao,
        data_atualizacao: contaReceber.data_atualizacao,
        cliente_nome: contaReceber.cliente_nome,
        fornecedor_nome: null,
        salva_em_contas_receber: true
      };
    } else {
      // Se a transação está em transacoes, atualizar lá
      await query(
        `UPDATE transacoes SET 
          tipo = ?, categoria = ?, descricao = ?, valor = ?, data_transacao = ?,
          metodo_pagamento = ?, conta = ?, fornecedor_id = ?, cliente_id = ?,
          observacoes = ?, anexos = ?, status = ?
        WHERE id = ? AND tenant_id = ?`,
        [
          tipo, categoria, descricao, valor, data_transacao, metodo_pagamento,
          conta, fornecedor_id, cliente_id, observacoes, JSON.stringify(anexos),
          status, id, req.user.tenant_id
        ]
      );

      // Buscar transação atualizada
      const [transacaoAtualizada] = await query(
        `SELECT t.*, c.nome as cliente_nome, f.nome as fornecedor_nome
         FROM transacoes t 
         LEFT JOIN clientes c ON t.cliente_id = c.id 
         LEFT JOIN fornecedores f ON t.fornecedor_id = f.id
         WHERE t.id = ?`,
        [id]
      );

      transacao = transacaoAtualizada;
    }

    res.json({
      message: 'Transação atualizada com sucesso',
      transacao
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar transação
router.delete('/transacoes/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se transação existe
    const existingTransacoes = await query(
      'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingTransacoes.length === 0) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      });
    }

    await query(
      'DELETE FROM transacoes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    res.json({
      message: 'Transação deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Listar contas a receber
router.get('/contas-receber', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 1000, status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    // Construir query para buscar APENAS contas a receber da tabela contas_receber
    let whereClause = 'WHERE cr.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND cr.status = ?';
      params.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClause += ' AND cr.data_vencimento >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      whereClause += ' AND cr.data_vencimento <= ?';
      params.push(data_fim);
    }

    // Construir query para buscar contas a receber tradicionais
    let whereClauseContas = 'WHERE cr.tenant_id = ?';
    let paramsContas = [req.user.tenant_id];

    // Adicionar filtro de status
    if (status) {
      whereClauseContas += ' AND cr.status = ?';
      paramsContas.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClauseContas += ' AND cr.data_vencimento >= ?';
      paramsContas.push(data_inicio);
    }

    if (data_fim) {
      whereClauseContas += ' AND cr.data_vencimento <= ?';
      paramsContas.push(data_fim);
    }

    // Construir query para buscar transações pendentes do tipo entrada
    let whereClauseTransacoes = 'WHERE t.tenant_id = ? AND t.tipo = ? AND t.status = ?';
    let paramsTransacoes = [req.user.tenant_id, 'entrada', 'pendente'];

    // Adicionar filtro de data para transações
    if (data_inicio) {
      whereClauseTransacoes += ' AND t.data_transacao >= ?';
      paramsTransacoes.push(data_inicio);
    }

    if (data_fim) {
      whereClauseTransacoes += ' AND t.data_transacao <= ?';
      paramsTransacoes.push(data_fim);
    }

    // Buscar contas a receber tradicionais
    const contasReceber = await query(
      `SELECT 
        cr.id,
        cr.cliente_id,
        cr.venda_id,
        cr.descricao,
        cr.valor,
        cr.data_vencimento,
        cr.data_pagamento,
        cr.status,
        cr.parcela,
        cr.observacoes,
        cr.dias,
        cr.juros,
        cr.valor_original,
        cr.valor_com_juros,
        cr.data_criacao,
        cr.data_atualizacao,
        cr.anexos,
        c.nome as cliente_nome,
        c.email as cliente_email,
        'conta_receber' as tipo_origem
       FROM contas_receber cr 
       LEFT JOIN clientes c ON cr.cliente_id = c.id 
       ${whereClauseContas} 
       ORDER BY cr.data_vencimento ASC`,
      paramsContas
    );

    // Buscar transações pendentes do tipo entrada
    const transacoesPendentes = await query(
      `SELECT 
        t.id,
        t.cliente_id,
        NULL as venda_id,
        t.descricao,
        t.valor,
        t.data_transacao as data_vencimento,
        NULL as data_pagamento,
        t.status,
        '1/1' as parcela,
        t.observacoes,
        NULL as dias,
        NULL as juros,
        NULL as valor_original,
        NULL as valor_com_juros,
        t.data_criacao,
        t.data_atualizacao,
        c.nome as cliente_nome,
        c.email as cliente_email,
        'transacao_entrada' as tipo_origem
       FROM transacoes t 
       LEFT JOIN clientes c ON t.cliente_id = c.id
       ${whereClauseTransacoes} 
       ORDER BY t.data_transacao ASC`,
      paramsTransacoes
    );

    // Combinar os resultados
    const contas = [...contasReceber, ...transacoesPendentes];

    // Aplicar paginação no resultado combinado
    const total = contas.length;
    const totalPages = Math.ceil(total / limit);
    const contasPaginadas = contas.slice(offset, offset + Number(limit));

    res.json({
      contas: contasPaginadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar contas a receber:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Listar contas a pagar
router.get('/contas-pagar', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 1000, status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    // Construir query para buscar contas a pagar tradicionais
    let whereClauseContas = 'WHERE cp.tenant_id = ?';
    let paramsContas = [req.user.tenant_id];

    // Adicionar filtro de status
    if (status) {
      whereClauseContas += ' AND cp.status = ?';
      paramsContas.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClauseContas += ' AND cp.data_vencimento >= ?';
      paramsContas.push(data_inicio);
    }

    if (data_fim) {
      whereClauseContas += ' AND cp.data_vencimento <= ?';
      paramsContas.push(data_fim);
    }

    // Construir query para buscar transações pendentes do tipo saída
    let whereClauseTransacoes = 'WHERE t.tenant_id = ? AND t.tipo = ? AND t.status = ?';
    let paramsTransacoes = [req.user.tenant_id, 'saida', 'pendente'];

    // Adicionar filtro de data para transações
    if (data_inicio) {
      whereClauseTransacoes += ' AND t.data_transacao >= ?';
      paramsTransacoes.push(data_inicio);
    }

    if (data_fim) {
      whereClauseTransacoes += ' AND t.data_transacao <= ?';
      paramsTransacoes.push(data_fim);
    }

    // Buscar contas a pagar tradicionais (fornecedores e funcionários)
    const contasPagar = await query(
      `SELECT 
        cp.id,
        COALESCE(
          CONCAT(f.nome, ' ', f.sobrenome), 
          forn.nome, 
          'Fornecedor não informado'
        ) as fornecedor,
        cp.descricao,
        cp.valor,
        cp.data_vencimento,
        cp.data_pagamento,
        cp.status,
        cp.categoria,
        cp.observacoes,
        cp.data_criacao,
        cp.data_atualizacao,
        'conta_pagar' as tipo_origem,
        CASE 
          WHEN cp.funcionario_id IS NOT NULL THEN 'funcionario'
          WHEN cp.fornecedor_id IS NOT NULL THEN 'fornecedor'
          ELSE 'outro'
        END as tipo_conta,
        cp.funcionario_id,
        cp.fornecedor_id
       FROM contas_pagar cp 
       LEFT JOIN funcionarios f ON cp.funcionario_id = f.id
       LEFT JOIN fornecedores forn ON cp.fornecedor_id = forn.id
       ${whereClauseContas} 
       ORDER BY cp.data_vencimento ASC`,
      paramsContas
    );

    console.log('📊 Contas a pagar encontradas:', contasPagar.length);
    console.log('📊 Contas de funcionários:', contasPagar.filter(cp => cp.tipo_conta === 'funcionario').length);

    // Buscar transações pendentes do tipo saída
    const transacoesPendentes = await query(
      `SELECT 
        t.id,
        COALESCE(f.nome, 'Fornecedor não informado') as fornecedor,
        t.descricao,
        t.valor,
        t.data_transacao as data_vencimento,
        NULL as data_pagamento,
        t.status,
        t.categoria,
        t.observacoes,
        t.data_criacao,
        t.data_atualizacao,
        'transacao' as tipo_origem
       FROM transacoes t 
       LEFT JOIN fornecedores f ON t.fornecedor_id = f.id
       ${whereClauseTransacoes} 
       ORDER BY t.data_transacao ASC`,
      paramsTransacoes
    );

    // Combinar os resultados
    const contas = [...contasPagar, ...transacoesPendentes];

    // Aplicar paginação no resultado combinado
    const total = contas.length;
    const totalPages = Math.ceil(total / limit);
    const contasPaginadas = contas.slice(offset, offset + Number(limit));

    res.json({
      contas: contasPaginadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar contas a pagar:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar conta a receber
router.post('/contas-receber', async (req, res) => {
  try {
    const {
      cliente_id,
      venda_id,
      descricao,
      valor,
      data_vencimento,
      parcela,
      observacoes
    } = req.body;

    const result = await queryWithResult(
      `INSERT INTO contas_receber (
        tenant_id, cliente_id, venda_id, descricao, valor, data_vencimento, parcela, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, cliente_id, venda_id, descricao, valor, data_vencimento, parcela, observacoes
      ]
    );

    // Buscar conta criada
    const [conta] = await query(
      `SELECT cr.*, c.nome as cliente_nome, c.email as cliente_email
       FROM contas_receber cr 
       LEFT JOIN clientes c ON cr.cliente_id = c.id 
       WHERE cr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Conta a receber criada com sucesso',
      conta
    });
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar conta a receber
router.put('/contas-receber/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente_id,
      venda_id,
      descricao,
      valor,
      data_vencimento,
      data_pagamento,
      status,
      parcela,
      observacoes,
      tipo_origem
    } = req.body;

    // Verificar se é uma conta a receber tradicional, uma venda ou uma transação de entrada
    if (tipo_origem === 'venda') {
      // Atualizar venda
      const existingVendas = await query(
        'SELECT id FROM vendas WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingVendas.length === 0) {
        return res.status(404).json({
          error: 'Venda não encontrada'
        });
      }

      await query(
        `UPDATE vendas SET 
          status = ?, observacoes = ?
        WHERE id = ? AND tenant_id = ?`,
        [status, observacoes, id, req.user.tenant_id]
      );

      // Buscar venda atualizada
      const [conta] = await query(
        `SELECT 
          v.id,
          v.cliente_id,
          v.id as venda_id,
          CONCAT('Venda #', v.numero_venda) as descricao,
          v.total as valor,
          DATE(v.data_venda) as data_vencimento,
          NULL as data_pagamento,
          CASE 
            WHEN v.status = 'pendente' AND DATE(v.data_venda) < CURDATE() THEN 'vencido'
            ELSE v.status
          END as status,
          CONCAT('1/', v.parcelas) as parcela,
          v.observacoes,
          v.data_criacao,
          v.data_atualizacao,
          c.nome as cliente_nome,
          c.email as cliente_email,
          'venda' as tipo_origem
         FROM vendas v 
         LEFT JOIN clientes c ON v.cliente_id = c.id 
         WHERE v.id = ?`,
        [id]
      );

      res.json({
        message: 'Venda atualizada com sucesso',
        conta
      });
    } else if (tipo_origem === 'transacao_entrada') {
      // Atualizar transação de entrada
      const existingTransacoes = await query(
        'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingTransacoes.length === 0) {
        return res.status(404).json({
          error: 'Transação não encontrada'
        });
      }

      await query(
        `UPDATE transacoes SET 
          status = ?, observacoes = ?
        WHERE id = ? AND tenant_id = ?`,
        [status, observacoes, id, req.user.tenant_id]
      );

      // Buscar transação atualizada
      const [conta] = await query(
        `SELECT 
          t.id,
          t.cliente_id,
          NULL as venda_id,
          t.descricao,
          t.valor,
          t.data_transacao as data_vencimento,
          NULL as data_pagamento,
          CASE 
            WHEN t.status = 'pendente' AND t.data_transacao < CURDATE() THEN 'vencido'
            ELSE t.status
          END as status,
          '1/1' as parcela,
          t.observacoes,
          t.data_criacao,
          t.data_atualizacao,
          c.nome as cliente_nome,
          c.email as cliente_email,
          'transacao_entrada' as tipo_origem
         FROM transacoes t 
         LEFT JOIN clientes c ON t.cliente_id = c.id 
         WHERE t.id = ?`,
        [id]
      );

      res.json({
        message: 'Transação atualizada com sucesso',
        conta
      });
    } else {
      // Atualizar conta a receber tradicional
      const existingContas = await query(
        'SELECT id FROM contas_receber WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingContas.length === 0) {
        return res.status(404).json({
          error: 'Conta a receber não encontrada'
        });
      }

      // Construir query dinamicamente apenas com campos fornecidos
      const updateFields = [];
      const updateValues = [];
      
      if (cliente_id !== undefined) {
        updateFields.push('cliente_id = ?');
        updateValues.push(cliente_id);
      }
      if (venda_id !== undefined) {
        updateFields.push('venda_id = ?');
        updateValues.push(venda_id);
      }
      if (descricao !== undefined) {
        updateFields.push('descricao = ?');
        updateValues.push(descricao);
      }
      if (valor !== undefined) {
        updateFields.push('valor = ?');
        updateValues.push(valor);
      }
      if (data_vencimento !== undefined) {
        updateFields.push('data_vencimento = ?');
        updateValues.push(data_vencimento);
      }
      if (data_pagamento !== undefined) {
        updateFields.push('data_pagamento = ?');
        updateValues.push(data_pagamento);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
      if (parcela !== undefined) {
        updateFields.push('parcela = ?');
        updateValues.push(parcela);
      }
      if (observacoes !== undefined) {
        updateFields.push('observacoes = ?');
        updateValues.push(observacoes);
      }
      
      if (updateFields.length > 0) {
        updateValues.push(id, req.user.tenant_id);
        await query(
          `UPDATE contas_receber SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
          updateValues
        );
      }

      // Buscar conta atualizada
      const [conta] = await query(
        `SELECT cr.*, c.nome as cliente_nome, c.email as cliente_email
         FROM contas_receber cr 
         LEFT JOIN clientes c ON cr.cliente_id = c.id 
         WHERE cr.id = ?`,
        [id]
      );

      res.json({
        message: 'Conta a receber atualizada com sucesso',
        conta
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar conta a receber
router.delete('/contas-receber/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_origem } = req.body;

    // Verificar se é uma conta a receber tradicional, uma venda ou uma transação de entrada
    if (tipo_origem === 'venda') {
      // Deletar venda
      const existingVendas = await query(
        'SELECT id FROM vendas WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingVendas.length === 0) {
        return res.status(404).json({
          error: 'Venda não encontrada'
        });
      }

      await query(
        'DELETE FROM vendas WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      res.json({
        message: 'Venda deletada com sucesso'
      });
    } else if (tipo_origem === 'transacao_entrada') {
      // Deletar transação de entrada
      const existingTransacoes = await query(
        'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingTransacoes.length === 0) {
        return res.status(404).json({
          error: 'Transação não encontrada'
        });
      }

      await query(
        'DELETE FROM transacoes WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      res.json({
        message: 'Transação deletada com sucesso'
      });
    } else {
      // Deletar conta a receber tradicional
      const existingContas = await query(
        'SELECT id FROM contas_receber WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingContas.length === 0) {
        return res.status(404).json({
          error: 'Conta a receber não encontrada'
        });
      }

      await query(
        'DELETE FROM contas_receber WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      res.json({
        message: 'Conta a receber deletada com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao deletar conta a receber:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar conta a pagar
router.post('/contas-pagar', async (req, res) => {
  try {
    const {
      fornecedor,
      descricao,
      valor,
      data_vencimento,
      categoria,
      observacoes
    } = req.body;

    const result = await queryWithResult(
      `INSERT INTO contas_pagar (
        tenant_id, fornecedor, descricao, valor, data_vencimento, categoria, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, fornecedor, descricao, valor, data_vencimento, categoria, observacoes
      ]
    );

    // Buscar conta criada
    const [conta] = await query(
      'SELECT * FROM contas_pagar WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Conta a pagar criada com sucesso',
      conta
    });
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar conta a pagar
router.put('/contas-pagar/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fornecedor,
      descricao,
      valor,
      data_vencimento,
      data_pagamento,
      status,
      categoria,
      observacoes,
      tipo_origem
    } = req.body;

    // Verificar se é uma conta a pagar tradicional ou uma transação
    if (tipo_origem === 'transacao') {
      // Atualizar transação
      const existingTransacoes = await query(
        'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingTransacoes.length === 0) {
        return res.status(404).json({
          error: 'Transação não encontrada'
        });
      }

      await query(
        `UPDATE transacoes SET 
          descricao = ?, valor = ?, data_transacao = ?,
          status = ?, observacoes = ?
        WHERE id = ? AND tenant_id = ?`,
        [
          descricao, valor, data_vencimento, status, observacoes, id, req.user.tenant_id
        ]
      );

      // Buscar transação atualizada
      const [conta] = await query(
        `SELECT 
          t.id,
          COALESCE(t.fornecedor, 'Fornecedor não informado') as fornecedor,
          t.descricao,
          t.valor,
          t.data_transacao as data_vencimento,
          NULL as data_pagamento,
          t.status,
          t.categoria,
          t.observacoes,
          t.data_criacao,
          t.data_atualizacao,
          'transacao' as tipo_origem
         FROM transacoes t 
         WHERE t.id = ?`,
        [id]
      );

      res.json({
        message: 'Transação atualizada com sucesso',
        conta
      });
    } else {
      // Atualizar conta a pagar tradicional
      const existingContas = await query(
        'SELECT id FROM contas_pagar WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingContas.length === 0) {
        return res.status(404).json({
          error: 'Conta a pagar não encontrada'
        });
      }

      // Para adiantamentos, apenas atualizar valor e observações
      await query(
        `UPDATE contas_pagar SET 
          valor = ?, observacoes = ?
        WHERE id = ? AND tenant_id = ?`,
        [
          valor || null, observacoes || null, 
          id, req.user.tenant_id
        ]
      );

      // Buscar conta atualizada
      const [conta] = await query(
        'SELECT * FROM contas_pagar WHERE id = ?',
        [id]
      );

      res.json({
        message: 'Conta a pagar atualizada com sucesso',
        conta
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar conta a pagar
router.delete('/contas-pagar/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_origem } = req.body;

    // Verificar se é uma conta a pagar tradicional ou uma transação
    if (tipo_origem === 'transacao') {
      // Deletar transação
      const existingTransacoes = await query(
        'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingTransacoes.length === 0) {
        return res.status(404).json({
          error: 'Transação não encontrada'
        });
      }

      await query(
        'DELETE FROM transacoes WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      res.json({
        message: 'Transação deletada com sucesso'
      });
    } else {
      // Deletar conta a pagar tradicional
      const existingContas = await query(
        'SELECT id FROM contas_pagar WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      if (existingContas.length === 0) {
        return res.status(404).json({
          error: 'Conta a pagar não encontrada'
        });
      }

      await query(
        'DELETE FROM contas_pagar WHERE id = ? AND tenant_id = ?',
        [id, req.user.tenant_id]
      );

      res.json({
        message: 'Conta a pagar deletada com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao deletar conta a pagar:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Meses que possuem dados financeiros (transações, contas, vendas)
const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
router.get('/meses-com-dados', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const meses = await query(
      `(SELECT DISTINCT YEAR(data_transacao) as ano, MONTH(data_transacao) as mes FROM transacoes WHERE tenant_id = ?)
       UNION
       (SELECT DISTINCT YEAR(data_vencimento) as ano, MONTH(data_vencimento) as mes FROM contas_receber WHERE tenant_id = ?)
       UNION
       (SELECT DISTINCT YEAR(data_vencimento) as ano, MONTH(data_vencimento) as mes FROM contas_pagar WHERE tenant_id = ?)
       UNION
       (SELECT DISTINCT YEAR(data_venda) as ano, MONTH(data_venda) as mes FROM vendas WHERE tenant_id = ?)
       ORDER BY ano DESC, mes DESC
       LIMIT 24`,
      [tenantId, tenantId, tenantId, tenantId]
    );
    const resultado = meses.map(({ ano, mes }) => {
      const value = `${ano}-${String(mes).padStart(2, '0')}`;
      const label = `${MESES_NOMES[Number(mes) - 1]} ${ano}`;
      return { ano: Number(ano), mes: Number(mes), value, label };
    });
    res.json({ meses: resultado });
  } catch (error) {
    console.error('Erro ao buscar meses com dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas financeiras
router.get('/stats/overview', async (req, res) => {
  try {
    const { periodo = 'mes', data_inicio: dataInicio, data_fim: dataFim } = req.query;
    const usoDataRange = dataInicio && dataFim;

    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.user.tenant_id];

    if (usoDataRange) {
      whereClause += ' AND data_transacao >= ? AND data_transacao <= ?';
      params.push(dataInicio, dataFim);
    } else {
      // Adicionar filtro de período
      switch (periodo) {
        case 'hoje':
          whereClause += ' AND DATE(data_transacao) = CURDATE()';
          break;
        case 'semana':
          whereClause += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case 'mes':
          whereClause += " AND data_transacao >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
          break;
        case 'ano':
          whereClause += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          break;
      }
    }

    // Estatísticas de transações
    const transacoesStats = await query(
      `SELECT 
        COUNT(*) as total_transacoes,
        COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as entradas,
        COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as saidas,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' AND status = 'concluida' THEN valor ELSE 0 END), 0) as total_entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' AND status = 'concluida' THEN valor ELSE 0 END), 0) as total_saidas
      FROM transacoes 
      ${whereClause}`,
      params
    );

    // Calcular vendas pagas (soma dos pagamentos efetivos das vendas)
    let vendasWhereClause = 'WHERE v.tenant_id = ?';
    let vendasParams = [req.user.tenant_id];

    // Aplicar filtro de período para vendas
    if (usoDataRange) {
      vendasWhereClause += ' AND v.data_venda >= ? AND v.data_venda <= ?';
      vendasParams.push(dataInicio, dataFim);
    } else {
      switch (periodo) {
        case 'hoje':
          vendasWhereClause += ' AND DATE(v.data_venda) = CURDATE()';
          break;
        case 'semana':
          vendasWhereClause += ' AND v.data_venda >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case 'mes':
          vendasWhereClause += " AND v.data_venda >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
          break;
        case 'ano':
          vendasWhereClause += ' AND v.data_venda >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          break;
      }
    }

    const vendasPagas = await query(
      `SELECT 
        COALESCE(SUM(vp.valor - COALESCE(vp.troco, 0)), 0) as total_vendas_pagas
      FROM vendas v
      LEFT JOIN venda_pagamentos vp ON v.id = vp.venda_id
      ${vendasWhereClause}`,
      vendasParams
    );

    // Construir filtro de período para contas (por data_vencimento)
    let contasWhereReceber = 'WHERE tenant_id = ?';
    let contasParamsReceber = [req.user.tenant_id];
    let contasWherePagar = 'WHERE tenant_id = ?';
    let contasParamsPagar = [req.user.tenant_id];
    let contasWherePagarTrans = 'WHERE tenant_id = ? AND tipo = ? AND status = ?';
    let contasParamsPagarTrans = [req.user.tenant_id, 'saida', 'pendente'];
    let adiantamentoWhere = 'WHERE t.tenant_id = ?';
    let adiantamentoParams = [req.user.tenant_id];

    if (usoDataRange) {
      contasWhereReceber += ' AND data_vencimento >= ? AND data_vencimento <= ?';
      contasParamsReceber.push(dataInicio, dataFim);
      contasWherePagar += ' AND data_vencimento >= ? AND data_vencimento <= ?';
      contasParamsPagar.push(dataInicio, dataFim);
      contasWherePagarTrans += ' AND data_transacao >= ? AND data_transacao <= ?';
      contasParamsPagarTrans.push(dataInicio, dataFim);
      adiantamentoWhere += ' AND t.data_transacao >= ? AND t.data_transacao <= ?';
      adiantamentoParams.push(dataInicio, dataFim);
    } else {
      switch (periodo) {
        case 'hoje':
          contasWhereReceber += ' AND DATE(data_vencimento) = CURDATE()';
          contasWherePagar += ' AND DATE(data_vencimento) = CURDATE()';
          contasWherePagarTrans += ' AND DATE(data_transacao) = CURDATE()';
          adiantamentoWhere += ' AND DATE(t.data_transacao) = CURDATE()';
          break;
        case 'semana':
          contasWhereReceber += ' AND data_vencimento >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          contasWherePagar += ' AND data_vencimento >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          contasWherePagarTrans += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          adiantamentoWhere += ' AND t.data_transacao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case 'mes': {
          const inicioMes = "DATE_FORMAT(CURDATE(), '%Y-%m-01')";
          contasWhereReceber += ` AND data_vencimento >= ${inicioMes}`;
          contasWherePagar += ` AND data_vencimento >= ${inicioMes}`;
          contasWherePagarTrans += ` AND data_transacao >= ${inicioMes}`;
          adiantamentoWhere += ` AND t.data_transacao >= ${inicioMes}`;
          break;
        }
        case 'ano':
          contasWhereReceber += ' AND data_vencimento >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          contasWherePagar += ' AND data_vencimento >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          contasWherePagarTrans += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          adiantamentoWhere += ' AND t.data_transacao >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          break;
      }
    }

    // Contas a receber (APENAS da tabela contas_receber)
    const contasReceber = await query(
      `SELECT 
        COUNT(*) as total_contas,
        COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) as valor_pendente,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0) as valor_vencido,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) as valor_pago
      FROM contas_receber 
      ${contasWhereReceber}`,
      contasParamsReceber
    );

    // Contas a pagar (incluindo transações pendentes do tipo saída)
    const contasPagar = await query(
      `SELECT 
        COUNT(*) as total_contas,
        COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) as valor_pendente,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0) as valor_vencido,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) as valor_pago
      FROM (
        SELECT status, valor FROM contas_pagar ${contasWherePagar}
        UNION ALL
        SELECT status, valor FROM transacoes ${contasWherePagarTrans}
      ) as contas_combineadas`,
      [...contasParamsPagar, ...contasParamsPagarTrans]
    );

    // Calcular valor pago incluindo adiantamentos (transações de saída concluídas relacionadas a contas a pagar)
    const adiantamentosPagos = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN t.tipo = 'saida' AND t.status = 'concluida' AND t.categoria = 'Adiantamento' THEN t.valor ELSE 0 END), 0) as valor_adiantamentos
      FROM transacoes t
      ${adiantamentoWhere}`,
      adiantamentoParams
    );

    // Somar valor pago das contas + adiantamentos
    const valorPagoTotal = Number(contasPagar[0].valor_pago) + Number(adiantamentosPagos[0].valor_adiantamentos);

    // Calcular todas as transações de saída (independente do período) para o saldo atual
    const todasSaidas = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'saida' AND status = 'concluida' THEN valor ELSE 0 END), 0) as total_saidas_geral
      FROM transacoes 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    // Calcular todas as transações de entrada (independente do período) para o saldo atual
    const todasEntradas = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'entrada' AND status = 'concluida' THEN valor ELSE 0 END), 0) as total_entradas_geral
      FROM transacoes 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    // Calcular saldo atual: apenas transações de entrada - transações de saída (TODAS, não apenas do período)
    const totalEntradasTransacoes = Number(todasEntradas[0].total_entradas_geral) || 0;
    const totalSaidasTransacoes = Number(todasSaidas[0].total_saidas_geral) || 0;
    
    const saldoAtual = totalEntradasTransacoes - totalSaidasTransacoes;
    // Fluxo de caixa: apenas transações de entrada - transações de saída (do período)
    const fluxoCaixa = Number(transacoesStats[0].total_entradas) - Number(transacoesStats[0].total_saidas);

    res.json({
      stats: {
        ...transacoesStats[0],
        total_vendas_pagas: 0, // Removido: vendas agora são transações
        fluxo_caixa: fluxoCaixa,
        saldo_atual: saldoAtual,
        contas_receber: contasReceber[0],
        contas_pagar: {
          ...contasPagar[0],
          valor_pago: valorPagoTotal
        }
      },
      periodo
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas financeiras:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Processar pagamento de conta a pagar
router.post('/contas-pagar/:id/pagar', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dataPagamento,
      metodoPagamento,
      observacoes,
      comprovante,
      numeroDocumento,
      bancoOrigem,
      agenciaOrigem,
      contaOrigem,
      parcelas = 1,
      taxaParcela = 0,
      anexos = []
    } = req.body;

    // Buscar conta a pagar
    const contas = await query(
      `SELECT cp.*, f.nome as fornecedor_nome, func.nome as funcionario_nome
       FROM contas_pagar cp
       LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
       LEFT JOIN funcionarios func ON cp.funcionario_id = func.id
       WHERE cp.id = ? AND cp.tenant_id = ?`,
      [id, req.user.tenant_id]
    );

    if (contas.length === 0) {
      return res.status(404).json({
        error: 'Conta a pagar não encontrada'
      });
    }

    const conta = contas[0];

    // Executar todas as operações em uma transação
    const result = await transaction(async (connection) => {
      // Atualizar conta a pagar como paga
      await connection.execute(
        `UPDATE contas_pagar SET 
         status = 'pago', 
         data_pagamento = ?,
         observacoes = CONCAT(COALESCE(observacoes, ''), ' | Pago em ', ?, ' via ', ?)
         WHERE id = ? AND tenant_id = ?`,
        [dataPagamento, dataPagamento, metodoPagamento, id, req.user.tenant_id]
      );

      // Criar transação de saída para o valor pago
      const transacaoId = await connection.execute(
        `INSERT INTO transacoes (
          tenant_id, tipo, categoria, descricao, valor, data_transacao,
          metodo_pagamento, conta, fornecedor_id, cliente_id, observacoes, anexos, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id,
          'saida',
          conta.categoria || 'pagamento',
          `Pagamento - ${conta.descricao}`,
          conta.valor,
          dataPagamento,
          metodoPagamento,
          'caixa',
          conta.fornecedor_id,
          null,
          observacoes || `Pagamento de conta a pagar #${id}`,
          JSON.stringify(anexos || []),
          'concluida'
        ]
      );

      return {
        contaId: id,
        transacaoId: transacaoId.insertId,
        valorPago: conta.valor
      };
    });

    res.json({
      message: 'Pagamento processado com sucesso',
      ...result
    });

  } catch (error) {
    console.error('Erro ao processar pagamento de conta a pagar:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Processar pagamento parcial de conta a receber
router.post('/contas-receber/:id/pagar', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      valorRecebido,
      dataPagamento,
      metodoPagamento,
      observacoes,
      comprovante,
      anexos = []
    } = req.body;

    // Buscar conta a receber
    const contas = await query(
      `SELECT cr.*, v.id as venda_id, v.total as venda_total, v.numero_venda
       FROM contas_receber cr
       LEFT JOIN vendas v ON cr.venda_id = v.id
       WHERE cr.id = ? AND cr.tenant_id = ?`,
      [id, req.user.tenant_id]
    );

    if (contas.length === 0) {
      return res.status(404).json({
        error: 'Conta a receber não encontrada'
      });
    }

    const conta = contas[0];
    const valorOriginal = parseFloat(conta.valor_com_juros || conta.valor);
    const valorRecebidoNum = parseFloat(valorRecebido);

    if (valorRecebidoNum <= 0) {
      return res.status(400).json({
        error: 'Valor recebido deve ser maior que zero'
      });
    }

    if (valorRecebidoNum > valorOriginal) {
      return res.status(400).json({
        error: 'Valor recebido não pode ser maior que o valor da conta'
      });
    }

    // Calcular valor restante
    const valorRestante = valorOriginal - valorRecebidoNum;

    // Executar todas as operações em uma transação
    const result = await transaction(async (connection) => {
      // Atualizar conta a receber
      if (valorRestante <= 0) {
        // Pagamento completo - deletar conta a receber e atualizar status da venda
        await connection.execute(
          `DELETE FROM contas_receber WHERE id = ? AND tenant_id = ?`,
          [id, req.user.tenant_id]
        );
        
        // Se a conta está vinculada a uma venda, atualizar status para pago
        if (conta.venda_id) {
          await connection.execute(
            `UPDATE vendas SET status = 'pago' WHERE id = ? AND tenant_id = ?`,
            [conta.venda_id, req.user.tenant_id]
          );
        }
      } else {
        // Pagamento parcial - atualizar valor e valor_com_juros da contag
        await connection.execute(
          `UPDATE contas_receber SET 
           valor = ?,
           valor_com_juros = ?,
           observacoes = CONCAT(COALESCE(observacoes, ''), ' | Pagamento parcial de ', ?, ' em ', ?)
           WHERE id = ?`,
          [valorRestante, valorRestante, valorRecebidoNum, new Date().toISOString().split('T')[0], id]
        );
      }

      // Se a conta está vinculada a uma venda, atualizar o total da venda
      if (conta.venda_id) {
        // Somar o valor recebido ao total da venda
        await connection.execute(
          `UPDATE vendas SET total = total + ? WHERE id = ?`,
          [valorRecebidoNum, conta.venda_id]
        );

        // Criar método de pagamento na venda
        await connection.execute(
          `INSERT INTO venda_pagamentos (venda_id, metodo, valor, valor_original)
           VALUES (?, ?, ?, ?)`,
          [conta.venda_id, metodoPagamento, valorRecebidoNum, valorRecebidoNum]
        );

        // Atualizar total_compras do cliente com o valor recebido
        if (conta.cliente_id) {
          await connection.execute(
            `UPDATE clientes SET total_compras = total_compras + ? WHERE id = ?`,
            [valorRecebidoNum, conta.cliente_id]
          );
        }
      }

      // Criar transação de entrada para o valor recebido
      await connection.execute(
        `INSERT INTO transacoes (
          tenant_id, tipo, categoria, descricao, valor, data_transacao,
          metodo_pagamento, conta, cliente_id, observacoes, anexos, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id,
          'entrada',
          'recebimento',
          `Recebimento - ${conta.descricao}`,
          valorRecebidoNum,
          dataPagamento,
          metodoPagamento,
          'caixa',
          conta.cliente_id,
          observacoes || `Pagamento parcial de conta a receber #${id}`,
          JSON.stringify(anexos || []),
          'concluida'
        ]
      );

      return {
        valorRecebido: valorRecebidoNum,
        valorRestante: valorRestante,
        contaAtualizada: valorRestante > 0
      };
    });

    res.json({
      message: valorRestante <= 0 ? 'Pagamento processado com sucesso' : 'Pagamento parcial processado com sucesso',
      ...result
    });

  } catch (error) {
    console.error('Erro ao processar pagamento parcial:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Upload de anexos para transações
router.post('/upload-anexo', async (req, res) => {
  try {
    const { fileBase64, fileName, fileType } = req.body;

    if (!fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo é obrigatório'
      });
    }

    console.log('📤 Enviando arquivo para Cloudinary:', {
      fileName,
      fileType,
      base64Length: fileBase64.length,
      hasDataPrefix: fileBase64.startsWith('data:')
    });

    // Upload para Cloudinary
    const uploadResult = await uploadImage(
      fileBase64, 
      `kontrolla/transacoes/${req.user.tenant_id}`
    );

    if (!uploadResult.success) {
      console.error('❌ Erro no upload para Cloudinary:', uploadResult.error);
      return res.status(500).json({
        success: false,
        error: uploadResult.error
      });
    }

    console.log('✅ Upload realizado com sucesso:', uploadResult.url);

    res.json({
      success: true,
      url: uploadResult.url,
      public_id: uploadResult.public_id,
      fileName: fileName || 'anexo',
      fileType: fileType || 'unknown'
    });

  } catch (error) {
    console.error('❌ Erro no upload de anexo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
