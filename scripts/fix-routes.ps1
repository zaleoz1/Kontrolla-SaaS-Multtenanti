# =========================================================================
# KONTROLLAPRO - SCRIPT DE CORREÇÃO DE ROTAS (PowerShell)
# =========================================================================

Write-Host "🔧 KontrollaPro - Correção de Rotas" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está rodando
Write-Host "🐳 Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerStatus = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker está rodando" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker não está rodando" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker não encontrado" -ForegroundColor Red
    exit 1
}

# Função para executar comandos com log
function Invoke-CommandWithLog {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "🔄 $Description..." -ForegroundColor Yellow
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description concluído" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro em: $Description" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erro em: $Description - $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Parar containers
Invoke-CommandWithLog "docker-compose down" "Parando containers"

# Reconstruir apenas o backend
Invoke-CommandWithLog "docker-compose build backend" "Reconstruindo backend"

# Recriar containers
Invoke-CommandWithLog "docker-compose up -d" "Iniciando containers"

# Aguardar containers ficarem prontos
Write-Host "⏳ Aguardando containers ficarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar status dos containers
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Where-Object { $_ -match "kontrolla" }
Write-Host ""

# Testar rotas básicas
Write-Host "🧪 Testando rotas básicas..." -ForegroundColor Cyan
Write-Host ""

$testRoutes = @(
    @{ Route = "http://localhost/health"; Description = "Health check" }
    @{ Route = "http://localhost/"; Description = "Root" }
    @{ Route = "http://localhost/api/auth/send-verification-code"; Description = "API Auth (POST necessário)" }
)

foreach ($test in $testRoutes) {
    Write-Host "🔍 Testando: $($test.Description)" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $test.Route -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
        Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404 -or $statusCode -eq 405 -or $statusCode -eq 401) {
            Write-Host "   ℹ️ Status: $statusCode (esperado para este teste)" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 🔍 Verificar logs do backend:" -ForegroundColor White
Write-Host "   docker-compose logs -f backend" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🔍 Verificar logs do nginx:" -ForegroundColor White
Write-Host "   docker-compose logs -f nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 🧪 Testar rota específica:" -ForegroundColor White
Write-Host "   curl -X POST http://localhost/api/auth/send-verification-code" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 🌐 Abrir aplicação:" -ForegroundColor White
Write-Host "   http://localhost" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Script concluído!" -ForegroundColor Green