@echo off
REM =========================================================================
REM KONTROLLAPRO - SCRIPT DE DEPLOY PARA VPS (WINDOWS)
REM =========================================================================

echo 🚀 KontrollaPro - Deploy para VPS
echo ================================
echo.
echo Dominio: vps6150.panel.icontainer.run
echo IP: 207.58.174.116
echo.

REM Verificar se o SSH está disponível
ssh -V >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ SSH não está disponível. Instale o OpenSSH ou use Git Bash.
    echo.
    echo Alternativas:
    echo 1. Use o Git Bash que vem com o Git for Windows
    echo 2. Use o WSL (Windows Subsystem for Linux)
    echo 3. Instale o OpenSSH Client via Windows Features
    pause
    exit /b 1
)

echo 🔍 Verificando conectividade...
ping -n 1 207.58.174.116 >nul
if %errorlevel% neq 0 (
    echo ❌ Não foi possível conectar ao VPS
    pause
    exit /b 1
)

echo ✅ VPS acessível
echo.

echo 📋 INSTRUÇÕES DE DEPLOY:
echo.
echo 1. Abra o Git Bash ou PowerShell
echo 2. Navegue até esta pasta: cd "%~dp0"
echo 3. Execute: bash scripts/deploy-vps.sh
echo.
echo OU execute os comandos manualmente conforme o arquivo DEPLOY-VPS.md
echo.

echo 🔗 Links úteis após o deploy:
echo - Aplicação: https://vps6150.panel.icontainer.run
echo - Health Check: https://vps6150.panel.icontainer.run/health
echo - API: https://vps6150.panel.icontainer.run/api
echo.

echo ⚠️ IMPORTANTE:
echo - Certifique-se de que o domínio vps6150.panel.icontainer.run
echo   está apontando para o IP 207.58.174.116
echo - O deploy pode levar alguns minutos para concluir
echo - Verifique os logs em caso de problemas
echo.

pause