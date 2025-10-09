# 🚀 KontrollaPro - Guia de Deploy VPS

## 📋 Informações do Servidor

- **Domínio:** vps6150.panel.icontainer.run
- **IP:** 207.58.174.116
- **Usuário:** root
- **Porta SSH:** 22
- **Repositório:** https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti

## 🛠️ Pré-requisitos

### No seu computador local:
- Git instalado
- SSH client
- Bash (Linux/Mac) ou WSL/Git Bash (Windows)

### No VPS (será instalado automaticamente):
- Docker
- Docker Compose
- Nginx
- Certbot (Let's Encrypt)
- UFW (Firewall)

## 🚀 Deploy Automático

### 1. Clone o repositório localmente:
```bash
git clone https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git
cd Kontrolla-SaaS-Multtenanti
```

### 2. Torne o script executável:
```bash
chmod +x scripts/deploy-vps.sh
```

### 3. Execute o deploy completo:
```bash
./scripts/deploy-vps.sh
```

## 🔧 Deploy Manual (Passo a Passo)

### 1. Conectar ao VPS:
```bash
ssh -p 22 root@207.58.174.116
```

### 2. Preparar o sistema:
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl git docker.io docker-compose nginx certbot python3-certbot-nginx ufw

# Configurar Docker
systemctl enable docker
systemctl start docker
usermod -aG docker root

# Configurar Firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
```

### 3. Clonar o projeto:
```bash
mkdir -p /opt/kontrollapro
cd /opt/kontrollapro
git clone https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git .
```

### 4. Configurar SSL:
```bash
# Parar nginx
systemctl stop nginx

# Gerar certificado
certbot certonly --standalone -d vps6150.panel.icontainer.run --non-interactive --agree-tos --email admin@vps6150.panel.icontainer.run

# Criar diretório SSL
mkdir -p /opt/kontrollapro/ssl

# Copiar certificados
cp /etc/letsencrypt/live/vps6150.panel.icontainer.run/fullchain.pem /opt/kontrollapro/ssl/cert.pem
cp /etc/letsencrypt/live/vps6150.panel.icontainer.run/privkey.pem /opt/kontrollapro/ssl/key.pem

# Configurar renovação automática
echo '0 3 * * * /usr/bin/certbot renew --quiet && docker-compose -f /opt/kontrollapro/docker-compose.prod.yml restart nginx' | crontab -
```

### 5. Configurar aplicação:
```bash
# Criar diretórios de dados
mkdir -p /var/lib/kontrolla/{mysql,redis,uploads}
mkdir -p /var/log/kontrolla

# Copiar configurações
cp /opt/kontrollapro/.env.production /opt/kontrollapro/.env

# Dar permissões
chmod +x /opt/kontrollapro/scripts/*.sh
```

### 6. Build e iniciar:
```bash
cd /opt/kontrollapro

# Build do frontend
cd Frontend && npm install && npm run build -- --mode production
cd ..

# Build e iniciar containers
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Verificação do Deploy

### 1. Verificar status dos containers:
```bash
cd /opt/kontrollapro
docker-compose -f docker-compose.prod.yml ps
```

### 2. Verificar logs:
```bash
# Logs de todos os serviços
docker-compose -f docker-compose.prod.yml logs

# Logs específicos
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs mysql
```

### 3. Testar aplicação:
```bash
# Teste de conectividade
curl -f https://vps6150.panel.icontainer.run/health

# Acessar no navegador
# https://vps6150.panel.icontainer.run
```

## 🔧 Comandos Úteis

### Parar aplicação:
```bash
cd /opt/kontrollapro
docker-compose -f docker-compose.prod.yml down
```

### Reiniciar aplicação:
```bash
cd /opt/kontrollapro
docker-compose -f docker-compose.prod.yml restart
```

### Atualizar aplicação:
```bash
cd /opt/kontrollapro
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Backup manual:
```bash
cd /opt/kontrollapro
./scripts/backup.sh
```

### Ver backups:
```bash
ls -la /opt/kontrollapro/backups/
```

## 📊 Monitoramento

### Status dos serviços:
- **Aplicação:** https://vps6150.panel.icontainer.run
- **Health Check:** https://vps6150.panel.icontainer.run/health
- **API:** https://vps6150.panel.icontainer.run/api

### Logs em tempo real:
```bash
# Todos os serviços
docker-compose -f /opt/kontrollapro/docker-compose.prod.yml logs -f

# Serviço específico
docker-compose -f /opt/kontrollapro/docker-compose.prod.yml logs -f backend
```

### Uso de recursos:
```bash
# Uso de containers
docker stats

# Uso de disco
df -h
du -sh /var/lib/kontrollapro/*

# Uso de memória
free -h
```

## 🛡️ Segurança

### Firewall configurado:
- Porta 22 (SSH)
- Porta 80 (HTTP - redirect para HTTPS)
- Porta 443 (HTTPS)

### SSL/TLS:
- Certificado Let's Encrypt válido
- Renovação automática configurada
- Headers de segurança configurados

### Rate Limiting:
- API: 10 req/s
- Auth: 5 req/min
- Configurado no Nginx

## 🚨 Troubleshooting

### Container não inicia:
```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs [service_name]

# Verificar configurações
docker-compose -f docker-compose.prod.yml config
```

### Problema de SSL:
```bash
# Verificar certificados
ls -la /etc/letsencrypt/live/vps6150.panel.icontainer.run/

# Renovar manualmente
certbot renew --dry-run
```

### Problema de banco:
```bash
# Acessar MySQL
docker exec -it kontrolla-mysql mysql -u root -p

# Ver logs do MySQL
docker logs kontrolla-mysql
```

### Problema de permissões:
```bash
# Corrigir permissões dos dados
chown -R 999:999 /var/lib/kontrollapro/mysql
chown -R 999:999 /var/lib/kontrollapro/redis
chmod -R 755 /var/lib/kontrollapro/uploads
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs dos containers
2. Verificar status dos serviços
3. Consultar este guia
4. Entrar em contato com a equipe de desenvolvimento

---

**🎉 Parabéns! O KontrollaPro está rodando em produção!**

Acesse: https://vps6150.panel.icontainer.run