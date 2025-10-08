@echo off
REM Script para parar o KontrollaPro (Windows)

echo 🛑 Parando KontrollaPro...

REM Parar containers
docker-compose down

REM Remover volumes (opcional - descomente se quiser limpar dados)
REM echo 🗑️ Removendo volumes...
REM docker-compose down -v

REM Remover imagens (opcional - descomente se quiser limpar imagens)
REM echo 🗑️ Removendo imagens...
REM docker-compose down --rmi all

echo ✅ KontrollaPro parado com sucesso!
pause
