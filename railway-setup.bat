@echo off
REM ===========================================
REM Script de Setup Automático para Railway
REM KontrollaPro SaaS
REM ===========================================

echo 🚀 Iniciando setup do KontrollaPro no Railway...

REM Verificar se Railway CLI está instalado
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI não encontrado. Instalando...
    npm install -g @railway/cli
)

REM Verificar se está logado no Railway
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Faça login no Railway:
    railway login
)

echo 📦 Instalando dependências...
call npm run install:all

echo 🗄️ Configurando banco de dados...
echo ⚠️  Certifique-se de ter um banco MySQL configurado no Railway
echo 📝 Variáveis necessárias:
echo    - DB_HOST
echo    - DB_PORT
echo    - DB_USER
echo    - DB_PASSWORD
echo    - DB_NAME

echo 🔧 Executando migrações...
railway run npm run migrate

echo 🌱 Executando seed (dados de exemplo)...
railway run npm run seed

echo 🏗️ Fazendo build do frontend...
cd Frontend
call npm run build
cd ..

echo 🚀 Deploy realizado com sucesso!
echo 🌐 Acesse sua aplicação no Railway Dashboard
echo 📊 Health check: https://seu-dominio.railway.app/api/health

echo ✅ Setup concluído!
pause
