#!/bin/bash

# Script para corrigir problemas do frontend
echo "🔧 Corrigindo problemas do frontend..."

# Parar containers
echo "📦 Parando containers..."
docker-compose -f docker-compose.prod.yml down

# Limpar cache do Docker
echo "🧹 Limpando cache..."
docker system prune -f

# Rebuild do frontend com configurações corretas
echo "🏗️ Rebuild do frontend..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# Iniciar containers
echo "🚀 Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
echo "✅ Verificando status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Testar frontend
echo "🌐 Testando frontend..."
curl -s http://vps6150.panel.icontainer.run/ | head -10

# Testar API
echo "🔌 Testando API..."
curl -s http://vps6150.panel.icontainer.run/api/health

echo "✅ Correções aplicadas com sucesso!"
