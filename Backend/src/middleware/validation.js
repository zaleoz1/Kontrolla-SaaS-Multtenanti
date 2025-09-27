import { body, param, query, validationResult } from 'express-validator';

// Middleware para processar resultados da validação
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('❌ Erro de validação:', errors.array());
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// Validações para autenticação
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  handleValidationErrors
];

// Validações para cadastro (versão simplificada para debug)
export const validateSignup = [
  body('firstName').notEmpty().withMessage('Nome é obrigatório'),
  body('lastName').notEmpty().withMessage('Sobrenome é obrigatório'),
  body('email').isEmail().withMessage('Email deve ser válido'),
  body('phone').optional(),
  body('company').notEmpty().withMessage('Nome da empresa é obrigatório'),
  body('tipoPessoa').isIn(['fisica', 'juridica']).withMessage('Tipo de pessoa deve ser física ou jurídica'),
  body('cpfCnpj').custom((value, { req }) => {
    if (!value) {
      throw new Error('CPF/CNPJ é obrigatório');
    }
    const tipoPessoa = req.body.tipoPessoa;
    if (tipoPessoa === 'fisica') {
      // Validação básica de CPF (11 dígitos)
      const cpf = value.replace(/\D/g, '');
      if (cpf.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }
    } else if (tipoPessoa === 'juridica') {
      // Validação básica de CNPJ (14 dígitos)
      const cnpj = value.replace(/\D/g, '');
      if (cnpj.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }
    }
    return true;
  }),
  body('cep').custom((value) => {
    if (!value) {
      throw new Error('CEP é obrigatório');
    }
    const cep = value.replace(/\D/g, '');
    if (cep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }
    return true;
  }),
  body('endereco').notEmpty().withMessage('Endereço é obrigatório'),
  body('cidade').notEmpty().withMessage('Cidade é obrigatória'),
  body('estado').isLength({ min: 2, max: 2 }).withMessage('Estado deve ter 2 caracteres'),
  body('razaoSocial').optional(),
  body('nomeFantasia').optional(),
  body('inscricaoEstadual').optional(),
  body('inscricaoMunicipal').optional(),
  body('password').isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('As senhas não coincidem');
    }
    return true;
  }),
  body('selectedPlan').isIn(['starter', 'professional', 'enterprise']).withMessage('Plano deve ser starter, professional ou enterprise'),
  body('acceptTerms').custom((value) => {
    if (!value) {
      throw new Error('Aceite dos termos é obrigatório');
    }
    return true;
  }),
  body('acceptMarketing').optional(),
  handleValidationErrors
];

