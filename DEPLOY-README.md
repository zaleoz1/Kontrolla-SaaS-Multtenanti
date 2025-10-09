# 🌐 Deploy KontrollaPro para VPS

## ⚡ Deploy Rápido

### Linux/Mac:
```bash
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

### Windows:
```bash
# No Git Bash ou PowerShell:
bash scripts/deploy-vps.sh

# Ou clique duas vezes em:
scripts/deploy-vps.bat
```

## 📋 Informações do Servidor

- **🌐 Domínio:** vps6150.panel.icontainer.run
- **🔗 IP:** 207.58.174.116
- **👤 Usuário:** root
- **🔐 Porta SSH:** 22

## 🔧 Configurações Aplicadas

### ✅ Arquivos de Configuração Criados:

1. **`.env.production`** - Variáveis de ambiente para produção
2. **`docker-compose.prod.yml`** - Stack completa para produção
3. **`nginx/nginx.conf`** - Configuração Nginx principal
4. **`nginx/conf.d/kontrollapro.conf`** - Site específico
5. **`mysql/my.cnf`** - Configuração MySQL otimizada
6. **`redis/redis.conf`** - Configuração Redis
7. **`scripts/deploy-vps.sh`** - Script de deploy automático
8. **`scripts/backup.sh`** - Script de backup automático

### 🐳 Stack Docker:
- **Nginx** - Proxy reverso + SSL
- **Backend** - Node.js + Express
- **MySQL** - Banco de dados
- **Redis** - Cache e sessões
- **Backup** - Serviço de backup automático
- **Watchtower** - Auto-update de containers

### 🔒 Segurança:
- **SSL/TLS** automático via Let's Encrypt
- **Firewall** configurado (UFW)
- **Rate limiting** no Nginx
- **Headers de segurança**
- **Senhas seguras** geradas

### 📊 Monitoramento:
- **Health checks** configurados
- **Logs centralizados**
- **Backup automático** diário
- **Auto-update** de containers

## 🚀 URLs Após Deploy

- **🏠 Aplicação:** https://vps6150.panel.icontainer.run
- **💚 Health Check:** https://vps6150.panel.icontainer.run/health
- **🔌 API:** https://vps6150.panel.icontainer.run/api

## 📚 Documentação Completa

Consulte o arquivo **`DEPLOY-VPS.md`** para:
- Deploy manual passo a passo
- Comandos de manutenção
- Troubleshooting
- Monitoramento
- Backup e restore

## 🆘 Suporte

Em caso de problemas:
1. ✅ Verifique se o domínio está apontando para o IP correto
2. 📋 Consulte os logs: `docker-compose logs`
3. 🔍 Verifique o health check
4. 📖 Consulte a documentação completa

---

**🎉 Deploy configurado com sucesso!**