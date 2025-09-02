import { body, param, query, validationResult } from 'express-validator';

// Middleware para processar resultados da validação
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
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
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('preco')
    .isFloat({ min: 0 })
    .withMessage('Preço deve ser um número positivo'),
  body('estoque')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estoque deve ser um número inteiro não negativo'),
  body('estoque_minimo')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estoque mínimo deve ser um número inteiro não negativo'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo', 'rascunho'])
    .withMessage('Status deve ser "ativo", "inativo" ou "rascunho"'),
  handleValidationErrors
];

// Validações para vendas
export const validateVenda = [
  body('cliente_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID do cliente deve ser um número inteiro positivo'),
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
    .isIn(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'cheque'])
    .withMessage('Forma de pagamento inválida'),
  body('parcelas')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Parcelas deve ser entre 1 e 12'),
  body('status')
    .optional()
    .isIn(['pendente', 'pago', 'cancelado', 'devolvido'])
    .withMessage('Status inválido'),
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
