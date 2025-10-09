#!/bin/bash

# Script para configuração de SSL/HTTPS
# KontrollaPro SaaS Multitenanti

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root"
fi

# Verificar se domínio foi fornecido
if [ -z "$1" ]; then
    error "Uso: $0 <dominio> [email]"
    echo "Exemplo: $0 kontrollapro.com admin@kontrollapro.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

log "🔒 Configurando SSL para $DOMAIN"

# Instalar Certbot se não estiver instalado
if ! command -v certbot &> /dev/null; then
    log "📦 Instalando Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Parar containers temporariamente
log "⏸️ Parando containers temporariamente..."
cd /opt/kontrollapro
docker-compose -f docker-compose.prod.yml stop nginx

# Obter certificado SSL
log "🔐 Obtendo certificado SSL..."
certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN \
    --non-interactive

# Verificar se certificado foi criado
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    error "Falha ao obter certificado SSL"
fi

# Copiar certificados para diretório do projeto
log "📁 Copiando certificados..."
mkdir -p /opt/kontrollapro/nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/kontrollapro/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/kontrollapro/nginx/ssl/key.pem
chmod 600 /opt/kontrollapro/nginx/ssl/key.pem
chmod 644 /opt/kontrollapro/nginx/ssl/cert.pem

# Atualizar configuração do Nginx
log "⚙️ Atualizando configuração do Nginx..."
cat > /opt/kontrollapro/nginx/nginx-ssl.conf << EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream para backend
    upstream backend {
        server backend:3000;
        keepalive 32;
    }

    # Upstream para frontend
    upstream frontend {
        server frontend:80;
        keepalive 32;
    }

    # Redirecionar HTTP para HTTPS
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    # Configuração HTTPS
    server {
        listen 443 ssl http2;
        server_name $DOMAIN www.$DOMAIN;
        
        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL Security
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_stapling on;
        ssl_stapling_verify on;
        
        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://accounts.google.com;" always;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Atualizar docker-compose para usar nova configuração
log "🐳 Atualizando docker-compose..."
sed -i 's|./nginx/nginx.conf:/etc/nginx/nginx.conf:ro|./nginx/nginx-ssl.conf:/etc/nginx/nginx.conf:ro|g' /opt/kontrollapro/docker-compose.prod.yml

# Reiniciar containers
log "🔄 Reiniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# Configurar renovação automática
log "🔄 Configurando renovação automática..."
cat > /opt/kontrollapro/ssl-renew.sh << EOF
#!/bin/bash
# Renovar certificados SSL
certbot renew --quiet --nginx

# Copiar novos certificados
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/kontrollapro/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/kontrollapro/nginx/ssl/key.pem

# Reiniciar nginx
docker-compose -f /opt/kontrollapro/docker-compose.prod.yml restart nginx
EOF

chmod +x /opt/kontrollapro/ssl-renew.sh

# Adicionar cron job para renovação
(crontab -l 2>/dev/null; echo "0 12 * * * /opt/kontrollapro/ssl-renew.sh") | crontab -

# Testar SSL
log "🧪 Testando SSL..."
sleep 10
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health | grep -q "200"; then
    log "✅ SSL configurado com sucesso!"
    log "🌐 Acesse: https://$DOMAIN"
else
    warn "⚠️ SSL configurado, mas teste falhou. Verifique os logs."
fi

log "✅ Configuração SSL concluída!"
log "🔒 Certificado válido até: $(openssl x509 -in /opt/kontrollapro/nginx/ssl/cert.pem -noout -dates | grep notAfter | cut -d= -f2)"
log "🔄 Renovação automática configurada"
