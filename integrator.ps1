# ═══════════════════════════════════════════════════════════════════════════════
#                    KONTROLLAPRO - PAINEL DE GERENCIAMENTO
# ═══════════════════════════════════════════════════════════════════════════════
# Script de gerenciamento do servidor - Windows PowerShell
# ═══════════════════════════════════════════════════════════════════════════════

# Cores para o terminal
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "White"

function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "  ║                                                                ║" -ForegroundColor Magenta
    Write-Host "  ║" -ForegroundColor Magenta -NoNewline
    Write-Host "          🚀 KONTROLLAPRO - PAINEL INTEGRATOR 🚀             " -ForegroundColor Cyan -NoNewline
    Write-Host "║" -ForegroundColor Magenta
    Write-Host "  ║                                                                ║" -ForegroundColor Magenta
    Write-Host "  ║" -ForegroundColor Magenta -NoNewline
    Write-Host "           Sistema de Gerenciamento do Servidor              " -ForegroundColor Yellow -NoNewline
    Write-Host "║" -ForegroundColor Magenta
    Write-Host "  ║" -ForegroundColor Magenta -NoNewline
    Write-Host "                      KontrollaPro Team                        " -ForegroundColor DarkGray -NoNewline
    Write-Host "║" -ForegroundColor Magenta
    Write-Host "  ║                                                                ║" -ForegroundColor Magenta
    Write-Host "  ╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
}

function Show-Menu {
    Write-Host "  ┌────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │                    OPÇÕES PRINCIPAIS                           │" -ForegroundColor DarkGray
    Write-Host "  ├────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 1" -NoNewline -ForegroundColor Green
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  🚀  " -NoNewline
    Write-Host "Deploy Completo" -ForegroundColor White
    Write-Host "              " -NoNewline
    Write-Host "Build e inicia todos os containers" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 2" -NoNewline -ForegroundColor Green
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  📦  " -NoNewline
    Write-Host "Build do Projeto Completo" -ForegroundColor White
    Write-Host "              " -NoNewline
    Write-Host "Build do Frontend + Backend (sem iniciar)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 3" -NoNewline -ForegroundColor Green
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  🎨  " -NoNewline
    Write-Host "Build do Frontend" -ForegroundColor White
    Write-Host "              " -NoNewline
    Write-Host "Apenas build do React/Vite" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 4" -NoNewline -ForegroundColor Green
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  ⚙️   " -NoNewline
    Write-Host "Build do Backend" -ForegroundColor White
    Write-Host "              " -NoNewline
    Write-Host "Apenas build do Node.js/Express" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 5" -NoNewline -ForegroundColor Red
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  ⏸️   " -NoNewline
    Write-Host "Pausar Sistema" -ForegroundColor White
    Write-Host "              " -NoNewline
    Write-Host "Para todos os containers (docker-compose down)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ├────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host "  │                    OPÇÕES EXTRAS                               │" -ForegroundColor DarkGray
    Write-Host "  ├────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 6" -NoNewline -ForegroundColor Cyan
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  📊  " -NoNewline
    Write-Host "Status dos Containers" -ForegroundColor White
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 7" -NoNewline -ForegroundColor Cyan
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  📜  " -NoNewline
    Write-Host "Ver Logs (tempo real)" -ForegroundColor White
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 8" -NoNewline -ForegroundColor Cyan
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  🔄  " -NoNewline
    Write-Host "Reiniciar Sistema" -ForegroundColor White
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 9" -NoNewline -ForegroundColor Cyan
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  🗃️   " -NoNewline
    Write-Host "Executar Migrations do Banco" -ForegroundColor White
    Write-Host ""
    Write-Host "  ├────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host "  │                         GIT                                    │" -ForegroundColor DarkGray
    Write-Host "  ├────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "10" -NoNewline -ForegroundColor Green
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  📥  " -NoNewline
    Write-Host "Git Pull - Atualizar Código" -ForegroundColor White
    Write-Host "              " -NoNewline
    Write-Host "Baixa as últimas alterações do repositório" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ├────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host " 0" -NoNewline -ForegroundColor Yellow
    Write-Host "]" -NoNewline -ForegroundColor DarkGray
    Write-Host "  ❌  " -NoNewline
    Write-Host "Sair" -ForegroundColor White
    Write-Host ""
    Write-Host "  └────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
}

