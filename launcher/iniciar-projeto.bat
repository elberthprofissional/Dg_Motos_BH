@echo off
setlocal
title DG Motos - Launcher

cd /d "%~dp0.."

echo ============================================
echo   DG MOTOS - INICIAR PROJETO
echo ============================================
echo.

if not exist "node_modules\" (
  echo [DG Motos] Primeira execucao: instalando dependencias...
  call npm install
  echo.
)

echo [DG Motos] Iniciando servidor de desenvolvimento em segundo plano...
start "DG Motos - Dev Server" cmd /k "npm run dev"

echo [DG Motos] Aguardando o servidor subir...
timeout /t 5 /nobreak >nul

start "" http://localhost:5173

echo.
echo [DG Motos] Servidor rodando em segundo plano.
echo [DG Motos] Pagina aberta no navegador: http://localhost:5173
echo [DG Motos] As alteracoes no codigo aparecem automaticamente (hot reload).
echo [DG Motos] Para encerrar, feche a janela "DG Motos - Dev Server".
echo.
pause
