#!/bin/bash

# Script de Deploy para Integrator Host - KontrollaPro
# Este script automatiza o processo de deploy usando o domínio do Integrator Host

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    KontrollaPro Deploy                      ║"
echo "║              Sistema SaaS Multitenanti                       ║"
echo "║                    Integrator Host                           ║"
echo "║              vps6150.panel.icontainer.run                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

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

# Verificar argumentos
if [ $# -lt 1 ]; then
    error "Uso: $0 <email>"
    echo "Exemplo: $0 admin@seudominio.com"
fi

EMAIL=$1
DOMAIN="vps6150.panel.icontainer.run"

log "Iniciando deploy do KontrollaPro para $DOMAIN..."

# 1. Configurar servidor
log "1/7 - Configurando servidor..."
if [ ! -f "/usr/local/bin/docker-compose" ]; then
    log "Configurando servidor pela primeira vez..."
    chmod +x scripts/setup-server.sh
    ./scripts/setup-server.sh
else
    log "Servidor já configurado, pulando configuração inicial..."
fi

# 2. Clonar repositório se necessário
log "2/7 - Preparando código fonte..."
if [ ! -d "/opt/kontrollapro" ]; then
    log "Clonando repositório..."
    cd /opt
    git clone https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git kontrollapro
    cd kontrollapro
else
    log "Atualizando código fonte..."
    cd /opt/kontrollapro
    git pull
fi

# 3. Configurar variáveis de ambiente
log "3/7 - Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    log "Criando arquivo de ambiente..."
    cp env.production .env
    
    # Gerar senhas seguras
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Atualizar arquivo .env
    sed -i "s/KontrollaPro2024!Secure/$DB_PASSWORD/g" .env
    sed -i "s/KontrollaPro_JWT_Secret_2024_Ultra_Secure_Key_Production/$JWT_SECRET/g" .env
    sed -i "s/https:\/\/vps6150.panel.icontainer.run/https:\/\/$DOMAIN/g" .env
    
    log "Arquivo .env criado com senhas seguras geradas automaticamente"
    warning "IMPORTANTE: Configure suas credenciais de email, Cloudinary e Google OAuth no arquivo .env"
    warning "Arquivo localizado em: /opt/kontrollapro/.env"
else
    log "Arquivo .env já existe, mantendo configurações..."
fi

# 4. Configurar domínio no Nginx
log "4/7 - Configurando Nginx..."
sed -i "s/vps6150.panel.icontainer.run/$DOMAIN/g" nginx/conf.d/kontrolla.conf
log "Domínio $DOMAIN configurado no Nginx"

# 5. Deploy da aplicação
log "5/7 - Fazendo deploy da aplicação..."
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 6. Configurar SSL
log "6/7 - Configurando SSL..."
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh $DOMAIN $EMAIL

# 7. Verificar deploy
log "7/7 - Verificando deploy..."

# Aguardar serviços ficarem prontos
sleep 30

# Verificar se a aplicação está funcionando
if curl -f https://$DOMAIN > /dev/null 2>&1; then
    log "✅ Deploy concluído com sucesso!"
    log "🌐 Aplicação disponível em: https://$DOMAIN"
    log "📊 API disponível em: https://$DOMAIN/api"
    log "🔧 Painel admin em: https://$DOMAIN/admin"
else
    warning "⚠️  Aplicação pode não estar funcionando corretamente"
    warning "Verifique os logs: docker-compose -f docker-compose.prod.yml logs"
fi

# Mostrar informações importantes
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    DEPLOY CONCLUÍDO                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log "📋 Informações importantes:"
info "• URL da aplicação: https://$DOMAIN"
info "• Arquivo de configuração: /opt/kontrollapro/.env"
info "• Logs da aplicação: docker-compose -f docker-compose.prod.yml logs"
info "• Reiniciar aplicação: docker-compose -f docker-compose.prod.yml restart"
info "• Backup automático: configurado para 2h da manhã"

log "🔧 Próximos passos:"
info "1. Configure suas credenciais no arquivo .env"
info "2. Teste a aplicação em https://$DOMAIN"
info "3. Monitore os logs regularmente"

log "📞 Suporte:"
info "• Painel ICP: https://vps6150.panel.icontainer.run:2090/admin"
info "• Documentação: DEPLOY-GUIDE.md"
info "• GitHub: https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti"

log "🎉 Deploy do KontrollaPro concluído com sucesso!"
log "🌐 Acesse: https://$DOMAIN"
