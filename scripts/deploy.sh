#!/bin/bash

# Script de Deploy para KontrollaPro - Integrator Host
# Este script automatiza o processo de deploy em produção

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

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root"
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Instale o Docker primeiro."
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
fi

# Verificar se o arquivo de ambiente existe
if [ ! -f "env.production" ]; then
    error "Arquivo env.production não encontrado. Crie o arquivo de ambiente primeiro."
fi

log "Iniciando deploy do KontrollaPro..."

# Parar containers existentes
log "Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down || true

# Remover imagens antigas (opcional)
log "Limpando imagens antigas..."
docker system prune -f || true

# Fazer backup do banco de dados se existir
if docker ps -a | grep -q kontrolla-mysql-prod; then
    log "Fazendo backup do banco de dados..."
    mkdir -p backups
    docker exec kontrolla-mysql-prod mysqldump -u root -p${MYSQL_ROOT_PASSWORD:-KontrollaPro2024!Secure} kontrollapro > backups/backup_$(date +%Y%m%d_%H%M%S).sql || warning "Não foi possível fazer backup do banco"
fi

# Construir e iniciar os containers
log "Construindo e iniciando containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Aguardar os serviços ficarem prontos
log "Aguardando serviços ficarem prontos..."
sleep 30

# Verificar se os containers estão rodando
log "Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

# Verificar health checks
log "Verificando health checks..."
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "Backend está funcionando!"
        break
    fi
    if [ $i -eq 30 ]; then
        error "Backend não está respondendo após 30 tentativas"
    fi
    sleep 2
done

# Verificar se o frontend está acessível
for i in {1..30}; do
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        log "Frontend está funcionando!"
        break
    fi
    if [ $i -eq 30 ]; then
        error "Frontend não está respondendo após 30 tentativas"
    fi
    sleep 2
done

# Configurar SSL (se necessário)
log "Configurando SSL..."
if [ ! -f "/etc/ssl/certs/ssl-cert-snakeoil.pem" ]; then
    warning "Certificado SSL não encontrado. Configure SSL manualmente."
fi

# Configurar firewall
log "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# Configurar logrotate para logs do Docker
log "Configurando logrotate..."
cat > /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

# Configurar monitoramento básico
log "Configurando monitoramento..."
cat > /usr/local/bin/kontrolla-monitor.sh << 'EOF'
#!/bin/bash
# Monitor básico para KontrollaPro

check_service() {
    local service=$1
    local port=$2
    
    if curl -f http://localhost:$port > /dev/null 2>&1; then
        echo "$(date): $service is UP"
    else
        echo "$(date): $service is DOWN - Restarting..."
        docker-compose -f /root/Kontrolla-SaaS-Multtenanti/docker-compose.prod.yml restart $service
    fi
}

check_service "backend" "3000"
check_service "frontend" "80"
EOF

chmod +x /usr/local/bin/kontrolla-monitor.sh

# Adicionar ao crontab para monitoramento a cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/kontrolla-monitor.sh >> /var/log/kontrolla-monitor.log 2>&1") | crontab -

log "Deploy concluído com sucesso!"
log "Acesse sua aplicação em: http://$(curl -s ifconfig.me)"
log "Para verificar logs: docker-compose -f docker-compose.prod.yml logs -f"
log "Para parar: docker-compose -f docker-compose.prod.yml down"
log "Para reiniciar: docker-compose -f docker-compose.prod.yml restart"
