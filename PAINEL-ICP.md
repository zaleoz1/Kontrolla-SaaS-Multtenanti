# 🎛️ Painel ICP - Integrator Host

## 🔗 Acesso ao Painel

- **URL**: https://vps6150.panel.icontainer.run:2090/admin
- **Usuário**: vps6150
- **Senha**: kiu07SGHExnMt

## 📋 Informações do Servidor

- **IP**: 207.58.174.116
- **Usuário SSH**: root
- **Senha SSH**: ny59QZejCNOX7HZ4
- **Porta SSH**: 22
- **Sistema**: AlmaLinux 9

## 🚀 Deploy Rápido

### 1. Conectar via SSH

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

## 🔧 Recursos do Painel ICP

### Gerenciamento de Servidor
- ✅ Monitoramento de recursos
- ✅ Gerenciamento de usuários
- ✅ Configuração de firewall
- ✅ Backup e restore
- ✅ Logs do sistema

### Configurações de Rede
- ✅ DNS Management
- ✅ SSL/TLS Certificates
- ✅ Port Forwarding
- ✅ Load Balancing

### Monitoramento
- ✅ CPU Usage
- ✅ Memory Usage
- ✅ Disk Usage
- ✅ Network Traffic
- ✅ Service Status

## 📊 Monitoramento da Aplicação

### Verificar Status dos Containers

```bash
# Via SSH
docker-compose -f docker-compose.prod.yml ps

# Via painel ICP
# Acesse: https://vps6150.panel.icontainer.run:2090/admin
# Vá em "System Information" > "Running Processes"
```

### Ver Logs da Aplicação

```bash
# Via SSH
docker-compose -f docker-compose.prod.yml logs -f

# Via painel ICP
# Acesse: https://vps6150.panel.icontainer.run:2090/admin
# Vá em "Logs" > "System Logs"
```

## 🔒 Configurações de Segurança

### Firewall
- ✅ Porta 22 (SSH) - Aberta
- ✅ Porta 80 (HTTP) - Aberta
- ✅ Porta 443 (HTTPS) - Aberta
- ✅ Porta 3000 (Backend) - Interna

### SSL/TLS
- ✅ Certificado Let's Encrypt configurado
- ✅ Renovação automática
- ✅ HSTS habilitado

## 📈 Backup e Restore

### Backup Automático
- ✅ Backup diário às 2h da manhã
- ✅ Retenção de 7 dias
- ✅ Backup do banco e arquivos

### Backup Manual

```bash
# Via SSH
/usr/local/bin/kontrolla-backup.sh

# Via painel ICP
# Acesse: https://vps6150.panel.icontainer.run:2090/admin
# Vá em "Backup" > "Create Backup"
```

## 🚨 Solução de Problemas

### Container não inicia

```bash
# Via SSH
docker-compose -f docker-compose.prod.yml logs nome_do_container

# Via painel ICP
# Acesse: https://vps6150.panel.icontainer.run:2090/admin
# Vá em "System Information" > "Running Processes"
```

### Banco de dados não conecta

```bash
# Via SSH
docker exec kontrolla-mysql-prod mysql -u root -p -e "SHOW DATABASES;"

# Via painel ICP
# Acesse: https://vps6150.panel.icontainer.run:2090/admin
# Vá em "Database" > "MySQL"
```

### SSL não funciona

```bash
# Via SSH
certbot certificates
certbot renew

# Via painel ICP
# Acesse: https://vps6150.panel.icontainer.run:2090/admin
# Vá em "SSL/TLS" > "Manage Certificates"
```

## 📞 Suporte

### Integrator Host
- **Painel ICP**: https://vps6150.panel.icontainer.run:2090/admin
- **Usuário**: vps6150
- **Senha**: kiu07SGHExnMt
- **Suporte**: Via ticket no painel

### Documentação
- **Guia Completo**: [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md)
- **Instruções**: [INSTRUCOES-DEPLOY.md](INSTRUCOES-DEPLOY.md)
- **GitHub**: https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti

## 🎯 Checklist de Deploy

- [ ] Acessar painel ICP
- [ ] Verificar recursos do servidor
- [ ] Conectar via SSH
- [ ] Executar script de deploy
- [ ] Configurar credenciais
- [ ] Testar aplicação
- [ ] Configurar backup
- [ ] Configurar monitoramento

## 🎉 Deploy Concluído!

Sua aplicação estará disponível em:

- **🌐 Frontend**: https://seudominio.com
- **🔌 API**: https://seudominio.com/api
- **⚙️ Admin**: https://seudominio.com/admin

---

**📝 Nota**: Use o painel ICP para monitoramento e gerenciamento do servidor, e o SSH para deploy e configuração da aplicação.
