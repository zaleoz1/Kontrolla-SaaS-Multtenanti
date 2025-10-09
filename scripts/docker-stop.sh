#!/bin/bash

# Script para parar o KontrollaPro

echo "🛑 Parando KontrollaPro..."

# Parar containers
docker-compose down

# Remover volumes (opcional - descomente se quiser limpar dados)
# echo "🗑️ Removendo volumes..."
# docker-compose down -v

# Remover imagens (opcional - descomente se quiser limpar imagens)
# echo "🗑️ Removendo imagens..."
# docker-compose down --rmi all

echo "✅ KontrollaPro parado com sucesso!"
