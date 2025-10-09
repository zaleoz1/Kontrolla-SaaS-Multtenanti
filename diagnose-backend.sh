#!/bin/bash

echo "🔍 Diagnosticando problemas do backend..."

# Navegar para o diretório do projeto
cd /opt/kontrollapro || { echo "Erro: Não foi possível navegar para /opt/kontrollapro"; exit 1; }

echo "=== STATUS DOS CONTAINERS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== LOGS DO BACKEND ==="
docker-compose -f docker-compose.prod.yml logs backend --tail=100

echo ""
echo "=== LOGS DO MYSQL ==="
docker-compose -f docker-compose.prod.yml logs mysql --tail=50

echo ""
echo "=== LOGS DO NGINX ==="
docker-compose -f docker-compose.prod.yml logs nginx --tail=50

echo ""
echo "=== TESTE DE CONECTIVIDADE ==="
echo "Testando backend diretamente..."
curl -v http://localhost:3000/health || echo "Backend não responde na porta 3000"

echo ""
echo "Testando nginx..."
curl -v http://localhost/api/health || echo "Nginx não está proxyando corretamente"

echo ""
echo "Testando domínio externo..."
curl -v http://vps6150.panel.icontainer.run/api/health || echo "Domínio externo não está funcionando"

echo ""
echo "=== VERIFICAÇÃO DE REDE ==="
echo "Verificando se a porta 3000 está aberta..."
netstat -tlnp | grep :3000 || echo "Porta 3000 não está aberta"

echo ""
echo "Verificando se a porta 80 está aberta..."
netstat -tlnp | grep :80 || echo "Porta 80 não está aberta"

echo ""
echo "=== VERIFICAÇÃO DE ARQUIVOS ==="
echo "Verificando se o arquivo .env existe..."
ls -la .env || echo "Arquivo .env não encontrado"

echo ""
echo "Verificando conteúdo do .env..."
cat .env | head -10

echo ""
echo "=== VERIFICAÇÃO DE PERMISSÕES ==="
echo "Verificando permissões dos arquivos..."
ls -la Backend/src/server.js
ls -la Backend/Dockerfile.prod

echo ""
echo "=== DIAGNÓSTICO CONCLUÍDO ==="
