#!/bin/bash

# Script de configuração inicial do servidor
# Para ser executado no Integrator Host

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

log "🚀 Configurando servidor para KontrollaPro"

# Atualizar sistema
log "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
log "🔧 Instalando dependências básicas..."
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
    vim \
    ufw \
    fail2ban \
    cron \
    logrotate

# Configurar timezone
log "🕐 Configurando timezone..."
timedatectl set-timezone America/Sao_Paulo

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

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Configurar logrotate
log "📋 Configurando logrotate..."
cat > /etc/logrotate.d/kontrollapro << EOF
/opt/kontrollapro/nginx/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        docker-compose -f /opt/kontrollapro/docker-compose.prod.yml restart nginx
    endscript
}
EOF

# Configurar swap (se necessário)
log "💾 Configurando swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Configurar limites do sistema
log "⚙️ Configurando limites do sistema..."
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# Configurar sysctl
log "🔧 Configurando sysctl..."
cat >> /etc/sysctl.conf << EOF
# Network optimizations
net.core.somaxconn = 65536
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_keepalive_probes = 5

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sysctl -p

# Criar usuário para aplicação
log "👤 Criando usuário para aplicação..."
if ! id "kontrolla" &>/dev/null; then
    useradd -r -s /bin/false -d /opt/kontrollapro kontrolla
fi

# Configurar SSH
log "🔐 Configurando SSH..."
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl restart ssh

# Configurar cron para limpeza
log "🧹 Configurando limpeza automática..."
cat > /etc/cron.daily/kontrollapro-cleanup << EOF
#!/bin/bash
# Limpar logs antigos
find /var/log -name "*.log" -mtime +30 -delete
find /var/log -name "*.gz" -mtime +30 -delete

# Limpar cache do Docker
docker system prune -f

# Limpar pacotes órfãos
apt autoremove -y
apt autoclean
EOF

chmod +x /etc/cron.daily/kontrollapro-cleanup

# Configurar monitoramento básico
log "📊 Configurando monitoramento..."
apt install -y htop iotop nethogs

# Criar script de status
cat > /usr/local/bin/kontrolla-status << 'EOF'
#!/bin/bash
echo "=== KontrollaPro Status ==="
echo "Data: $(date)"
echo "Uptime: $(uptime)"
echo ""
echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Disk Usage ==="
df -h
echo ""
echo "=== Memory Usage ==="
free -h
echo ""
echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)"
EOF

chmod +x /usr/local/bin/kontrolla-status

log "✅ Configuração do servidor concluída!"
log "🔧 Para verificar status: kontrolla-status"
log "📋 Próximo passo: Execute o script de deploy"
