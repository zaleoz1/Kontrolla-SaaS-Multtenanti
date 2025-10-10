#!/bin/bash

# =========================================================================
# KONTROLLAPRO - SCRIPT DE DEPLOY PARA VPS
# =========================================================================
# Domínio: kontrollapro.com.br
# IP: 207.58.174.116

set -e  # Exit on any error

# =====================================================
# CONFIGURAÇÕES
# =====================================================
VPS_IP="207.58.174.116"
VPS_USER="root"
VPS_PORT="22"
DOMAIN="kontrollapro.com.br"
REPO_URL="https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git"
PROJECT_DIR="/opt/kontrollapro"
BACKUP_DIR="/opt/kontrollapro-backup"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================
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

# =====================================================
# VERIFICAR CONECTIVIDADE
# =====================================================
check_connectivity() {
    log "🔍 Verificando conectividade com o VPS..."
    
    if ! ping -c 1 $VPS_IP &> /dev/null; then
        error "❌ Não foi possível conectar ao VPS $VPS_IP"
    fi
    
    log "✅ VPS acessível"
}

# =====================================================
# EXECUTAR COMANDO NO VPS
# =====================================================
run_remote() {
    local command="$1"
    local description="$2"
    
    log "$description"
    ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_IP "$command"
}

# =====================================================
# UPLOAD DE ARQUIVOS
# =====================================================
upload_file() {
    local local_path="$1"
    local remote_path="$2"
    local description="$3"
    
    log "$description"
    scp -o StrictHostKeyChecking=no -P $VPS_PORT "$local_path" "$VPS_USER@$VPS_IP:$remote_path"
}

# =====================================================
# PREPARAR VPS
# =====================================================
prepare_vps() {
    log "🚀 Preparando VPS para o KontrollaPro..."
    
    # Atualizar sistema
    run_remote "apt update && apt upgrade -y" "📦 Atualizando sistema"
    
    # Instalar dependências
    run_remote "apt install -y curl git docker.io docker-compose nginx certbot python3-certbot-nginx ufw" "📦 Instalando dependências"
    
    # Configurar Docker
    run_remote "systemctl enable docker && systemctl start docker" "🐳 Configurando Docker"
    run_remote "usermod -aG docker $VPS_USER" "👤 Configurando usuário Docker"
    
    # Configurar firewall
    run_remote "ufw allow ssh && ufw allow http && ufw allow https && ufw --force enable" "🔥 Configurando firewall"
    
    # Criar diretórios
    run_remote "mkdir -p $PROJECT_DIR $BACKUP_DIR /var/lib/kontrolla/{mysql,redis,uploads} /var/log/kontrolla" "📁 Criando diretórios"
}

# =====================================================
# CLONAR REPOSITÓRIO
# =====================================================
clone_repository() {
    log "📥 Clonando repositório..."
    
    run_remote "cd $PROJECT_DIR && git clone $REPO_URL ." "🌀 Clonando código"
}

# =====================================================
# CONFIGURAR SSL
# =====================================================
setup_ssl() {
    log "🔒 Configurando SSL com Let's Encrypt..."
    
    # Parar nginx temporariamente
    run_remote "systemctl stop nginx" "⏹️ Parando Nginx"
    
    # Gerar certificado SSL
    run_remote "certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN" "🔐 Gerando certificado SSL"
    
    # Criar diretório SSL para Docker
    run_remote "mkdir -p $PROJECT_DIR/ssl" "📁 Criando diretório SSL"
    
    # Copiar certificados para o projeto
    run_remote "cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $PROJECT_DIR/ssl/cert.pem" "📋 Copiando certificado"
    run_remote "cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $PROJECT_DIR/ssl/key.pem" "🔑 Copiando chave privada"
    
    # Configurar renovação automática
    run_remote "echo '0 3 * * * /usr/bin/certbot renew --quiet && docker-compose -f $PROJECT_DIR/docker-compose.prod.yml restart nginx' | crontab -" "⏰ Configurando renovação automática"
}

# =====================================================
# CONFIGURAR APLICAÇÃO
# =====================================================
setup_application() {
    log "⚙️ Configurando aplicação..."
    
    # Copiar arquivo de configuração de produção
    run_remote "cp $PROJECT_DIR/.env.production $PROJECT_DIR/.env" "📋 Configurando variáveis de ambiente"
    
    # Dar permissões corretas
    run_remote "chmod +x $PROJECT_DIR/scripts/*.sh" "🔧 Configurando permissões"
    
    # Configurar MySQL
    run_remote "mkdir -p $PROJECT_DIR/mysql" "📁 Criando diretório MySQL"
    upload_file "mysql/my.cnf" "$PROJECT_DIR/mysql/my.cnf" "📋 Enviando configuração MySQL"
    
    # Configurar Redis
    run_remote "mkdir -p $PROJECT_DIR/redis" "📁 Criando diretório Redis"
    upload_file "redis/redis.conf" "$PROJECT_DIR/redis/redis.conf" "📋 Enviando configuração Redis"
}

# =====================================================
# BUILD E DEPLOY
# =====================================================
build_and_deploy() {
    log "🏗️ Fazendo build e deploy da aplicação..."
    
    # Build do frontend para produção
    run_remote "cd $PROJECT_DIR/Frontend && npm install && npm run build" "⚛️ Build do Frontend"
    
    # Build dos containers
    run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml build" "🐳 Build dos containers"
    
    # Iniciar aplicação
    run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml up -d" "🚀 Iniciando aplicação"
}

# =====================================================
# VERIFICAR DEPLOY
# =====================================================
verify_deployment() {
    log "🔍 Verificando deploy..."
    
    # Aguardar serviços iniciarem
    sleep 30
    
    # Verificar status dos containers
    run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml ps" "📊 Status dos containers"
    
    # Testar conectividade
    if curl -f -s "https://$DOMAIN/health" > /dev/null; then
        log "✅ Aplicação está funcionando!"
        log "🌐 Acesse: https://$DOMAIN"
    else
        error "❌ Aplicação não está respondendo"
    fi
}

# =====================================================
# BACKUP
# =====================================================
create_backup() {
    if [ -d "$BACKUP_DIR" ]; then
        log "💾 Criando backup..."
        run_remote "tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/lib/kontrolla ." "📦 Backup criado"
    fi
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================
main() {
    log "🚀 Iniciando deploy do KontrollaPro no VPS..."
    log "📍 Domínio: $DOMAIN"
    log "📍 IP: $VPS_IP"
    
    check_connectivity
    
    # Criar backup se já existir instalação
    create_backup
    
    prepare_vps
    clone_repository
    setup_ssl
    setup_application
    build_and_deploy
    verify_deployment
    
    log "🎉 Deploy concluído com sucesso!"
    log "🌐 Acesse sua aplicação em: https://$DOMAIN"
    log "📊 Monitoramento: https://$DOMAIN/health"
}

# =====================================================
# EXECUTAR SCRIPT
# =====================================================
case "${1:-}" in
    "prepare")
        check_connectivity
        prepare_vps
        ;;
    "deploy")
        check_connectivity
        build_and_deploy
        verify_deployment
        ;;
    "ssl")
        check_connectivity
        setup_ssl
        ;;
    "backup")
        check_connectivity
        create_backup
        ;;
    *)
        main
        ;;
esac