# Dockerfile para o Frontend KontrollaPro - Produção Otimizada
FROM node:18-alpine as builder

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache git

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências com cache otimizado
RUN npm ci --only=production --silent

# Copiar código fonte
COPY . .

# Build da aplicação com otimizações
RUN npm run build

# Estágio de produção com nginx otimizado
FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Configurar permissões
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Criar diretório para logs
RUN mkdir -p /var/log/nginx

# Configurar nginx para produção
RUN echo "worker_processes auto;" > /etc/nginx/nginx.conf && \
    echo "events { worker_connections 1024; }" >> /etc/nginx/nginx.conf && \
    echo "http {" >> /etc/nginx/nginx.conf && \
    echo "    include /etc/nginx/conf.d/*.conf;" >> /etc/nginx/nginx.conf && \
    echo "    gzip on;" >> /etc/nginx/nginx.conf && \
    echo "    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;" >> /etc/nginx/nginx.conf && \
    echo "    gzip_min_length 1000;" >> /etc/nginx/nginx.conf && \
    echo "}" >> /etc/nginx/nginx.conf

# Expor portas
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
