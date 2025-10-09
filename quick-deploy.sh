#!/bin/bash

# Script de Deploy Rápido para Integrator Host
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

log "🚀 Deploy Rápido do KontrollaPro no Integrator Host"

# Atualizar sistema
log "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências essenciais
log "🔧 Instalando dependências..."
apt install -y curl wget git unzip htop nano ufw fail2ban

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

# Configurar firewall básico
log "🔥 Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

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

# Criar script de gerenciamento simples
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
    *)
        echo "Uso: $0 {start|stop|restart|logs|status|update}"
        exit 1
        ;;
esac
EOF

chmod +x /opt/kontrollapro/manage.sh

# Configurar alias
echo "alias kontrolla='/opt/kontrollapro/manage.sh'" >> /root/.bashrc

# Mostrar informações finais
log "✅ Deploy concluído com sucesso!"
log "🌐 Acesse: http://$(curl -s ifconfig.me)"
log "📋 Para gerenciar: /opt/kontrollapro/manage.sh {start|stop|restart|logs|status|update}"

# Mostrar informações finais
echo ""
echo "=========================================="
echo "🎉 KontrollaPro deployado com sucesso!"
echo "=========================================="
echo "📍 Diretório: $PROJECT_DIR"
echo "🌐 URL: http://$(curl -s ifconfig.me)"
echo "📋 Gerenciar: /opt/kontrollapro/manage.sh"
echo "🔒 Para SSL: ./ssl-setup.sh seu-dominio.com"
echo "=========================================="