// Validações para cadastro (versão original comentada)
export const validateSignupOriginal = [
  /*
  body('firstName')
    .custom((value) => {
      if (!value) {
        throw new Error('Nome é obrigatório');
      }
      const trimmed = value.trim();
      if (trimmed.length < 2 || trimmed.length > 255) {
        throw new Error('Nome deve ter entre 2 e 255 caracteres');
      }
      return true;
    }),
  body('lastName')
    .custom((value) => {
      if (!value) {
        throw new Error('Sobrenome é obrigatório');
      }
      const trimmed = value.trim();
      if (trimmed.length < 2 || trimmed.length > 255) {
        throw new Error('Sobrenome deve ter entre 2 e 255 caracteres');
      }
      return true;
    }),
  body('email')
    .custom((value) => {
      if (!value) {
        throw new Error('Email é obrigatório');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error('Email deve ser válido');
      }
      return true;
    }),
  body('phone')
    .optional()
    .custom((value) => {
      if (value && value.length > 0) {
        if (value.length < 10 || value.length > 20) {
          throw new Error('Telefone deve ter entre 10 e 20 caracteres');
        }
        if (!/^[\d\s\(\)\-\+]+$/.test(value)) {
          throw new Error('Telefone deve conter apenas números, espaços, parênteses, hífens e sinal de mais');
        }
      }
      return true;
    }),
  body('company')
    .custom((value) => {
      if (!value) {
        throw new Error('Nome da empresa é obrigatório');
      }
      const trimmed = value.trim();
      if (trimmed.length < 2 || trimmed.length > 255) {
        throw new Error('Nome da empresa deve ter entre 2 e 255 caracteres');
      }
      return true;
    }),
  body('password')
    .custom((value) => {
      if (!value) {
        throw new Error('Senha é obrigatória');
      }
      if (value.length < 8) {
        throw new Error('Senha deve ter pelo menos 8 caracteres');
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        throw new Error('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número');
      }
      return true;
    }),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (!value) {
        throw new Error('Confirmação de senha é obrigatória');
      }
      if (value !== req.body.password) {
        throw new Error('As senhas não coincidem');
      }
      return true;
    }),
  body('selectedPlan')
    .custom((value) => {
      if (!value) {
        throw new Error('Plano é obrigatório');
      }
      if (!['starter', 'professional', 'enterprise'].includes(value)) {
        throw new Error('Plano deve ser starter, professional ou enterprise');
      }
      return true;
    }),
  body('acceptTerms')
    .custom((value) => {
      if (!value) {
        throw new Error('Aceite dos termos é obrigatório');
      }
      if (value !== true && value !== 'true') {
        throw new Error('Você deve aceitar os termos de uso');
      }
      return true;
    }),
  body('acceptMarketing')
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== null && value !== true && value !== false && value !== 'true' && value !== 'false') {
        throw new Error('Aceite de marketing deve ser um valor booleano');
      }
      return true;
    }),
  handleValidationErrors
  */
];

// Validações para clientes
export const validateCliente = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('telefone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Telefone deve ter entre 10 e 20 caracteres'),
  body('cpf_cnpj')
    .optional()
    .isLength({ min: 11, max: 18 })
    .withMessage('CPF/CNPJ deve ter entre 11 e 18 caracteres'),
  body('tipo_pessoa')
    .optional()
    .isIn(['fisica', 'juridica'])
    .withMessage('Tipo de pessoa deve ser "fisica" ou "juridica"'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo'])
    .withMessage('Status deve ser "ativo" ou "inativo"'),
  handleValidationErrors
];

// Validações para produtos
export const validateProduto = [
  body('nome')
    .custom((value) => {
      console.log('🔍 Validando nome:', value, 'tipo:', typeof value);
      if (!value || typeof value !== 'string') {
        throw new Error('Nome é obrigatório');
      }
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        throw new Error('Nome deve ter pelo menos 2 caracteres');
      }
      if (trimmed.length > 255) {
        throw new Error('Nome deve ter no máximo 255 caracteres');
      }
      return true;
    }),
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('categoria_id')
    .optional()
    .custom((value) => {
      console.log('🔍 Validando categoria_id:', value, 'tipo:', typeof value);
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1) {
        throw new Error('ID da categoria deve ser um número inteiro positivo');
      }
      return true;
    }),
  body('codigo_barras')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Código de barras deve ter entre 1 e 50 caracteres'),
  body('sku')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU deve ter entre 1 e 100 caracteres'),
  body('preco')
    .custom((value) => {
      console.log('🔍 Validando preço:', value, 'tipo:', typeof value);
      if (value === null || value === undefined || value === '') {
        throw new Error('Preço é obrigatório');
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        throw new Error('Preço deve ser um número válido');
      }
      if (numValue <= 0) {
        throw new Error('Preço deve ser maior que zero');
      }
      return true;
    }),
  body('preco_promocional')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Preço promocional deve ser um número positivo');
      }
      return true;
    }),
  body('tipo_preco')
    .optional()
    .isIn(['unidade', 'kg', 'litros'])
    .withMessage('Tipo de preço deve ser "unidade", "kg" ou "litros"'),
  body('estoque')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Estoque deve ser um número inteiro não negativo');
      }
      return true;
    }),
  body('estoque_minimo')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Estoque mínimo deve ser um número inteiro não negativo');
      }
      return true;
    }),
  body('peso')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Peso deve ser um número positivo');
      }
      return true;
    }),
  body('largura')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Largura deve ser um número positivo');
      }
      return true;
    }),
  body('altura')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Altura deve ser um número positivo');
      }
      return true;
    }),
  body('comprimento')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Comprimento deve ser um número positivo');
      }
      return true;
    }),
  body('fornecedor_id')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Campo opcional
      }
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1) {
        throw new Error('ID do fornecedor deve ser um número inteiro positivo');
      }
      return true;
    }),
  body('marca')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Marca deve ter no máximo 100 caracteres'),
  body('modelo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Modelo deve ter no máximo 100 caracteres'),
  body('garantia')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Garantia deve ter no máximo 100 caracteres'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo', 'rascunho'])
    .withMessage('Status deve ser "ativo", "inativo" ou "rascunho"'),
  body('destaque')
    .optional()
    .isBoolean()
    .withMessage('Destaque deve ser um valor booleano'),
  body('imagens')
    .optional()
    .isArray()
    .withMessage('Imagens deve ser um array'),
  handleValidationErrors
];

