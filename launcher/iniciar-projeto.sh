#!/usr/bin/env bash
# DG Motos — inicia o dev server em segundo plano e abre o navegador.
cd "$(dirname "$0")/.." || exit 1

if [ ! -d node_modules ]; then
  echo "[DG Motos] Primeira execução: instalando dependências..."
  npm install
fi

echo "[DG Motos] Iniciando servidor de desenvolvimento em segundo plano..."
nohup npm run dev >/dev/null 2>&1 &

echo "[DG Motos] Aguardando o servidor subir..."
sleep 5

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:5173
elif command -v open >/dev/null 2>&1; then
  open http://localhost:5173
else
  echo "[DG Motos] Abra manualmente: http://localhost:5173"
fi

echo "[DG Motos] Servidor rodando em http://localhost:5173 (Ctrl+C não encerra; use: taskkill //F //IM node.exe)"
