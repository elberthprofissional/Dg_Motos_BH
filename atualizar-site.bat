@echo off
title DG Motos - Atualizar site
cd /d "%~dp0"

echo ============================================
echo   DG Motos - Atualizar o site (Google)
echo ============================================
echo.

git add -A
git commit --allow-empty -m "Atualizacao manual do SEO" >nul 2>&1
git push origin main

if errorlevel 1 (
  echo.
  echo [ERRO] Nao deu push. Veja a mensagem acima.
) else (
  echo.
  echo [OK] Site atualizado! O Google e o sitemap
  echo      recebem a versao nova em 1-2 minutos.
)

echo.
pause
