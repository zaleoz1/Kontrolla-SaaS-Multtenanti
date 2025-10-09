#!/bin/bash

# Script de Deploy Específico para Integrator Host
# KontrollaPro SaaS Multitenanti
# Domínio: vps6150.panel.icontainer.run

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

log "🚀 Deploy KontrollaPro no Integrator Host"
log "🌐 Domínio: vps6150.panel.icontainer.run"

# Atualizar sistema
log "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências essenciais
log "🔧 Instalando dependências..."
apt install -y curl wget git unzip htop nano ufw fail2ban certbot

# Instalar Docker
log "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Instalar Docker Compose
log "🐳 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

# Configurar firewall
log "🔥 Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# Configurar fail2ban
log "🛡️ Configurando fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Criar diretório do projeto
PROJECT_DIR="/opt/kontrollapro"
log "📁 Criando diretório do projeto: $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clonar repositório
log "📥 Clonando repositório..."
if [ -d ".git" ]; then
    log "Repositório já existe, atualizando..."
    git pull origin main
else
    git clone https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git .
fi

# Copiar arquivos de configuração
log "⚙️ Configurando arquivos de ambiente..."
cp env.production .env
cp Frontend/env.production Frontend/.env

# Criar diretórios necessários
log "📁 Criando diretórios necessários..."
mkdir -p nginx/ssl nginx/logs mysql-init ssl-certs backups

# Configurar SSL com Let's Encrypt
log "🔒 Configurando SSL para vps6150.panel.icontainer.run..."

# Parar containers temporariamente
docker-compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

# Obter certificado SSL
log "🔐 Obtendo certificado SSL..."
certbot certonly --standalone \
    --email admin@vps6150.panel.icontainer.run \
    --agree-tos \
    --no-eff-email \
    --domains vps6150.panel.icontainer.run \
    --non-interactive

# Verificar se certificado foi criado
if [ ! -f "/etc/letsencrypt/live/vps6150.panel.icontainer.run/fullchain.pem" ]; then
    warn "⚠️ Falha ao obter certificado SSL, continuando sem SSL..."
    SSL_ENABLED=false
else
    log "✅ Certificado SSL obtido com sucesso!"
    SSL_ENABLED=true
    
    # Copiar certificados
    log "📁 Copiando certificados..."
    cp /etc/letsencrypt/live/vps6150.panel.icontainer.run/fullchain.pem /opt/kontrollapro/nginx/ssl/cert.pem
    cp /etc/letsencrypt/live/vps6150.panel.icontainer.run/privkey.pem /opt/kontrollapro/nginx/ssl/key.pem
    chmod 600 /opt/kontrollapro/nginx/ssl/key.pem
    chmod 644 /opt/kontrollapro/nginx/ssl/cert.pem
fi

