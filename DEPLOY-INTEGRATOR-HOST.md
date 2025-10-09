# 🚀 Deploy no Integrator Host - KontrollaPro

## 📋 Informações do Servidor

- **IP**: 207.58.174.116
- **Usuário SSH**: root
- **Senha SSH**: ny59QZejCNOX7HZ4
- **Domínio**: vps6150.panel.icontainer.run
- **Painel ICP**: https://vps6150.panel.icontainer.run:2090/admin
- **Usuário ICP**: vps6150
- **Senha ICP**: kiu07SGHExnMt

## ⚡ Deploy Rápido (Recomendado)

### 1. Conectar ao Servidor

```bash
ssh root@207.58.174.116
# Senha: ny59QZejCNOX7HZ4
```

### 2. Executar Deploy Automático

```bash
# Baixar e executar o script de deploy
curl -O https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/scripts/deploy-integrator.sh
chmod +x deploy-integrator.sh
./deploy-integrator.sh seu-email@dominio.com
```

**Substitua:**
- `seu-email@dominio.com` pelo seu email real

## 🔧 Deploy Manual

### 1. Configurar Servidor

```bash
# Baixar script de configuração
curl -O https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 2. Clonar Repositório

```bash
cd /opt
git clone https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git kontrollapro
cd kontrollapro
```

### 3. Configurar Ambiente

```bash
# Copiar arquivo de ambiente
cp env.production .env

# Editar configurações
nano .env
```

**Configure as seguintes variáveis no arquivo `.env`:**

```bash
# Banco de dados (senhas serão geradas automaticamente)
DB_PASSWORD=sua_senha_super_segura
MYSQL_ROOT_PASSWORD=sua_senha_super_segura

# Autenticação
JWT_SECRET=sua_chave_jwt_super_segura

# Email (Gmail) - OBRIGATÓRIO
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua_senha_app_gmail

# Cloudinary - OBRIGATÓRIO
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret

# Google OAuth - OBRIGATÓRIO
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# Domínio (já configurado)
CORS_ORIGIN=https://vps6150.panel.icontainer.run
```

### 4. Deploy da Aplicação

```bash
# Executar deploy
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 5. Configurar SSL

```bash
# Configurar SSL com Let's Encrypt
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh vps6150.panel.icontainer.run seu-email@dominio.com
```

## 🔑 Credenciais Necessárias

### Obrigatórias para Funcionamento

1. **Gmail SMTP** (para envio de emails)
   - Ative a verificação em 2 etapas
   - Gere uma senha de app
   - Use no campo `EMAIL_PASS`

2. **Cloudinary** (para upload de imagens)
   - Crie conta em [cloudinary.com](https://cloudinary.com)
   - Obtenha as credenciais no dashboard

3. **Google OAuth** (para login social)
   - Acesse [Google Cloud Console](https://console.cloud.google.com)
   - Crie um projeto
   - Ative a Google+ API
   - Crie credenciais OAuth 2.0
   - Configure URL de redirecionamento: `https://vps6150.panel.icontainer.run/api/auth/google/callback`

### Opcionais

- **Certificado SSL personalizado**

## 🌐 Acesso à Aplicação

### URLs da Aplicação

- **🌐 Frontend**: https://vps6150.panel.icontainer.run
- **🔌 API**: https://vps6150.panel.icontainer.run/api
- **⚙️ Admin**: https://vps6150.panel.icontainer.run/admin

### Painel ICP

- **🎛️ Painel**: https://vps6150.panel.icontainer.run:2090/admin
- **Usuário**: vps6150
- **Senha**: kiu07SGHExnMt

## 🔧 Comandos Úteis

### Gerenciar Aplicação

```bash
# Ver status
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar
docker-compose -f docker-compose.prod.yml restart

# Parar
docker-compose -f docker-compose.prod.yml down

# Iniciar
docker-compose -f docker-compose.prod.yml up -d
```

### Backup

```bash
# Backup manual
/usr/local/bin/kontrolla-backup.sh

# Verificar backups
ls -la /opt/backups/kontrollapro/
```

### Monitoramento

```bash
# Verificar saúde
curl -f https://vps6150.panel.icontainer.run/health

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f backend

# Verificar recursos
docker stats
```

## 🚨 Solução de Problemas

### Container não inicia

```bash
# Ver logs do container
docker-compose -f docker-compose.prod.yml logs nome_do_container

# Verificar status
docker ps -a
```

### Banco de dados não conecta

```bash
# Verificar se MySQL está rodando
docker exec kontrolla-mysql-prod mysql -u root -p -e "SHOW DATABASES;"

# Ver logs do MySQL
docker-compose -f docker-compose.prod.yml logs mysql
```

### SSL não funciona

```bash
# Verificar certificados
certbot certificates

# Renovar manualmente
certbot renew

# Verificar configuração
docker-compose -f docker-compose.prod.yml logs nginx
```

### Aplicação não carrega

```bash
# Verificar todos os containers
docker-compose -f docker-compose.prod.yml ps

# Verificar logs do Nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Testar conectividade
curl -I https://vps6150.panel.icontainer.run
```

## 📊 Monitoramento

### Health Checks

- **Backend**: `http://localhost:3000/health`
- **Frontend**: `http://localhost:80`
- **MySQL**: `mysqladmin ping`
- **Redis**: `redis-cli ping`

### Logs

```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Serviço específico
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔒 Segurança

### Firewall Configurado

- ✅ Porta 22 (SSH)
- ✅ Porta 80 (HTTP)
- ✅ Porta 443 (HTTPS)
- ✅ Porta 3000 (Backend - interno)

### SSL/TLS

- ✅ Certificado Let's Encrypt
- ✅ Renovação automática
- ✅ HSTS habilitado

### Backup Automático

- ✅ Backup diário às 2h da manhã
- ✅ Retenção de 7 dias
- ✅ Backup do banco e arquivos

## 📞 Suporte

### Integrator Host

- **Painel ICP**: https://vps6150.panel.icontainer.run:2090/admin
- **Usuário**: vps6150
- **Senha**: kiu07SGHExnMt

### Documentação

- **Guia Completo**: [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md)
- **Instruções**: [INSTRUCOES-DEPLOY.md](INSTRUCOES-DEPLOY.md)
- **Painel ICP**: [PAINEL-ICP.md](PAINEL-ICP.md)
- **GitHub**: https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti

## 🎯 Checklist de Deploy

- [ ] Servidor configurado
- [ ] Repositório clonado
- [ ] Variáveis de ambiente configuradas
- [ ] SSL configurado
- [ ] Aplicação rodando
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🎉 Deploy Concluído!

Sua aplicação estará disponível em:

- **🌐 Frontend**: https://vps6150.panel.icontainer.run
- **🔌 API**: https://vps6150.panel.icontainer.run/api
- **⚙️ Admin**: https://vps6150.panel.icontainer.run/admin

---

**📝 Nota**: Execute o script `deploy-integrator.sh` para fazer o deploy completo automaticamente, ou siga os passos manuais acima.
