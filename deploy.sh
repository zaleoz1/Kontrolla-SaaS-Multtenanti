#!/bin/bash

# Script de Deploy para Integrator Host
# KontrollaPro SaaS Multitenanti

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
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

log "🚀 Iniciando deploy do KontrollaPro no Integrator Host"

# Atualizar sistema
log "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências necessárias
log "🔧 Instalando dependências..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nano \
    ufw \
    fail2ban

# Instalar Docker
log "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Adicionar usuário ao grupo docker
    usermod -aG docker $USER
    
    # Habilitar Docker no boot
    systemctl enable docker
    systemctl start docker
else
    log "Docker já está instalado"
fi

# Instalar Docker Compose
log "🐳 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
else
    log "Docker Compose já está instalado"
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
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p mysql-init
mkdir -p ssl-certs
mkdir -p backups

# Configurar SSL (Let's Encrypt)
log "🔒 Configurando SSL..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Criar script de renovação SSL
cat > /opt/kontrollapro/ssl-renew.sh << 'EOF'
#!/bin/bash
certbot renew --quiet --nginx
docker-compose -f /opt/kontrollapro/docker-compose.prod.yml restart nginx
EOF

chmod +x /opt/kontrollapro/ssl-renew.sh

# Adicionar cron job para renovação SSL
(crontab -l 2>/dev/null; echo "0 12 * * * /opt/kontrollapro/ssl-renew.sh") | crontab -

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

# Configurar monitoramento
log "📊 Configurando monitoramento..."
cat > /opt/kontrollapro/monitor.sh << 'EOF'
#!/bin/bash
# Verificar se os containers estão rodando
if ! docker ps | grep -q kontrolla-mysql-prod; then
    echo "MySQL container is down!" | mail -s "KontrollaPro Alert" admin@kontrollapro.com
fi

if ! docker ps | grep -q kontrolla-backend-prod; then
    echo "Backend container is down!" | mail -s "KontrollaPro Alert" admin@kontrollapro.com
fi

if ! docker ps | grep -q kontrolla-frontend-prod; then
    echo "Frontend container is down!" | mail -s "KontrollaPro Alert" admin@kontrollapro.com
fi
EOF

chmod +x /opt/kontrollapro/monitor.sh

# Adicionar cron job para monitoramento
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/kontrollapro/monitor.sh") | crontab -

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

# Verificar logs
log "📋 Verificando logs..."
docker-compose -f docker-compose.prod.yml logs --tail=50

# Configurar Nginx para SSL (quando certificado estiver disponível)
log "🔒 Para configurar SSL, execute:"
echo "certbot --nginx -d kontrollapro.com -d www.kontrollapro.com"

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
    *)
        echo "Uso: $0 {start|stop|restart|logs|status|update|backup}"
        exit 1
        ;;
esac
EOF

chmod +x /opt/kontrollapro/manage.sh

# Configurar alias para facilitar uso
echo "alias kontrolla='/opt/kontrollapro/manage.sh'" >> /root/.bashrc

log "✅ Deploy concluído com sucesso!"
log "🌐 Acesse: http://$(curl -s ifconfig.me)"
log "📋 Para gerenciar: /opt/kontrollapro/manage.sh {start|stop|restart|logs|status|update|backup}"
log "🔒 Para SSL: certbot --nginx -d seu-dominio.com"

# Mostrar informações finais
echo ""
echo "=========================================="
echo "🎉 KontrollaPro deployado com sucesso!"
echo "=========================================="
echo "📍 Diretório: $PROJECT_DIR"
echo "🌐 URL: http://$(curl -s ifconfig.me)"
echo "📋 Gerenciar: /opt/kontrollapro/manage.sh"
echo "🔒 SSL: certbot --nginx -d seu-dominio.com"
echo "=========================================="
