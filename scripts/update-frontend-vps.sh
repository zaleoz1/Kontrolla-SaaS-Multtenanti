#!/bin/bash

# Script para atualizar frontend no VPS com configuração nginx
echo "🚀 Atualizando frontend KontrollaPro no VPS..."

# Parar e remover container frontend atual
echo "📦 Parando container frontend atual..."
docker stop frontend-nginx 2>/dev/null || true
docker rm frontend-nginx 2>/dev/null || true

# Fazer pull das últimas mudanças
echo "📥 Baixando últimas mudanças..."
git pull origin main

# Rebuild da imagem frontend
echo "🔨 Fazendo rebuild da imagem frontend..."
docker build -t kontrollapro-frontend ./Frontend

# Executar novo container frontend
echo "🚀 Iniciando novo container frontend..."
docker run -d --name frontend-nginx \
  --network kontrollapro_kontrolla-network \
  -p 80:80 \
  kontrollapro-frontend

# Verificar status
echo "✅ Verificando status dos containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Testando conectividade backend..."
curl -s http://localhost:3000/health | head -c 100

echo ""
echo "🌐 Testando proxy frontend..."
curl -s -I http://localhost/health | head -10

echo ""
echo "✨ Atualização frontend concluída!"
echo "🌍 Acesse: http://207.58.174.116"