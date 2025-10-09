# Dockerfile para o Backend KontrollaPro - Produção Otimizada
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache curl dumb-init

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S kontrolla -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção
RUN npm ci --only=production --silent && npm cache clean --force

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p uploads certificados logs

# Configurar permissões
RUN chown -R kontrolla:nodejs /app
RUN chmod -R 755 /app

# Mudar para usuário não-root
USER kontrolla

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando para iniciar a aplicação com dumb-init
CMD ["dumb-init", "npm", "start"]
