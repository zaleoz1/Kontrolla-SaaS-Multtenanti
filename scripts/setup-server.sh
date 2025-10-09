#!/bin/bash

# Script de Configuração Inicial do Servidor - Integrator Host
# Este script configura o servidor para hospedar o KontrollaPro

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

log "Configurando servidor para KontrollaPro..."

# Atualizar sistema
log "Atualizando sistema..."
dnf update -y

# Instalar dependências básicas
log "Instalando dependências básicas..."
dnf install -y curl wget git vim htop unzip

# Instalar Docker
log "Instalando Docker..."
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar e habilitar Docker
systemctl start docker
systemctl enable docker

# Adicionar usuário atual ao grupo docker
usermod -aG docker $USER

# Instalar Docker Compose (standalone)
log "Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Configurar firewall
log "Configurando firewall..."
dnf install -y firewalld
systemctl start firewalld
systemctl enable firewalld

# Abrir portas necessárias
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=3306/tcp
firewall-cmd --permanent --add-port=6379/tcp
firewall-cmd --reload

# Configurar SSL
log "Configurando SSL..."
dnf install -y openssl

# Gerar certificado auto-assinado (para desenvolvimento)
mkdir -p /etc/ssl/private
mkdir -p /etc/ssl/certs

if [ ! -f "/etc/ssl/certs/ssl-cert-snakeoil.pem" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/ssl-cert-snakeoil.key \
        -out /etc/ssl/certs/ssl-cert-snakeoil.pem \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=KontrollaPro/CN=localhost"
fi

# Configurar swap (se necessário)
log "Configurando swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Configurar limites do sistema
log "Configurando limites do sistema..."
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# Configurar sysctl para Docker
log "Configurando sysctl..."
cat >> /etc/sysctl.conf << EOF
# Docker optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 3
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sysctl -p

# Configurar logrotate para Docker
log "Configurando logrotate..."
cat > /etc/logrotate.d/docker << EOF
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
dnf install -y htop iotop nethogs

# Criar diretório para aplicação
log "Criando diretório para aplicação..."
mkdir -p /opt/kontrollapro
cd /opt/kontrollapro

# Configurar backup automático
log "Configurando backup automático..."
cat > /usr/local/bin/kontrolla-backup.sh << 'EOF'
#!/bin/bash
# Script de backup para KontrollaPro

BACKUP_DIR="/opt/backups/kontrollapro"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker exec kontrolla-mysql-prod mysqldump -u root -p${MYSQL_ROOT_PASSWORD:-KontrollaPro2024!Secure} kontrollapro > $BACKUP_DIR/database_$DATE.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/kontrollapro/Backend/uploads/

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Backup concluído" >> /var/log/kontrolla-backup.log
EOF

chmod +x /usr/local/bin/kontrolla-backup.sh

# Agendar backup diário às 2h da manhã
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/kontrolla-backup.sh") | crontab -

# Configurar atualizações automáticas de segurança
log "Configurando atualizações automáticas..."
dnf install -y dnf-automatic
systemctl enable --now dnf-automatic.timer

# Configurar NTP
log "Configurando NTP..."
dnf install -y chrony
systemctl start chronyd
systemctl enable chronyd

# Configurar fail2ban (opcional)
log "Configurando fail2ban..."
dnf install -y epel-release
dnf install -y fail2ban

cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/secure
maxretry = 3
EOF

systemctl start fail2ban
systemctl enable fail2ban

log "Configuração do servidor concluída!"
log "Próximos passos:"
log "1. Clone o repositório: git clone https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git"
log "2. Configure o arquivo env.production com suas credenciais"
log "3. Execute o script de deploy: ./scripts/deploy.sh"
log "4. Configure seu domínio para apontar para este servidor"
log "5. Configure SSL com Let's Encrypt ou seu certificado"

info "Reinicie o servidor para aplicar todas as configurações: reboot"
