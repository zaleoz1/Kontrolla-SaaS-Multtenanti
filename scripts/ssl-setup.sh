#!/bin/bash

# Script de Configuração SSL - KontrollaPro
# Este script configura SSL com Let's Encrypt ou certificado personalizado

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

# Verificar se o domínio foi fornecido
if [ -z "$1" ]; then
    error "Uso: $0 <dominio> [email]"
    echo "Exemplo: $0 kontrollapro.com admin@kontrollapro.com"
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

log "Configurando SSL para $DOMAIN..."

# Instalar Certbot
log "Instalando Certbot..."
dnf install -y epel-release
dnf install -y certbot python3-certbot-nginx

# Parar containers temporariamente
log "Parando containers..."
docker-compose -f docker-compose.prod.yml down

# Configurar Nginx temporário para validação
log "Configurando Nginx temporário..."
cat > /etc/nginx/conf.d/temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

# Criar diretório para validação
mkdir -p /var/www/certbot

# Iniciar Nginx
systemctl start nginx
systemctl enable nginx

# Obter certificado SSL
log "Obtendo certificado SSL..."
certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Parar Nginx temporário
systemctl stop nginx
rm -f /etc/nginx/conf.d/temp.conf

# Copiar certificados para o diretório do Docker
log "Copiando certificados..."
mkdir -p ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/ssl-cert-snakeoil.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/ssl-cert-snakeoil.key

# Configurar renovação automática
log "Configurando renovação automática..."
cat > /usr/local/bin/renew-ssl.sh << EOF
#!/bin/bash
# Script de renovação SSL

certbot renew --quiet
if [ \$? -eq 0 ]; then
    # Copiar novos certificados
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/kontrollapro/ssl/ssl-cert-snakeoil.pem
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/kontrollapro/ssl/ssl-cert-snakeoil.key
    
    # Reiniciar containers
    cd /opt/kontrollapro
    docker-compose -f docker-compose.prod.yml restart nginx frontend
    
    echo "\$(date): SSL renovado com sucesso" >> /var/log/ssl-renewal.log
fi
EOF

chmod +x /usr/local/bin/renew-ssl.sh

# Agendar renovação automática
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/renew-ssl.sh") | crontab -

# Atualizar configuração do Nginx com o domínio
log "Atualizando configuração do Nginx..."
sed -i "s/kontrollapro.com/$DOMAIN/g" nginx/conf.d/kontrolla.conf

# Reiniciar containers
log "Reiniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# Verificar se SSL está funcionando
log "Verificando SSL..."
sleep 10

if curl -f https://$DOMAIN > /dev/null 2>&1; then
    log "SSL configurado com sucesso!"
    log "Acesse: https://$DOMAIN"
else
    warning "SSL pode não estar funcionando corretamente. Verifique manualmente."
fi

log "Configuração SSL concluída!"
log "Certificado será renovado automaticamente"
log "Para verificar: certbot certificates"
log "Para renovar manualmente: certbot renew"
