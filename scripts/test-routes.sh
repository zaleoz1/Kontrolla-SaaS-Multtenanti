#!/bin/bash

# =========================================================================
# KONTROLLAPRO - SCRIPT DE TESTE DE ROTAS
# =========================================================================

echo "🧪 Testando rotas da API KontrollaPro..."

# Configurações
if [ "$1" = "local" ]; then
    BASE_URL="http://localhost:3000"
    echo "🏠 Testando ambiente local"
elif [ "$1" = "prod" ]; then
    BASE_URL="https://kontrollapro.com.br"
    echo "🌐 Testando ambiente de produção"
else
    echo "❌ Uso: $0 [local|prod]"
    echo "   Exemplo: $0 local"
    echo "   Exemplo: $0 prod"
    exit 1
fi

echo "🔗 URL Base: $BASE_URL"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para testar rota
test_route() {
    local method=$1
    local route=$2
    local expected_status=$3
    local description=$4
    
    echo "🔍 Testando: $description"
    echo "   $method $BASE_URL$route"
    
    response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$route" -o /tmp/response_body)
    http_code=$response
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "   ✅ ${GREEN}OK${NC} - Status: $http_code"
    else
        echo -e "   ❌ ${RED}FALHOU${NC} - Status: $http_code (esperado: $expected_status)"
        if [ -f /tmp/response_body ]; then
            echo "   📄 Resposta:"
            cat /tmp/response_body | head -5
        fi
    fi
    echo ""
}

# Função para testar rota com body
test_route_with_body() {
    local method=$1
    local route=$2
    local body=$3
    local expected_status=$4
    local description=$5
    
    echo "🔍 Testando: $description"
    echo "   $method $BASE_URL$route"
    
    response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$route" \
        -H "Content-Type: application/json" \
        -d "$body" \
        -o /tmp/response_body)
    http_code=$response
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "   ✅ ${GREEN}OK${NC} - Status: $http_code"
    else
        echo -e "   ❌ ${RED}FALHOU${NC} - Status: $http_code (esperado: $expected_status)"
        if [ -f /tmp/response_body ]; then
            echo "   📄 Resposta:"
            cat /tmp/response_body | head -5
        fi
    fi
    echo ""
}

# =====================================================
# TESTES DE ROTAS BÁSICAS
# =====================================================

echo "📋 TESTES DE ROTAS BÁSICAS"
echo "=========================="

test_route "GET" "/" "200" "Rota raiz da API"
test_route "GET" "/health" "200" "Health check"

# =====================================================
# TESTES DE ROTAS DE AUTH
# =====================================================

echo "🔐 TESTES DE ROTAS DE AUTENTICAÇÃO"
echo "=================================="

test_route "GET" "/api/auth" "404" "Rota base auth (deve dar 404)"

# Teste de envio de código de verificação
test_route_with_body "POST" "/api/auth/send-verification-code" \
    '{"email":"teste@exemplo.com"}' \
    "400" \
    "Envio de código de verificação (sem dados completos)"

# =====================================================
# TESTES DE OUTRAS ROTAS DA API
# =====================================================

echo "📊 TESTES DE OUTRAS ROTAS DA API"
echo "==============================="

test_route "GET" "/api/dashboard" "401" "Dashboard (sem autenticação)"
test_route "GET" "/api/produtos" "401" "Produtos (sem autenticação)"
test_route "GET" "/api/clientes" "401" "Clientes (sem autenticação)"
test_route "GET" "/api/vendas" "401" "Vendas (sem autenticação)"

# =====================================================
# TESTES DE ROTAS PÚBLICAS
# =====================================================

echo "🌐 TESTES DE ROTAS PÚBLICAS"
echo "============================"

test_route "GET" "/api/catalogo/publico" "200" "Catálogo público"

# =====================================================
# RESUMO
# =====================================================

echo "📊 TESTE CONCLUÍDO"
echo "=================="
echo "🔗 Verifique os resultados acima"
echo "📋 Se houver falhas, verifique:"
echo "   - Configuração do nginx"
echo "   - Configuração do Docker"
echo "   - Logs do backend"
echo ""
echo "📝 Para ver logs em tempo real:"
echo "   docker compose logs -f backend"
echo ""