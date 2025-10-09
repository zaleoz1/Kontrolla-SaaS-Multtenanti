# 🚀 Deploy KontrollaPro no Integrator Host

Este guia detalha como hospedar o sistema KontrollaPro SaaS Multitenanti no Integrator Host.

## 📋 Pré-requisitos

- Servidor VPS com Ubuntu 20.04+ ou Debian 11+
- Acesso SSH como root
- Domínio configurado (opcional, mas recomendado)
- Pelo menos 2GB RAM e 20GB de espaço em disco

## 🔧 Dados de Acesso do Servidor

```
IP SSH: 207.58.174.116
Usuário: root
Porta: 22
Senha: ny59QZejCNOX7HZ4
```

## 📦 Passo a Passo do Deploy

### 1. Conectar ao Servidor

```bash
ssh root@207.58.174.116
```

### 2. Configurar Servidor

```bash
# Baixar e executar script de configuração
wget https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 3. Deploy da Aplicação

```bash
# Baixar e executar script de deploy
wget https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 4. Configurar SSL (Opcional)

```bash
# Para configurar SSL com Let's Encrypt
./ssl-setup.sh seu-dominio.com admin@seu-dominio.com
```

## 🐳 Estrutura dos Containers

O sistema utiliza Docker Compose com os seguintes serviços:

- **MySQL 8.0**: Banco de dados principal
- **Backend Node.js**: API REST
- **Frontend React**: Interface web
- **Redis**: Cache e sessões
- **Nginx**: Proxy reverso e servidor web

## ⚙️ Configurações de Produção

### Variáveis de Ambiente

As configurações estão no arquivo `env.production`:

```bash
# Banco de dados
MYSQL_ROOT_PASSWORD=KontrollaPro2024!Secure
MYSQL_DATABASE=kontrollapro
MYSQL_USER=kontrolla_user
MYSQL_PASSWORD=KontrollaUser2024!Secure

# JWT
JWT_SECRET=KontrollaPro_JWT_Secret_2024_Very_Secure_Key_For_Production_Environment

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=kontrollapro@gmail.com
EMAIL_PASS=kbuz yhdu hdku htaq

# Cloudinary
CLOUDINARY_CLOUD_NAME=dko7s3u3j
CLOUDINARY_API_KEY=754366869343179
CLOUDINARY_API_SECRET=1uMokyb2NhuzefxNt1ocJm3yfAU

# Google OAuth
GOOGLE_CLIENT_ID=505635879481-974u3cn4qac3eeti5i9gjsreo3o315dp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 🛠️ Comandos de Gerenciamento

### Script de Gerenciamento

```bash
# Localização: /opt/kontrollapro/manage.sh

# Iniciar serviços
./manage.sh start

# Parar serviços
./manage.sh stop

# Reiniciar serviços
./manage.sh restart

# Ver logs
./manage.sh logs

# Ver status
./manage.sh status

# Atualizar aplicação
./manage.sh update

# Fazer backup
./manage.sh backup
```

### Comandos Docker Diretos

```bash
# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar um serviço específico
docker-compose -f docker-compose.prod.yml restart backend

# Parar todos os serviços
docker-compose -f docker-compose.prod.yml down

# Iniciar todos os serviços
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Segurança

### Firewall Configurado

- Porta 22 (SSH)
- Porta 80 (HTTP)
- Porta 443 (HTTPS)
- Porta 3000 (Backend - apenas interno)

### Fail2ban

- Proteção contra ataques de força bruta
- Bloqueio automático de IPs suspeitos
- Configurado para SSH e Nginx

### SSL/HTTPS

- Certificados Let's Encrypt
- Renovação automática
- Headers de segurança configurados
- Redirecionamento HTTP → HTTPS

## 📊 Monitoramento

### Scripts de Monitoramento

```bash
# Status geral do sistema
kontrolla-status

# Verificar logs de erro
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep ERROR

# Verificar uso de recursos
htop
df -h
free -h
```

### Logs

- **Nginx**: `/opt/kontrollapro/nginx/logs/`
- **Backend**: `docker-compose -f docker-compose.prod.yml logs backend`
- **Frontend**: `docker-compose -f docker-compose.prod.yml logs frontend`
- **MySQL**: `docker-compose -f docker-compose.prod.yml logs mysql`

## 💾 Backup

### Backup Automático

- Executado diariamente às 2:00 AM
- Backup do banco de dados MySQL
- Backup dos arquivos de upload
- Retenção de 30 dias

### Backup Manual

```bash
# Executar backup manual
/opt/kontrollapro/backup.sh

# Restaurar banco de dados
docker exec -i kontrolla-mysql-prod mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < backup.sql
```

## 🔄 Atualizações

### Atualizar Aplicação

```bash
# Atualizar código
cd /opt/kontrollapro
git pull origin main

# Reconstruir e reiniciar
./manage.sh update
```

### Atualizar Dependências

```bash
# Atualizar dependências do backend
cd /opt/kontrollapro/Backend
docker-compose -f ../docker-compose.prod.yml build backend --no-cache

# Atualizar dependências do frontend
cd /opt/kontrollapro/Frontend
docker-compose -f ../docker-compose.prod.yml build frontend --no-cache
```

## 🚨 Troubleshooting

### Problemas Comuns

#### Container não inicia

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs [nome-do-container]

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Reiniciar container
docker-compose -f docker-compose.prod.yml restart [nome-do-container]
```

#### Banco de dados não conecta

```bash
# Verificar se MySQL está rodando
docker-compose -f docker-compose.prod.yml logs mysql

# Testar conexão
docker exec -it kontrolla-mysql-prod mysql -u root -p
```

#### SSL não funciona

```bash
# Verificar certificados
ls -la /opt/kontrollapro/nginx/ssl/

# Testar renovação
certbot renew --dry-run

# Verificar configuração Nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

### Logs de Debug

```bash
# Ativar logs detalhados
export LOG_LEVEL=debug
docker-compose -f docker-compose.prod.yml restart backend

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## 📞 Suporte

### Informações do Sistema

- **Diretório**: `/opt/kontrollapro`
- **Logs**: `/opt/kontrollapro/nginx/logs/`
- **Backups**: `/opt/kontrollapro/backups/`
- **SSL**: `/opt/kontrollapro/nginx/ssl/`

### Contatos

- **Email**: suporte@kontrollapro.com
- **GitHub**: https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti
- **Documentação**: Este arquivo

## 🎯 Próximos Passos

1. **Configurar domínio** (se ainda não configurado)
2. **Configurar SSL** com `./ssl-setup.sh`
3. **Testar todas as funcionalidades**
4. **Configurar monitoramento adicional** (opcional)
5. **Configurar backup em nuvem** (opcional)

## ✅ Checklist de Deploy

- [ ] Servidor configurado
- [ ] Docker e Docker Compose instalados
- [ ] Aplicação deployada
- [ ] Banco de dados funcionando
- [ ] Frontend acessível
- [ ] API respondendo
- [ ] SSL configurado (se aplicável)
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Testes realizados

---

**🎉 Parabéns! Seu KontrollaPro está rodando em produção!**