function Show-Loading {
    param([string]$Message)
    Write-Host ""
    Write-Host "  ⏳ " -NoNewline -ForegroundColor Yellow
    Write-Host $Message -ForegroundColor Cyan
    Write-Host ""
}

function Show-Success {
    param([string]$Message)
    Write-Host ""
    Write-Host "  ✅ " -NoNewline -ForegroundColor Green
    Write-Host $Message -ForegroundColor Green
    Write-Host ""
}

function Show-Error {
    param([string]$Message)
    Write-Host ""
    Write-Host "  ❌ " -NoNewline -ForegroundColor Red
    Write-Host $Message -ForegroundColor Red
    Write-Host ""
}

function Wait-ForKey {
    Write-Host ""
    Write-Host "  Pressione qualquer tecla para continuar..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Deploy-Complete {
    Show-Loading "Iniciando Deploy Completo..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose -f docker-compose.prod.yml down 2>$null
    
    # Limpar cache do Docker para resolver problemas de snapshot
    Write-Host ""
    Write-Host "  🧹 Limpando cache do Docker..." -ForegroundColor Yellow
    docker builder prune -f 2>$null
    
    # Remover imagens antigas do projeto
    Write-Host "  🗑️  Removendo imagens antigas..." -ForegroundColor Yellow
    docker rmi kontrolla-backend:latest kontrolla-frontend:latest 2>$null
    
    # Reconstruir sem cache
    Write-Host "  🔨 Reconstruindo imagens..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml build --no-cache --pull
    if ($LASTEXITCODE -eq 0) {
        docker-compose -f docker-compose.prod.yml up -d
        if ($LASTEXITCODE -eq 0) {
            Show-Success "Deploy realizado com sucesso!"
            Write-Host ""
            Write-Host "  🌐 Frontend: " -NoNewline -ForegroundColor Cyan
            Write-Host "http://localhost:80" -ForegroundColor White
            Write-Host "  🔧 Backend:  " -NoNewline -ForegroundColor Cyan
            Write-Host "http://localhost:3000" -ForegroundColor White
            Write-Host "  🗄️  Database: " -NoNewline -ForegroundColor Cyan
            Write-Host "localhost:3307" -ForegroundColor White
        } else {
            Show-Error "Erro ao iniciar os containers!"
        }
    } else {
        Show-Error "Erro durante o build!"
    }
    Wait-ForKey
}

function Build-Project {
    Show-Loading "Iniciando Build do Projeto Completo..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    
    # Build do Frontend
    Write-Host "  🎨 Build do Frontend..." -ForegroundColor Yellow
    Set-Location Frontend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Set-Location ..
        Show-Error "Erro durante o build do Frontend!"
        Wait-ForKey
        return
    }
    Set-Location ..
    
    # Build do Backend
    Write-Host "  ⚙️  Build do Backend..." -ForegroundColor Yellow
    Set-Location Backend
    npm install --production
    if ($LASTEXITCODE -ne 0) {
        Set-Location ..
        Show-Error "Erro durante o build do Backend!"
        Wait-ForKey
        return
    }
    Set-Location ..
    
    Show-Success "Build do projeto completo realizado com sucesso!"
    Wait-ForKey
}

function Build-Frontend {
    Show-Loading "Iniciando Build do Frontend..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Set-Location Frontend
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Build do Frontend realizado com sucesso!"
    } else {
        Show-Error "Erro durante o build do Frontend!"
    }
    Set-Location ..
    Wait-ForKey
}

function Build-Backend {
    Show-Loading "Iniciando Build do Backend..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Set-Location Backend
    npm install --production
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Build do Backend realizado com sucesso!"
    } else {
        Show-Error "Erro durante o build do Backend!"
    }
    Set-Location ..
    Wait-ForKey
}

function Stop-System {
    Show-Loading "Pausando o Sistema..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose -f docker-compose.prod.yml down
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Sistema pausado com sucesso!"
    } else {
        Show-Error "Erro ao pausar o sistema!"
    }
    Wait-ForKey
}

