#!/bin/bash

# =========================================================================
# KONTROLLAPRO - SCRIPT DE DEPLOY SIMPLIFICADO
# =========================================================================
# Use este script para deploy rápido sem volumes persistentes

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

log "🚀 Iniciando deploy simplificado do KontrollaPro..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    log "📦 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Configurar firewall
log "🔥 Configurando firewall..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --reload
fi

# Copiar arquivo de configuração
log "⚙️ Configurando ambiente..."
if [ ! -f .env ]; then
    cp .env.production .env
fi

# Parar containers existentes
log "🛑 Parando containers existentes..."
docker compose down -v 2>/dev/null || true

# Iniciar deploy
log "🚀 Iniciando containers..."
docker compose -f docker-compose.simple.yml up -d --build

# Verificar status
log "🔍 Verificando status dos containers..."
sleep 10
docker compose -f docker-compose.simple.yml ps

log "✅ Deploy concluído!"
log "🌐 Aplicação disponível em: http://$(hostname -I | awk '{print $1}')"
log "📝 Para verificar logs: docker compose logs -f"