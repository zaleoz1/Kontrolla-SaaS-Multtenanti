import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateTransacao, validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar transações financeiras
router.get('/transacoes', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', tipo = '', status = '', data_inicio = '', data_fim = '' } = req.query;
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
          status, categoria, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id,
          fornecedor_id || null,
          descricao,
          valor,
          data_transacao, // Usar a data da transação como data de vencimento
          'pendente',
          categoria,
          observacoes || `Conta a pagar criada a partir de transação de saída pendente`
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
    } else {
      // Para outros tipos de transação, salvar na tabela transacoes normalmente
      result = await queryWithResult(
        `INSERT INTO transacoes (
          tenant_id, tipo, categoria, descricao, valor, data_transacao,
          metodo_pagamento, conta, fornecedor_id, cliente_id, observacoes, anexos, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id, tipo, categoria, descricao, valor, data_transacao,
          metodo_pagamento, conta, fornecedor_id, cliente_id, observacoes,
          JSON.stringify(anexos), status
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

    // Verificar se transação existe (pode estar em transacoes ou contas_pagar)
    const existingTransacoes = await query(
      'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    const existingContasPagar = await query(
      'SELECT id FROM contas_pagar WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    const isInContasPagar = existingContasPagar.length > 0;
    const isInTransacoes = existingTransacoes.length > 0;

    if (!isInTransacoes && !isInContasPagar) {
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
    const { page = 1, limit = 10, status = '', data_inicio = '', data_fim = '' } = req.query;
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

    // Buscar APENAS contas a receber da tabela contas_receber
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
        c.nome as cliente_nome,
        c.email as cliente_email,
        'conta_receber' as tipo_origem
       FROM contas_receber cr 
       LEFT JOIN clientes c ON cr.cliente_id = c.id 
       ${whereClause} 
       ORDER BY cr.data_vencimento ASC`,
      params
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM contas_receber cr ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    const contasPaginadas = contasReceber.slice(offset, offset + Number(limit));

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
    const { page = 1, limit = 10, status = '', data_inicio = '', data_fim = '' } = req.query;
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

      await query(
        `UPDATE contas_receber SET 
          cliente_id = ?, venda_id = ?, descricao = ?, valor = ?, data_vencimento = ?,
          data_pagamento = ?, status = ?, parcela = ?, observacoes = ?
        WHERE id = ? AND tenant_id = ?`,
        [
          cliente_id, venda_id, descricao, valor, data_vencimento, data_pagamento,
          status, parcela, observacoes, id, req.user.tenant_id
        ]
      );

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

      await query(
        `UPDATE contas_pagar SET 
          fornecedor = ?, descricao = ?, valor = ?, data_vencimento = ?,
          data_pagamento = ?, status = ?, categoria = ?, observacoes = ?
        WHERE id = ? AND tenant_id = ?`,
        [
          fornecedor, descricao, valor, data_vencimento, data_pagamento,
          status, categoria, observacoes, id, req.user.tenant_id
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

// Estatísticas financeiras
router.get('/stats/overview', async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    
    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de período
    switch (periodo) {
      case 'hoje':
        whereClause += ' AND DATE(data_transacao) = CURDATE()';
        break;
      case 'semana':
        whereClause += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'mes':
        whereClause += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case 'ano':
        whereClause += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
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

    // Contas a receber (APENAS da tabela contas_receber)
    const contasReceber = await query(
      `SELECT 
        COUNT(*) as total_contas,
        COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) as valor_pendente,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0) as valor_vencido
      FROM contas_receber 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    // Contas a pagar (incluindo transações pendentes do tipo saída)
    const contasPagar = await query(
      `SELECT 
        COUNT(*) as total_contas,
        COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) as valor_pendente,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0) as valor_vencido
      FROM (
        SELECT status, valor FROM contas_pagar WHERE tenant_id = ?
        UNION ALL
        SELECT status, valor FROM transacoes WHERE tenant_id = ? AND tipo = 'saida' AND status = 'pendente'
      ) as contas_combineadas`,
      [req.user.tenant_id, req.user.tenant_id]
    );

    const fluxoCaixa = transacoesStats[0].total_entradas - transacoesStats[0].total_saidas;

    res.json({
      stats: {
        ...transacoesStats[0],
        fluxo_caixa: fluxoCaixa,
        contas_receber: contasReceber[0],
        contas_pagar: contasPagar[0]
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

export default router;