function Show-Status {
    Show-Loading "Verificando Status dos Containers..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host ""
    docker-compose -f docker-compose.prod.yml ps
    Write-Host ""
    Wait-ForKey
}

function Show-Logs {
    Show-Loading "Exibindo Logs (Ctrl+C para sair)..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose -f docker-compose.prod.yml logs -f
}

function Restart-System {
    Show-Loading "Reiniciando o Sistema..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose -f docker-compose.prod.yml restart
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Sistema reiniciado com sucesso!"
    } else {
        Show-Error "Erro ao reiniciar o sistema!"
    }
    Wait-ForKey
}

function Run-Migrations {
    Show-Loading "Executando Migrations do Banco de Dados..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose -f docker-compose.prod.yml exec backend node src/database/migrate.js
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Migrations executadas com sucesso!"
    } else {
        Show-Error "Erro ao executar migrations!"
    }
    Wait-ForKey
}

function Git-Pull {
    Show-Loading "Atualizando código do repositório (git pull)..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host ""
    
    # Verificar se é um repositório git
    try {
        $null = git rev-parse --git-dir 2>$null
    } catch {
        Show-Error "Este diretório não é um repositório Git!"
        Wait-ForKey
        return
    }
    
    # Obter branch atual
    $currentBranch = git branch --show-current 2>$null
    if (-not $currentBranch) {
        $currentBranch = "master"
    }
    Write-Host "  📍 Branch atual: " -NoNewline -ForegroundColor Cyan
    Write-Host $currentBranch -ForegroundColor White
    
    # Verificar se há remote configurado
    $remote = git remote | Select-Object -First 1
    if (-not $remote) {
        $remote = "origin"
    }
    
    Write-Host ""
    Write-Host "  🔗 Remote: " -NoNewline -ForegroundColor Cyan
    Write-Host $remote -ForegroundColor White
    Write-Host ""
    
    # Tentar fazer pull
    $success = $false
    
    # Primeiro tenta pull normal
    git pull 2>$null
    if ($LASTEXITCODE -eq 0) {
        $success = $true
    } else {
        # Se falhar, tenta com origin/branch
        Write-Host "  ⚠️  Tentando pull com ${remote}/${currentBranch}..." -ForegroundColor Yellow
        git pull $remote $currentBranch 2>$null
        if ($LASTEXITCODE -eq 0) {
            $success = $true
        } else {
            # Se ainda falhar, tenta configurar upstream e fazer pull
            Write-Host "  ⚠️  Configurando upstream e tentando novamente..." -ForegroundColor Yellow
            git branch --set-upstream-to="${remote}/${currentBranch}" $currentBranch 2>$null
            git pull 2>$null
            if ($LASTEXITCODE -eq 0) {
                $success = $true
            }
        }
    }
    
    if ($success) {
        Show-Success "Código atualizado com sucesso!"
        Write-Host ""
        Write-Host "  💡 Dica: Execute o Deploy (opção 1) para aplicar as mudanças" -ForegroundColor Yellow
    } else {
        Show-Error "Erro ao atualizar o código!"
        Write-Host ""
        Write-Host "  💡 Dica: Configure o remote manualmente com:" -ForegroundColor Yellow
        Write-Host "     git remote add origin <url-do-repositorio>" -ForegroundColor DarkGray
        Write-Host "     git branch --set-upstream-to=origin/${currentBranch} ${currentBranch}" -ForegroundColor DarkGray
    }
    Wait-ForKey
}

# Loop Principal
do {
    Show-Header
    Show-Menu
    
    Write-Host "  Digite a opção desejada: " -NoNewline -ForegroundColor Yellow
    $choice = Read-Host
    
    switch ($choice) {
        "1" { Deploy-Complete }
        "2" { Build-Project }
        "3" { Build-Frontend }
        "4" { Build-Backend }
        "5" { Stop-System }
        "6" { Show-Status }
        "7" { Show-Logs }
        "8" { Restart-System }
        "9" { Run-Migrations }
        "10" { Git-Pull }
        "0" { 
            Write-Host ""
            Write-Host "  👋 Até logo!" -ForegroundColor Cyan
            Write-Host ""
            break 
        }
        default {
            Show-Error "Opção inválida! Tente novamente."
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne "0")
