@echo off
REM Script para iniciar o KontrollaPro com Docker (Windows)

echo 🚀 Iniciando KontrollaPro com Docker...

REM Verificar se o Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não está instalado. Por favor, instale o Docker primeiro.
    pause
    exit /b 1
)

REM Verificar se o Docker Compose está instalado
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro.
    pause
    exit /b 1
)

REM Verificar se o arquivo .env existe
if not exist "docker.env.example" (
    echo ❌ Arquivo docker.env.example não encontrado.
    pause
    exit /b 1
)

REM Copiar arquivo de exemplo se não existir
if not exist ".env" (
    echo 📋 Copiando arquivo de configuração...
    copy docker.env.example .env
    echo ✅ Arquivo .env criado. Configure as variáveis conforme necessário.
)

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down

REM Construir e iniciar containers
echo 🔨 Construindo e iniciando containers...
docker-compose up --build -d

REM Aguardar serviços ficarem prontos
echo ⏳ Aguardando serviços ficarem prontos...
timeout /t 30 /nobreak >nul

REM Verificar status dos serviços
echo 📊 Status dos serviços:
docker-compose ps

echo.
echo ✅ KontrollaPro iniciado com sucesso!
echo.
echo 🌐 Acesse:
echo    Frontend: http://localhost
echo    Backend:  http://localhost:3000
echo    MySQL:    localhost:3306
echo.
echo 📝 Para ver logs:
echo    docker-compose logs -f
echo.
echo 🛑 Para parar:
echo    docker-compose down
echo.
pause
