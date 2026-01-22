@echo off
chcp 65001 >nul
title KONTROLLAPRO - PAINEL INTEGRATOR
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0integrator.ps1"

