import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas exceto busca de CEP
router.use((req, res, next) => {
  // Permitir acesso sem autenticação para busca de CEP
  if (req.path.includes('/buscar/cep/')) {
    return next();
  }
  // Aplicar autenticação para todas as outras rotas
  return authenticateToken(req, res, next);
});

// Rota para gerar contas de salário para funcionários existentes
router.post('/gerar-contas-salario', async (req, res) => {
  try {
    if (!req.user || !req.user.tenant_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const tenantId = req.user.tenant_id;
    const { mes, ano } = req.body;

    // Se não especificado, usar o mês atual
    const dataReferencia = mes && ano ? new Date(ano, mes - 1, 1) : new Date();
    const proximoMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 5);

    // Buscar funcionários ativos que não possuem contas a pagar
    const funcionarios = await query(
      `SELECT f.id, f.nome, f.sobrenome, f.cargo, f.salario, f.data_admissao 
       FROM funcionarios f 
       LEFT JOIN contas_pagar cp ON f.id = cp.funcionario_id AND cp.tenant_id = f.tenant_id
       WHERE f.tenant_id = ? AND f.status = "ativo" AND cp.id IS NULL`,
      [tenantId]
    );

    let contasCriadas = 0;
    let contasExistentes = 0;

    console.log(`🔄 Processando ${funcionarios.length} funcionários sem contas a pagar`);

    for (const funcionario of funcionarios) {
      try {
        // Calcular data de vencimento baseada na data de admissão
        const dataAdmissao = new Date(funcionario.data_admissao);
        let dataVencimento = new Date(dataAdmissao.getFullYear(), dataAdmissao.getMonth() + 1, 5);
        
        // Se o funcionário foi admitido no dia 5 ou depois, o primeiro pagamento é no mês seguinte
        if (dataAdmissao.getDate() >= 5) {
          dataVencimento.setMonth(dataVencimento.getMonth() + 1);
        }

        // Criar conta a pagar para o salário
        await queryWithResult(
          `INSERT INTO contas_pagar (
            tenant_id, fornecedor_id, funcionario_id, descricao, valor, data_vencimento, 
            status, categoria, observacoes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tenantId,
            null,
            funcionario.id,
            `Salário - ${funcionario.nome} ${funcionario.sobrenome} (${funcionario.cargo})`,
            funcionario.salario,
            dataVencimento.toISOString().split('T')[0],
            'pendente',
            'Folha de Pagamento',
            `Salário mensal do funcionário ${funcionario.nome} ${funcionario.sobrenome} - Cargo: ${funcionario.cargo}`
          ]
        );
        contasCriadas++;
        console.log(`✅ Conta criada para funcionário: ${funcionario.nome} ${funcionario.sobrenome}`);
      } catch (error) {
        console.error(`❌ Erro ao criar conta para funcionário ${funcionario.nome}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Contas de salário processadas: ${contasCriadas} criadas, ${contasExistentes} já existiam`,
      contasCriadas,
      contasExistentes,
      totalFuncionarios: funcionarios.length
    });

  } catch (error) {
    console.error('❌ Erro ao gerar contas de salário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Validação para funcionário
const validateFuncionario = [
  (req, res, next) => {
    const { nome, sobrenome, cpf, cargo, data_admissao, salario } = req.body;
    
    // Validações básicas
    if (!nome || nome.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório e deve ter pelo menos 2 caracteres'
      });
    }
    
    if (!sobrenome || sobrenome.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Sobrenome é obrigatório e deve ter pelo menos 2 caracteres'
      });
    }
    
    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      return res.status(400).json({
        success: false,
        error: 'CPF é obrigatório e deve ter 11 dígitos'
      });
    }
    
    if (!cargo || cargo.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Cargo é obrigatório e deve ter pelo menos 2 caracteres'
      });
    }
    
    if (!data_admissao) {
      return res.status(400).json({
        success: false,
        error: 'Data de admissão é obrigatória'
      });
    }
    
    if (!salario || salario <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Salário é obrigatório e deve ser maior que zero'
      });
    }
    
    next();
  }
];

// Listar funcionários com paginação e busca
router.get('/', validatePagination, validateSearch, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', filtroStatus = 'todos', filtroCargo = 'todos' } = req.query;
    
    // Validar parâmetros manualmente
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    // Verificar se req.user existe
    if (!req.user || !req.user.tenant_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }
    
    const tenantId = req.user.tenant_id;

    console.log('🔍 Parâmetros da query:', { page: pageNum, limit: limitNum, offset, tenantId, q, filtroStatus, filtroCargo });

    // Buscar funcionários
    let funcionariosQuery = `
      SELECT 
        f.id,
        f.nome,
        f.sobrenome,
        f.cpf,
        f.rg,
        f.email,
        f.telefone,
        f.endereco,
        f.cidade,
        f.estado,
        f.cep,
        f.data_nascimento,
        f.sexo,
        f.estado_civil,
        f.cargo,
        f.departamento,
        f.data_admissao,
        f.data_demissao,
        f.salario,
        f.tipo_salario,
        f.valor_hora,
        f.comissao_percentual,
        f.banco,
        f.agencia,
        f.conta,
        f.digito,
        f.tipo_conta,
        f.pix,
        f.observacoes,
        f.status,
        f.data_criacao,
        f.data_atualizacao
      FROM funcionarios f
      WHERE f.tenant_id = ?
    `;

    let params = [tenantId];

    // Adicionar busca se necessário
    if (q && q.trim()) {
      funcionariosQuery += ` AND (f.nome LIKE ? OR f.sobrenome LIKE ? OR f.cpf LIKE ? OR f.cargo LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    // Adicionar filtro de status se necessário
    if (filtroStatus && filtroStatus !== 'todos') {
      funcionariosQuery += ` AND f.status = ?`;
      params.push(filtroStatus);
    }

    // Adicionar filtro de cargo se necessário
    if (filtroCargo && filtroCargo !== 'todos') {
      funcionariosQuery += ` AND f.cargo = ?`;
      params.push(filtroCargo);
    }

    funcionariosQuery += ` ORDER BY f.nome ASC LIMIT ${limitNum} OFFSET ${offset}`;

    console.log('🔍 Query SQL:', funcionariosQuery);
    console.log('🔍 Parâmetros finais:', params);
    
    const funcionarios = await query(funcionariosQuery, params);

    // Contar total de funcionários
    let countQuery = `
      SELECT COUNT(*) as total
      FROM funcionarios f
      WHERE f.tenant_id = ?
    `;
    
    let countParams = [tenantId];
    
    if (q && q.trim()) {
      countQuery += ` AND (f.nome LIKE ? OR f.sobrenome LIKE ? OR f.cpf LIKE ? OR f.cargo LIKE ?)`;
      countParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    
    if (filtroStatus && filtroStatus !== 'todos') {
      countQuery += ` AND f.status = ?`;
      countParams.push(filtroStatus);
    }
    
    const countResult = await query(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    console.log('📊 Resultados:', { total, totalPages, funcionarios: funcionarios.length });

    res.json({
      success: true,
      funcionarios,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar funcionários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar funcionário por ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.tenant_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }
    
    const tenantId = req.user.tenant_id;

    const funcionarios = await query(
      `SELECT 
        f.id,
        f.nome,
        f.sobrenome,
        f.cpf,
        f.rg,
        f.email,
        f.telefone,
        f.endereco,
        f.cidade,
        f.estado,
        f.cep,
        f.data_nascimento,
        f.sexo,
        f.estado_civil,
        f.cargo,
        f.departamento,
        f.data_admissao,
        f.data_demissao,
        f.salario,
        f.tipo_salario,
        f.valor_hora,
        f.comissao_percentual,
        f.banco,
        f.agencia,
        f.conta,
        f.digito,
        f.tipo_conta,
        f.pix,
        f.observacoes,
        f.status,
        f.data_criacao,
        f.data_atualizacao
      FROM funcionarios f
      WHERE f.id = ? AND f.tenant_id = ?`,
      [id, tenantId]
    );

    if (funcionarios.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }

    res.json({
      success: true,
      funcionario: funcionarios[0]
    });
  } catch (error) {
    console.error('❌ Erro ao buscar funcionário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Criar funcionário
router.post('/', validateFuncionario, async (req, res) => {
  try {
    const {
      nome,
      sobrenome,
      cpf,
      rg,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      data_nascimento,
      sexo,
      estado_civil,
      cargo,
      departamento,
      data_admissao,
      data_demissao,
      salario,
      tipo_salario,
      valor_hora,
      comissao_percentual,
      banco,
      agencia,
      conta,
      digito,
      tipo_conta,
      pix,
      observacoes,
      status
    } = req.body;

    if (!req.user || !req.user.tenant_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const tenantId = req.user.tenant_id;

    // Verificar se CPF já existe no tenant
    const cpfExists = await query(
      'SELECT id FROM funcionarios WHERE cpf = ? AND tenant_id = ?',
      [cpf.replace(/\D/g, ''), tenantId]
    );

    if (cpfExists.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'CPF já cadastrado para outro funcionário'
      });
    }

    // Verificar se email já existe no tenant (se fornecido)
    if (email) {
      const emailExists = await query(
        'SELECT id FROM funcionarios WHERE email = ? AND tenant_id = ?',
        [email, tenantId]
      );

      if (emailExists.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email já cadastrado para outro funcionário'
        });
      }
    }

    // Inserir funcionário
    const result = await queryWithResult(
      `INSERT INTO funcionarios (
        tenant_id, nome, sobrenome, cpf, rg, email, telefone, endereco, cidade, estado, cep,
        data_nascimento, sexo, estado_civil, cargo, departamento, data_admissao, data_demissao,
        salario, tipo_salario, valor_hora, comissao_percentual, banco, agencia, conta, digito,
        tipo_conta, pix, observacoes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, nome.trim(), sobrenome.trim(), cpf.replace(/\D/g, ''), rg?.trim() || null,
        email?.trim() || null, telefone?.trim() || null, endereco?.trim() || null,
        cidade?.trim() || null, estado?.trim() || null, cep?.replace(/\D/g, '') || null,
        data_nascimento || null, sexo || 'masculino', estado_civil || 'solteiro',
        cargo.trim(), departamento?.trim() || null, data_admissao, data_demissao || null,
        salario, tipo_salario || 'mensal', valor_hora || null, comissao_percentual || null,
        banco?.trim() || null, agencia?.trim() || null, conta?.trim() || null,
        digito?.trim() || null, tipo_conta || 'corrente', pix?.trim() || null,
        observacoes?.trim() || null, status || 'ativo'
      ]
    );

    const funcionarioId = result.insertId;

    // Criar conta a pagar para o salário do funcionário
    try {
      console.log('🔄 Iniciando criação de conta a pagar para funcionário:', funcionarioId);
      
      // Calcular data de vencimento (próximo dia 5 do mês)
      const dataAdmissao = new Date(data_admissao);
      const proximoMes = new Date(dataAdmissao.getFullYear(), dataAdmissao.getMonth() + 1, 5);
      
      // Se o funcionário foi admitido no dia 5 ou depois, o primeiro pagamento é no mês seguinte
      if (dataAdmissao.getDate() >= 5) {
        proximoMes.setMonth(proximoMes.getMonth() + 1);
      }

      const dadosConta = [
        tenantId,
        null, // fornecedor_id será null para funcionários
        funcionarioId, // funcionario_id para identificar o funcionário
        `Salário - ${nome.trim()} ${sobrenome.trim()} (${cargo.trim()})`,
        salario,
        proximoMes.toISOString().split('T')[0], // Formato YYYY-MM-DD
        'pendente',
        'Folha de Pagamento',
        `Salário mensal do funcionário ${nome.trim()} ${sobrenome.trim()} - Cargo: ${cargo.trim()}`
      ];

      console.log('📊 Dados da conta a pagar:', dadosConta);

      // Criar conta a pagar para o salário
      const result = await queryWithResult(
        `INSERT INTO contas_pagar (
          tenant_id, fornecedor_id, funcionario_id, descricao, valor, data_vencimento, 
          status, categoria, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        dadosConta
      );

      console.log('✅ Conta a pagar criada com sucesso. ID:', result.insertId);
    } catch (contaError) {
      console.error('❌ Erro ao criar conta a pagar para o funcionário:', contaError);
      console.error('❌ Detalhes do erro:', contaError.message);
      console.error('❌ Stack trace:', contaError.stack);
      // Não falhar a criação do funcionário se houver erro na conta a pagar
    }

    // Buscar funcionário criado
    const funcionarios = await query(
      'SELECT * FROM funcionarios WHERE id = ?',
      [funcionarioId]
    );

    console.log('✅ Funcionário criado com sucesso:', funcionarioId);

    res.status(201).json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: funcionarios[0]
    });
  } catch (error) {
    console.error('❌ Erro ao criar funcionário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar funcionário
router.put('/:id', validateId, validateFuncionario, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      sobrenome,
      cpf,
      rg,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      data_nascimento,
      sexo,
      estado_civil,
      cargo,
      departamento,
      data_admissao,
      data_demissao,
      salario,
      tipo_salario,
      valor_hora,
      comissao_percentual,
      banco,
      agencia,
      conta,
      digito,
      tipo_conta,
      pix,
      observacoes,
      status
    } = req.body;

    if (!req.user || !req.user.tenant_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const tenantId = req.user.tenant_id;

    // Verificar se funcionário existe
    const funcionarioExists = await query(
      'SELECT id FROM funcionarios WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (funcionarioExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }

    // Verificar se CPF já existe em outro funcionário
    const cpfExists = await query(
      'SELECT id FROM funcionarios WHERE cpf = ? AND tenant_id = ? AND id != ?',
      [cpf.replace(/\D/g, ''), tenantId, id]
    );

    if (cpfExists.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'CPF já cadastrado para outro funcionário'
      });
    }

    // Verificar se email já existe em outro funcionário (se fornecido)
    if (email) {
      const emailExists = await query(
        'SELECT id FROM funcionarios WHERE email = ? AND tenant_id = ? AND id != ?',
        [email, tenantId, id]
      );

      if (emailExists.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email já cadastrado para outro funcionário'
        });
      }
    }

    // Atualizar funcionário
    await query(
      `UPDATE funcionarios SET 
        nome = ?, sobrenome = ?, cpf = ?, rg = ?, email = ?, telefone = ?, endereco = ?,
        cidade = ?, estado = ?, cep = ?, data_nascimento = ?, sexo = ?, estado_civil = ?,
        cargo = ?, departamento = ?, data_admissao = ?, data_demissao = ?, salario = ?,
        tipo_salario = ?, valor_hora = ?, comissao_percentual = ?, banco = ?, agencia = ?,
        conta = ?, digito = ?, tipo_conta = ?, pix = ?, observacoes = ?, status = ?,
        data_atualizacao = NOW()
      WHERE id = ? AND tenant_id = ?`,
      [
        nome.trim(), sobrenome.trim(), cpf.replace(/\D/g, ''), rg?.trim() || null,
        email?.trim() || null, telefone?.trim() || null, endereco?.trim() || null,
        cidade?.trim() || null, estado?.trim() || null, cep?.replace(/\D/g, '') || null,
        data_nascimento || null, sexo || 'masculino', estado_civil || 'solteiro',
        cargo.trim(), departamento?.trim() || null, data_admissao, data_demissao || null,
        salario, tipo_salario || 'mensal', valor_hora || null, comissao_percentual || null,
        banco?.trim() || null, agencia?.trim() || null, conta?.trim() || null,
        digito?.trim() || null, tipo_conta || 'corrente', pix?.trim() || null,
        observacoes?.trim() || null, status || 'ativo', id, tenantId
      ]
    );

    // Atualizar ou criar conta a pagar para o salário do funcionário
    try {
      console.log('🔄 Atualizando conta a pagar para funcionário:', id);
      
      // Verificar se já existe conta a pagar para este funcionário
      const contaExistente = await query(
        'SELECT id FROM contas_pagar WHERE funcionario_id = ? AND tenant_id = ?',
        [id, tenantId]
      );

      if (contaExistente.length > 0) {
        // Atualizar conta existente
        await query(
          `UPDATE contas_pagar SET 
            descricao = ?, valor = ?, status = ?, observacoes = ?
          WHERE funcionario_id = ? AND tenant_id = ?`,
          [
            `Salário - ${nome.trim()} ${sobrenome.trim()} (${cargo.trim()})`,
            salario,
            status === 'ativo' ? 'pendente' : 'cancelado',
            `Salário mensal do funcionário ${nome.trim()} ${sobrenome.trim()} - Cargo: ${cargo.trim()}`,
            id, tenantId
          ]
        );
        console.log('✅ Conta a pagar atualizada para funcionário:', id);
      } else {
        // Criar nova conta se não existir
        const dataAdmissao = new Date(data_admissao);
        const proximoMes = new Date(dataAdmissao.getFullYear(), dataAdmissao.getMonth() + 1, 5);
        
        if (dataAdmissao.getDate() >= 5) {
          proximoMes.setMonth(proximoMes.getMonth() + 1);
        }

        await queryWithResult(
          `INSERT INTO contas_pagar (
            tenant_id, fornecedor_id, funcionario_id, descricao, valor, data_vencimento, 
            status, categoria, observacoes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tenantId,
            null,
            id,
            `Salário - ${nome.trim()} ${sobrenome.trim()} (${cargo.trim()})`,
            salario,
            proximoMes.toISOString().split('T')[0],
            status === 'ativo' ? 'pendente' : 'cancelado',
            'Folha de Pagamento',
            `Salário mensal do funcionário ${nome.trim()} ${sobrenome.trim()} - Cargo: ${cargo.trim()}`
          ]
        );
        console.log('✅ Nova conta a pagar criada para funcionário:', id);
      }
    } catch (contaError) {
      console.error('❌ Erro ao atualizar conta a pagar para funcionário:', contaError);
    }

    // Buscar funcionário atualizado
    const funcionarios = await query(
      'SELECT * FROM funcionarios WHERE id = ?',
      [id]
    );

    console.log('✅ Funcionário atualizado com sucesso:', id);

    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      funcionario: funcionarios[0]
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar funcionário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar funcionário
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.tenant_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const tenantId = req.user.tenant_id;

    // Verificar se funcionário existe
    const funcionarioExists = await query(
      'SELECT id FROM funcionarios WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (funcionarioExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }

    // Deletar funcionário
    await query(
      'DELETE FROM funcionarios WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    console.log('✅ Funcionário deletado com sucesso:', id);

    res.json({
      success: true,
      message: 'Funcionário deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar funcionário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar CEP (sem autenticação)
router.get('/buscar/cep/:cep', async (req, res) => {
  try {
    const { cep } = req.params;
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'CEP deve ter 8 dígitos'
      });
    }

    // Simulação de busca de CEP (você pode integrar com uma API real)
    // Por enquanto, retornamos dados mock
    const dadosCep = {
      cep: cepLimpo,
      endereco: 'Rua Exemplo',
      cidade: 'São Paulo',
      estado: 'SP'
    };

    res.json({
      success: true,
      dados: dadosCep
    });
  } catch (error) {
    console.error('❌ Erro ao buscar CEP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
