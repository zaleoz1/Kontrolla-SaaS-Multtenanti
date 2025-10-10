# =========================================================================
# KONTROLLAPRO - INSTRUÇÕES PARA ATUALIZAÇÃO DO VPS
# =========================================================================

Write-Host "🚀 Atualizando VPS com correções de rotas..." -ForegroundColor Green
Write-Host ""

# Informações do VPS
$VPS_IP = "207.58.174.116"
$VPS_USER = "root"
$PROJECT_DIR = "/opt/kontrollapro"

Write-Host "📋 INSTRUÇÕES PARA ATUALIZAÇÃO DO VPS" -ForegroundColor Yellow
Write-Host "====================================="
Write-Host ""

Write-Host "Você está conectado ao VPS. Execute os seguintes comandos:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. 📂 Navegar para o diretório do projeto:" -ForegroundColor White
Write-Host "   cd $PROJECT_DIR" -ForegroundColor Gray
Write-Host ""

Write-Host "2. 🔄 Fazer backup da configuração atual:" -ForegroundColor White
Write-Host "   cp -r nginx/conf.d nginx/conf.d.backup" -ForegroundColor Gray
Write-Host ""

Write-Host "3. 📥 Puxar as atualizações do repositório:" -ForegroundColor White
Write-Host "   git pull origin main" -ForegroundColor Gray
Write-Host ""

Write-Host "4. 🛑 Parar os containers:" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host ""

Write-Host "5. 🔨 Reconstruir o backend com as correções:" -ForegroundColor White
Write-Host "   docker-compose build backend" -ForegroundColor Gray
Write-Host ""

Write-Host "6. 🚀 Iniciar os containers:" -ForegroundColor White
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""

Write-Host "7. 🔍 Verificar se está funcionando:" -ForegroundColor White
Write-Host "   docker-compose logs -f backend" -ForegroundColor Gray
Write-Host ""

Write-Host "8. 🧪 Testar as rotas:" -ForegroundColor White
Write-Host "   curl -X POST http://vps6150.panel.icontainer.run/api/auth/send-verification-code \\" -ForegroundColor Gray
Write-Host "     -H 'Content-Type: application/json' \\" -ForegroundColor Gray
Write-Host "     -d '{\"email\":\"teste@exemplo.com\"}'" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 COMANDOS DE DIAGNÓSTICO" -ForegroundColor Yellow
Write-Host "=========================="
Write-Host ""

Write-Host "📊 Ver status dos containers:" -ForegroundColor White
Write-Host "   docker ps" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 Ver logs específicos:" -ForegroundColor White
Write-Host "   docker-compose logs backend" -ForegroundColor Gray
Write-Host "   docker-compose logs nginx" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 Verificar configuração nginx:" -ForegroundColor White
Write-Host "   docker exec kontrolla-nginx nginx -t" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 Testar conectividade:" -ForegroundColor White
Write-Host "   curl http://localhost/health" -ForegroundColor Gray
Write-Host "   curl http://localhost:3000/health" -ForegroundColor Gray
Write-Host ""

Write-Host "🆘 SOLUÇÃO DE EMERGÊNCIA" -ForegroundColor Red
Write-Host "========================"
Write-Host ""
Write-Host "Se ainda houver problemas, execute:" -ForegroundColor White
Write-Host "   docker-compose down -v" -ForegroundColor Gray
Write-Host "   docker-compose up -d --build" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Após executar, teste novamente as rotas da API!" -ForegroundColor Green