// Validações para vendas
export const validateVenda = [
  body('cliente_id')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Permitir null/undefined/vazio
      }
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1) {
        throw new Error('ID do cliente deve ser um número inteiro positivo');
      }
      return true;
    }),
  body('itens')
    .isArray({ min: 1 })
    .withMessage('Venda deve ter pelo menos um item'),
  body('itens')
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('Venda deve ter pelo menos um item');
      }
      return true;
    }),
  body('itens.*.produto_id')
    .isInt({ min: 1 })
    .withMessage('ID do produto deve ser um número inteiro positivo'),
  body('itens.*.quantidade')
    .isInt({ min: 1 })
    .withMessage('Quantidade deve ser um número inteiro positivo'),
  body('itens.*.preco_unitario')
    .isFloat({ min: 0 })
    .withMessage('Preço unitário deve ser um número positivo'),
  body('itens.*.preco_total')
    .isFloat({ min: 0 })
    .withMessage('Preço total deve ser um número positivo'),
  body('subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal deve ser um número positivo'),
  body('desconto')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Desconto deve ser um número positivo'),
  body('total')
    .isFloat({ min: 0 })
    .withMessage('Total deve ser um número positivo'),
  body('forma_pagamento')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Permitir null/undefined/vazio
      }
      const validMethods = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'cheque', 'prazo'];
      if (!validMethods.includes(value)) {
        throw new Error('Forma de pagamento inválida');
      }
      return true;
    }),
  body('parcelas')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Parcelas deve ser entre 1 e 12'),
  body('status')
    .optional()
    .isIn(['pendente', 'pago', 'cancelado', 'devolvido'])
    .withMessage('Status inválido'),
  body('metodos_pagamento')
    .optional()
    .isArray()
    .withMessage('Métodos de pagamento deve ser um array'),
  body('metodos_pagamento.*.metodo')
    .optional()
    .isIn(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'cheque'])
    .withMessage('Método de pagamento inválido'),
  body('metodos_pagamento.*.valor')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Valor do método de pagamento deve ser um número positivo'),
  body('metodos_pagamento.*.troco')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Troco deve ser um número positivo'),
  body('pagamento_prazo')
    .optional()
    .isObject()
    .withMessage('Pagamento a prazo deve ser um objeto'),
  body('pagamento_prazo.dias')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Permitir vazio
      }
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1) {
        throw new Error('Dias para pagamento deve ser um número inteiro positivo');
      }
      return true;
    }),
  body('pagamento_prazo.juros')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Permitir vazio
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Juros deve ser um número positivo');
      }
      return true;
    }),
  body('pagamento_prazo.valorComJuros')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Valor com juros deve ser um número positivo'),
  body('pagamento_prazo.dataVencimento')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage('Data de vencimento deve ser uma data válida'),
  // Validação customizada para garantir que pelo menos um método de pagamento seja fornecido
  body()
    .custom((value) => {
      const { forma_pagamento, metodos_pagamento, pagamento_prazo } = value;
      
      // Se há pagamento a prazo, não precisa validar métodos de pagamento
      if (pagamento_prazo && (pagamento_prazo.dias || pagamento_prazo.juros !== undefined)) {
        return true;
      }
      
      // Se há métodos múltiplos, validar se pelo menos um tem valor
      if (metodos_pagamento && metodos_pagamento.length > 0) {
        const temValorValido = metodos_pagamento.some(metodo => 
          metodo.metodo && metodo.valor && parseFloat(metodo.valor) > 0
        );
        if (!temValorValido) {
          throw new Error('Pelo menos um método de pagamento deve ter valor válido');
        }
        return true;
      }
      
      // Se há forma de pagamento única, validar
      if (forma_pagamento && forma_pagamento !== null) {
        return true;
      }
      
      throw new Error('É necessário fornecer pelo menos um método de pagamento ou configurar pagamento a prazo');
    }),
  handleValidationErrors
];

