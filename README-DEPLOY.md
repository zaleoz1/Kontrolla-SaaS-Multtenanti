# 🚀 KontrollaPro - Deploy no Integrator Host

Sistema SaaS Multitenanti completo com Frontend React, Backend Node.js, MySQL e Redis, otimizado para produção no Integrator Host.

## ⚡ Deploy Rápido (Recomendado)

Para fazer o deploy completo em uma única execução:

```bash
# Conectar ao servidor
ssh root@207.58.174.116

# Baixar e executar o script de deploy rápido
curl -O https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/scripts/quick-deploy.sh
chmod +x quick-deploy.sh
./quick-deploy.sh seudominio.com seu-email@dominio.com
```

## 📋 Pré-requisitos

- ✅ Servidor VPS Integrator Host (AlmaLinux 9)
- ✅ Acesso SSH como root
- ✅ Domínio configurado
- ✅ Credenciais de email, Cloudinary e Google OAuth

## 🛠️ Configuração Manual

Se preferir configurar manualmente:

### 1. Conectar ao Servidor

```bash
ssh root@207.58.174.116
# Senha: ny59QZejCNOX7HZ4
```

### 2. Configurar Servidor

```bash
# Baixar script de configuração
curl -O https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 3. Clonar Repositório

```bash
cd /opt
git clone https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git kontrollapro
cd kontrollapro
```

### 4. Configurar Ambiente

```bash
# Copiar arquivo de ambiente
cp env.production .env

# Editar configurações
nano .env
```

**Configure as seguintes variáveis:**

```bash
# Banco de dados
DB_PASSWORD=sua_senha_super_segura
MYSQL_ROOT_PASSWORD=sua_senha_super_segura

# Autenticação
JWT_SECRET=sua_chave_jwt_super_segura

# Email (Gmail)
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua_senha_app_gmail

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# Domínio
CORS_ORIGIN=https://seudominio.com
```

### 5. Deploy da Aplicação

```bash
# Executar deploy
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 6. Configurar SSL

```bash
# Configurar SSL com Let's Encrypt
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh seudominio.com seu-email@dominio.com
```

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

### Backup e Restore

```bash
# Backup manual
/usr/local/bin/kontrolla-backup.sh

# Restore do banco
docker exec -i kontrolla-mysql-prod mysql -u root -p kontrollapro < backup.sql
```

### Monitoramento

```bash
# Verificar saúde dos serviços
curl -f https://seudominio.com/health

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f backend

# Verificar uso de recursos
docker stats
```

## 📊 Estrutura do Projeto

```
KontrollaPro/
├── Backend/                 # API Node.js
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares
│   │   ├── services/       # Serviços
│   │   └── database/       # Configuração do banco
│   ├── Dockerfile          # Container do backend
│   └── package.json
├── Frontend/               # Interface React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/         # Páginas
│   │   └── hooks/         # Custom hooks
│   ├── Dockerfile          # Container do frontend
│   └── package.json
├── nginx/                  # Configuração do Nginx
│   ├── nginx.conf
│   └── conf.d/
├── scripts/                # Scripts de deploy
│   ├── deploy.sh
│   ├── setup-server.sh
│   ├── ssl-setup.sh
│   └── quick-deploy.sh
├── docker-compose.prod.yml  # Orquestração dos containers
└── env.production          # Variáveis de ambiente
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
- ✅ Ciphers seguros

### Backup Automático

- ✅ Backup diário às 2h da manhã
- ✅ Retenção de 7 dias
- ✅ Backup do banco e arquivos

## 📈 Monitoramento

### Health Checks

- ✅ Backend: `http://localhost:3000/health`
- ✅ Frontend: `http://localhost:80`
- ✅ MySQL: `mysqladmin ping`
- ✅ Redis: `redis-cli ping`

### Logs

- ✅ Logs centralizados
- ✅ Rotação automática
- ✅ Níveis de log configurados

## 🚨 Solução de Problemas

### Container não inicia

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs nome_do_container

# Verificar status
docker ps -a

# Reiniciar container específico
docker-compose -f docker-compose.prod.yml restart nome_do_container
```

### Banco de dados não conecta

```bash
# Verificar se MySQL está rodando
docker exec kontrolla-mysql-prod mysql -u root -p -e "SHOW DATABASES;"

# Verificar logs do MySQL
docker-compose -f docker-compose.prod.yml logs mysql
```

### SSL não funciona

```bash
# Verificar certificados
certbot certificates

# Renovar manualmente
certbot renew

# Verificar configuração do Nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

### Aplicação não carrega

```bash
# Verificar se todos os containers estão rodando
docker-compose -f docker-compose.prod.yml ps

# Verificar logs do Nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Verificar conectividade
curl -I https://seudominio.com
```

## 📞 Suporte

### Integrator Host

- **Painel ICP**: https://vps6150.panel.icontainer.run:2090/admin
- **Usuário**: vps6150
- **Senha**: kiu07SGHExnMt

### Documentação

- **Guia Completo**: [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md)
- **GitHub**: https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti
- **Issues**: https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti/issues

## 🎯 Checklist de Deploy

- [ ] Servidor configurado
- [ ] Repositório clonado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio apontando para o servidor
- [ ] SSL configurado
- [ ] Aplicação rodando
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Testes realizados

## 📝 Notas Importantes

1. **Nunca altere a senha do root** sem consultar o suporte
2. **Sempre faça backup** antes de grandes mudanças
3. **Monitore os logs** regularmente
4. **Mantenha o sistema atualizado** para segurança
5. **Configure alertas** para monitoramento

---

**🎉 Sua aplicação estará disponível em: https://seudominio.com**

Para mais informações, consulte a documentação completa em [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md).