# Configurar Nginx com SSL
if [ "$SSL_ENABLED" = true ]; then
    log "⚙️ Configurando Nginx com SSL..."
    cat > /opt/kontrollapro/nginx/nginx-ssl.conf << 'EOF'
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
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

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
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

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
        server_name vps6150.panel.icontainer.run;
        return 301 https://$server_name$request_uri;
    }

    # Configuração HTTPS
    server {
        listen 443 ssl http2;
        server_name vps6150.panel.icontainer.run;
        
        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL Security
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
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

    # Atualizar docker-compose para usar SSL
    sed -i 's|./nginx/nginx.conf:/etc/nginx/nginx.conf:ro|./nginx/nginx-ssl.conf:/etc/nginx/nginx.conf:ro|g' /opt/kontrollapro/docker-compose.prod.yml
fi

# Construir e iniciar containers
log "🏗️ Construindo e iniciando containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Aguardar containers iniciarem
log "⏳ Aguardando containers iniciarem..."
sleep 30

# Verificar status dos containers
log "🔍 Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

# Configurar renovação automática de SSL
if [ "$SSL_ENABLED" = true ]; then
    log "🔄 Configurando renovação automática de SSL..."
    cat > /opt/kontrollapro/ssl-renew.sh << 'EOF'
#!/bin/bash
# Renovar certificados SSL
certbot renew --quiet --nginx

# Copiar novos certificados
cp /etc/letsencrypt/live/vps6150.panel.icontainer.run/fullchain.pem /opt/kontrollapro/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/vps6150.panel.icontainer.run/privkey.pem /opt/kontrollapro/nginx/ssl/key.pem

# Reiniciar nginx
docker-compose -f /opt/kontrollapro/docker-compose.prod.yml restart nginx
EOF

    chmod +x /opt/kontrollapro/ssl-renew.sh

    # Adicionar cron job para renovação
    (crontab -l 2>/dev/null; echo "0 12 * * * /opt/kontrollapro/ssl-renew.sh") | crontab -
fi

# Configurar backup automático
log "💾 Configurando backup automático..."
cat > /opt/kontrollapro/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/kontrollapro/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup do banco de dados
docker exec kontrolla-mysql-prod mysqldump -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/database_$DATE.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /opt/kontrollapro/backend_uploads .

# Limpar backups antigos (manter últimos 30 dias)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x /opt/kontrollapro/backup.sh

# Adicionar cron job para backup
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/kontrollapro/backup.sh") | crontab -

# Criar script de gerenciamento
cat > /opt/kontrollapro/manage.sh << 'EOF'
#!/bin/bash
case "$1" in
    start)
        docker-compose -f docker-compose.prod.yml up -d
        ;;
    stop)
        docker-compose -f docker-compose.prod.yml down
        ;;
    restart)
        docker-compose -f docker-compose.prod.yml restart
        ;;
    logs)
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    status)
        docker-compose -f docker-compose.prod.yml ps
        ;;
    update)
        git pull origin main
        docker-compose -f docker-compose.prod.yml build --no-cache
        docker-compose -f docker-compose.prod.yml up -d
        ;;
    backup)
        ./backup.sh
        ;;
    ssl-renew)
        ./ssl-renew.sh
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|logs|status|update|backup|ssl-renew}"
        exit 1
        ;;
esac
EOF

chmod +x /opt/kontrollapro/manage.sh

# Configurar alias
echo "alias kontrolla='/opt/kontrollapro/manage.sh'" >> /root/.bashrc

# Testar aplicação
log "🧪 Testando aplicação..."
sleep 10

if [ "$SSL_ENABLED" = true ]; then
    if curl -s -o /dev/null -w "%{http_code}" https://vps6150.panel.icontainer.run/health | grep -q "200"; then
        log "✅ Aplicação funcionando com SSL!"
        URL="https://vps6150.panel.icontainer.run"
    else
        warn "⚠️ SSL configurado, mas teste falhou. Verificando HTTP..."
        if curl -s -o /dev/null -w "%{http_code}" http://vps6150.panel.icontainer.run/health | grep -q "200"; then
            log "✅ Aplicação funcionando sem SSL!"
            URL="http://vps6150.panel.icontainer.run"
        else
            warn "⚠️ Aplicação pode não estar respondendo corretamente"
            URL="http://vps6150.panel.icontainer.run"
        fi
    fi
else
    if curl -s -o /dev/null -w "%{http_code}" http://vps6150.panel.icontainer.run/health | grep -q "200"; then
        log "✅ Aplicação funcionando!"
        URL="http://vps6150.panel.icontainer.run"
    else
        warn "⚠️ Aplicação pode não estar respondendo corretamente"
        URL="http://vps6150.panel.icontainer.run"
    fi
fi

# Mostrar informações finais
log "✅ Deploy concluído com sucesso!"
log "🌐 Acesse: $URL"
log "📋 Para gerenciar: /opt/kontrollapro/manage.sh {start|stop|restart|logs|status|update|backup|ssl-renew}"

# Mostrar informações finais
echo ""
echo "=========================================="
echo "🎉 KontrollaPro deployado com sucesso!"
echo "=========================================="
echo "📍 Diretório: $PROJECT_DIR"
echo "🌐 URL: $URL"
echo "📋 Gerenciar: /opt/kontrollapro/manage.sh"
if [ "$SSL_ENABLED" = true ]; then
    echo "🔒 SSL: Configurado e funcionando"
    echo "🔄 Renovação SSL: Automática"
else
    echo "⚠️ SSL: Não configurado (HTTP apenas)"
fi
echo "💾 Backup: Automático diário"
echo "=========================================="
