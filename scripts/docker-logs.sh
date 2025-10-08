#!/bin/bash

# Script para visualizar logs do KontrollaPro

echo "📝 Visualizando logs do KontrollaPro..."

# Verificar se há argumentos
if [ $# -eq 0 ]; then
    echo "📋 Uso: $0 [serviço]"
    echo ""
    echo "Serviços disponíveis:"
    echo "  backend   - Logs do backend"
    echo "  frontend  - Logs do frontend"
    echo "  mysql     - Logs do MySQL"
    echo "  redis     - Logs do Redis"
    echo "  all       - Todos os logs"
    echo ""
    echo "Exemplos:"
    echo "  $0 backend"
    echo "  $0 mysql"
    echo "  $0 all"
    exit 1
fi

# Determinar serviço
SERVICE=$1

if [ "$SERVICE" = "all" ]; then
    echo "📝 Mostrando logs de todos os serviços..."
    docker-compose logs -f
else
    echo "📝 Mostrando logs do serviço: $SERVICE"
    docker-compose logs -f $SERVICE
fi