// Validações para transações financeiras
export const validateTransacao = [
  body('tipo')
    .isIn(['entrada', 'saida'])
    .withMessage('Tipo deve ser "entrada" ou "saida"'),
  body('categoria')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Categoria deve ter entre 2 e 100 caracteres'),
  body('descricao')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Descrição deve ter entre 2 e 255 caracteres'),
  body('valor')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser um número positivo maior que zero'),
  body('data_transacao')
    .isISO8601()
    .withMessage('Data deve ser válida (formato ISO 8601)'),
  body('metodo_pagamento')
    .isIn(['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'transferencia', 'boleto', 'cheque'])
    .withMessage('Método de pagamento inválido'),
  body('conta')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Conta deve ter entre 2 e 100 caracteres'),
  body('status')
    .optional()
    .isIn(['pendente', 'concluida', 'cancelada'])
    .withMessage('Status deve ser "pendente", "concluida" ou "cancelada"'),
  handleValidationErrors
];

// Validações para parâmetros de ID
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  handleValidationErrors
];

// Validações para paginação
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  handleValidationErrors
];

// Validações para busca
export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Termo de busca deve ter entre 1 e 255 caracteres'),
  handleValidationErrors
];

// Validações para fornecedores
export const validateFornecedor = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('razao_social')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Razão social deve ter no máximo 255 caracteres'),
  body('cnpj')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const cnpj = value.replace(/\D/g, '');
      if (cnpj.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }
      return true;
    }),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('telefone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Telefone deve ter entre 10 e 20 caracteres'),
  body('endereco')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Endereço deve ter no máximo 500 caracteres'),
  body('cidade')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Cidade deve ter no máximo 100 caracteres'),
  body('estado')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter 2 caracteres'),
  body('cep')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const cep = value.replace(/\D/g, '');
      if (cep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }
      return true;
    }),
  body('contato')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Contato deve ter no máximo 255 caracteres'),
  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Observações deve ter no máximo 1000 caracteres'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo'])
    .withMessage('Status deve ser "ativo" ou "inativo"'),
  handleValidationErrors
];

