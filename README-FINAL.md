# 🚀 KontrollaPro - Deploy no Integrator Host

## 📋 Informações do Servidor

- **IP**: 207.58.174.116
- **Usuário SSH**: root
- **Senha SSH**: ny59QZejCNOX7HZ4
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
curl -O https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/scripts/quick-deploy.sh
chmod +x quick-deploy.sh
./quick-deploy.sh seudominio.com seu-email@dominio.com
```

**Substitua:**
- `seudominio.com` pelo seu domínio real
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
./scripts/ssl-setup.sh seudominio.com seu-email@dominio.com
```

## 🔑 Credenciais Necessárias

### Obrigatórias

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

### Opcionais

- **Domínio personalizado** (recomendado)
- **Certificado SSL personalizado**

## 🌐 Configuração do Domínio

### 1. Configurar DNS

No seu provedor de domínio, configure:

```
Tipo: A
Nome: @
Valor: 207.58.174.116

Tipo: A  
Nome: www
Valor: 207.58.174.116
```

### 2. Aguardar Propagação

Aguarde até 24 horas para a propagação do DNS.

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
curl -f https://seudominio.com/health

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
curl -I https://seudominio.com
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
- [ ] Domínio apontando para o servidor
- [ ] SSL configurado
- [ ] Aplicação rodando
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🎉 Deploy Concluído!

Sua aplicação estará disponível em:

- **🌐 Frontend**: https://seudominio.com
- **🔌 API**: https://seudominio.com/api
- **⚙️ Admin**: https://seudominio.com/admin

---

**📝 Nota**: Execute o script `quick-deploy.sh` para fazer o deploy completo automaticamente, ou siga os passos manuais acima.
