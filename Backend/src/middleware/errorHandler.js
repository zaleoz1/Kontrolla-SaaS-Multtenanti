// Middleware para tratamento de erros
export const errorHandler = (err, req, res, next) => {
  console.error('Erro capturado:', err);

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.message
    });
  }

  // Erro de duplicação de chave única
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Registro duplicado',
      details: 'Já existe um registro com esses dados'
    });
  }

  // Erro de chave estrangeira
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: 'Referência inválida',
      details: 'O registro referenciado não existe'
    });
  }

  // Erro de conexão com banco de dados
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      error: 'Serviço indisponível',
      details: 'Erro de conexão com o banco de dados'
    });
  }

  // Erro de timeout
  if (err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      error: 'Timeout',
      details: 'A operação demorou muito para ser concluída'
    });
  }

  // Erro de sintaxe SQL
  if (err.code === 'ER_PARSE_ERROR') {
    return res.status(500).json({
      error: 'Erro interno',
      details: 'Erro na consulta ao banco de dados'
    });
  }

  // Erro de arquivo não encontrado
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Arquivo não encontrado',
      details: err.message
    });
  }

  // Erro de limite de tamanho de arquivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Arquivo muito grande',
      details: 'O arquivo excede o tamanho máximo permitido'
    });
  }

  // Erro padrão
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};