// Validações para funcionários
export const validateFuncionario = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('sobrenome')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Sobrenome deve ter entre 2 e 255 caracteres'),
  body('cpf')
    .custom((value) => {
      if (!value) {
        throw new Error('CPF é obrigatório');
      }
      const cpf = value.replace(/\D/g, '');
      if (cpf.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }
      return true;
    }),
  body('rg')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('RG deve ter no máximo 20 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('telefone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Telefone deve ter entre 10 e 20 caracteres'),
  body('endereco')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Endereço deve ter no máximo 500 caracteres'),
  body('cidade')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Cidade deve ter no máximo 100 caracteres'),
  body('estado')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter 2 caracteres'),
  body('cep')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const cep = value.replace(/\D/g, '');
      if (cep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }
      return true;
    }),
  body('data_nascimento')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento deve ser uma data válida'),
  body('sexo')
    .optional()
    .isIn(['masculino', 'feminino', 'outro'])
    .withMessage('Sexo deve ser "masculino", "feminino" ou "outro"'),
  body('estado_civil')
    .optional()
    .isIn(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'])
    .withMessage('Estado civil deve ser "solteiro", "casado", "divorciado", "viuvo" ou "uniao_estavel"'),
  body('cargo')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Cargo deve ter entre 2 e 100 caracteres'),
  body('departamento')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Departamento deve ter no máximo 100 caracteres'),
  body('data_admissao')
    .isISO8601()
    .withMessage('Data de admissão é obrigatória e deve ser uma data válida'),
  body('data_demissao')
    .optional()
    .isISO8601()
    .withMessage('Data de demissão deve ser uma data válida'),
  body('salario')
    .isFloat({ min: 0.01 })
    .withMessage('Salário é obrigatório e deve ser maior que zero'),
  body('tipo_salario')
    .optional()
    .isIn(['mensal', 'horista', 'comissionado'])
    .withMessage('Tipo de salário deve ser "mensal", "horista" ou "comissionado"'),
  body('valor_hora')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Valor por hora deve ser um número positivo'),
  body('comissao_percentual')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Comissão percentual deve ser entre 0 e 100'),
  body('banco')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Banco deve ter no máximo 100 caracteres'),
  body('agencia')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Agência deve ter no máximo 10 caracteres'),
  body('conta')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Conta deve ter no máximo 20 caracteres'),
  body('digito')
    .optional()
    .trim()
    .isLength({ max: 2 })
    .withMessage('Dígito deve ter no máximo 2 caracteres'),
  body('tipo_conta')
    .optional()
    .isIn(['corrente', 'poupanca'])
    .withMessage('Tipo de conta deve ser "corrente" ou "poupanca"'),
  body('pix')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('PIX deve ter no máximo 255 caracteres'),
  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Observações deve ter no máximo 1000 caracteres'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo', 'afastado', 'demitido'])
    .withMessage('Status deve ser "ativo", "inativo", "afastado" ou "demitido"'),
  handleValidationErrors
];

// Validações para métodos de pagamento
export const validateMetodoPagamento = [
  body('tipo')
    .isIn(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'cheque'])
    .withMessage('Tipo de pagamento deve ser válido'),
  body('nome')
    .notEmpty()
    .withMessage('Nome do método de pagamento é obrigatório')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('taxa')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Taxa deve ser um número entre 0 e 100'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano'),
  body('ordem')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Ordem deve ser um número inteiro positivo'),
  body('configuracoes')
    .optional()
    .isObject()
    .withMessage('Configurações deve ser um objeto JSON'),
  handleValidationErrors
];

// Validações para parcelas de métodos de pagamento
export const validateParcelaMetodoPagamento = [
  body('quantidade')
    .isInt({ min: 1, max: 24 })
    .withMessage('Quantidade de parcelas deve ser entre 1 e 24'),
  body('taxa')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Taxa deve ser um número entre 0 e 100'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano'),
  handleValidationErrors
];

// Validações para atualização de métodos de pagamento em lote
export const validateMetodosPagamentoLote = [
  body('metodos')
    .isArray({ min: 1 })
    .withMessage('Deve conter pelo menos um método de pagamento'),
  body('metodos.*.tipo')
    .isIn(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'cheque'])
    .withMessage('Tipo de pagamento deve ser válido'),
  body('metodos.*.nome')
    .notEmpty()
    .withMessage('Nome do método de pagamento é obrigatório')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('metodos.*.taxa')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Taxa deve ser um número entre 0 e 100'),
  body('metodos.*.ativo')
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano'),
  body('metodos.*.ordem')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Ordem deve ser um número inteiro positivo'),
  body('metodos.*.parcelas')
    .optional()
    .isArray()
    .withMessage('Parcelas deve ser um array'),
  body('metodos.*.parcelas.*.quantidade')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Quantidade de parcelas deve ser entre 1 e 24'),
  body('metodos.*.parcelas.*.taxa')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Taxa da parcela deve ser um número entre 0 e 100'),
  handleValidationErrors
];

