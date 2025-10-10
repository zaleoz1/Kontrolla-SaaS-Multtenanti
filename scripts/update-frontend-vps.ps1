# Script PowerShell para atualizar frontend no VPS
Write-Host "Atualizando frontend KontrollaPro no VPS..." -ForegroundColor Green

# Comandos para executar no VPS
$commands = @(
    "cd /opt/kontrollapro",
    "docker stop frontend-nginx 2>/dev/null || true",
    "docker rm frontend-nginx 2>/dev/null || true", 
    "git pull origin main",
    "docker build -t kontrollapro-frontend ./Frontend",
    "docker run -d --name frontend-nginx --network kontrollapro_kontrolla-network -p 80:80 kontrollapro-frontend",
    "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
    "echo ''",
    "echo 'Testando backend:'",
    "curl -s http://localhost:3000/health",
    "echo ''", 
    "echo 'Testando proxy frontend:'",
    "curl -s -I http://localhost/health",
    "echo ''",
    "echo 'Frontend atualizado! Acesse: http://207.58.174.116'"
)

# Criar script temporário
$scriptContent = $commands -join "; "
$tempScript = "temp_update_frontend.sh"

# Conectar via SSH e executar
Write-Host "Conectando ao VPS..." -ForegroundColor Yellow
$sshCommand = "ssh root@207.58.174.116 `"$scriptContent`""

Write-Host "Executando comandos no VPS:" -ForegroundColor Cyan
Write-Host $scriptContent -ForegroundColor Gray

# Executar
Invoke-Expression $sshCommand