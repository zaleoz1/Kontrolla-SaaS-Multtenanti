// Middleware para rotas não encontradas
export const notFound = (req, res, next) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  console.log(`📋 Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`🌐 Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`🔗 Referrer: ${req.headers.referer || 'No referrer'}`);
  
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
