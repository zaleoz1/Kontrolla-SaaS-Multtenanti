#!/bin/bash

# Script para limpar containers, volumes e imagens do KontrollaPro

echo "🧹 Limpando KontrollaPro..."

# Parar e remover containers
echo "🛑 Parando e removendo containers..."
docker-compose down

# Remover volumes
echo "🗑️ Removendo volumes..."
docker-compose down -v

# Remover imagens
echo "🗑️ Removendo imagens..."
docker-compose down --rmi all

# Remover redes
echo "🗑️ Removendo redes..."
docker network prune -f

# Remover volumes órfãos
echo "🗑️ Removendo volumes órfãos..."
docker volume prune -f

echo "✅ Limpeza concluída!"
echo ""
echo "📝 Para reconstruir tudo:"
echo "   ./scripts/docker-start.sh"