// ===== VALIDAÇÕES PARA ADMINISTRADORES =====

// Validação para criar administrador
export const validateCreateAdministrador = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  body('sobrenome')
    .notEmpty()
    .withMessage('Sobrenome é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Sobrenome deve ter entre 2 e 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Sobrenome deve conter apenas letras e espaços'),
  // Email removido - administradores não precisam de email
  body('codigo')
    .notEmpty()
    .withMessage('Código é obrigatório')
    .isLength({ min: 4, max: 20 })
    .withMessage('Código deve ter entre 4 e 20 caracteres')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Código deve conter apenas letras e números'),
  body('role')
    .notEmpty()
    .withMessage('Role é obrigatório')
    .isIn(['administrador', 'gerente', 'vendedor'])
    .withMessage('Role deve ser: administrador, gerente ou vendedor'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo', 'suspenso'])
    .withMessage('Status deve ser: ativo, inativo ou suspenso'),
  body('permissoes')
    .optional()
    .isArray()
    .withMessage('Permissões deve ser um array')
    .custom((value) => {
      if (value && !Array.isArray(value)) {
        throw new Error('Permissões deve ser um array');
      }
      const permissoesValidas = ['vendas', 'estoque', 'clientes', 'funcionarios', 'relatorios', 'financeiro', 'configuracoes', 'administracao', 'todos'];
      if (value) {
        for (const permissao of value) {
          if (!permissoesValidas.includes(permissao)) {
            throw new Error(`Permissão inválida: ${permissao}`);
          }
        }
      }
      return true;
    }),
  handleValidationErrors
];

// Validação para atualizar administrador
export const validateUpdateAdministrador = [
  body('nome')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  body('sobrenome')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Sobrenome deve ter entre 2 e 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Sobrenome deve conter apenas letras e espaços'),
  // Email removido - administradores não precisam de email
  body('codigo')
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage('Código deve ter entre 4 e 20 caracteres')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Código deve conter apenas letras e números'),
  body('role')
    .optional()
    .isIn(['administrador', 'gerente', 'vendedor'])
    .withMessage('Role deve ser: administrador, gerente ou vendedor'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo', 'suspenso'])
    .withMessage('Status deve ser: ativo, inativo ou suspenso'),
  body('permissoes')
    .optional()
    .isArray()
    .withMessage('Permissões deve ser um array')
    .custom((value) => {
      if (value && !Array.isArray(value)) {
        throw new Error('Permissões deve ser um array');
      }
      const permissoesValidas = ['vendas', 'estoque', 'clientes', 'funcionarios', 'relatorios', 'financeiro', 'configuracoes', 'administracao', 'todos'];
      if (value) {
        for (const permissao of value) {
          if (!permissoesValidas.includes(permissao)) {
            throw new Error(`Permissão inválida: ${permissao}`);
          }
        }
      }
      return true;
    }),
  handleValidationErrors
];

// Validação para parâmetros de busca de administradores
export const validateSearchAdministradores = [
  query('busca')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Busca deve ter entre 1 e 255 caracteres')
    .escape(),
  query('role')
    .optional()
    .isIn(['todos', 'administrador', 'gerente', 'vendedor'])
    .withMessage('Role deve ser: todos, administrador, gerente ou vendedor'),
  query('status')
    .optional()
    .isIn(['todos', 'ativo', 'inativo', 'suspenso'])
    .withMessage('Status deve ser: todos, ativo, inativo ou suspenso'),
  handleValidationErrors
];