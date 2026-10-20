import { Navigate } from 'react-router-dom'
import { estaInstalado } from '../hooks/useInstalarPwa'
import { Home } from './Home'

/**
 * ============================================================
 * ENTRADA DO SITE vs. ENTRADA DO APP
 * ============================================================
 * Mesmo site, dois contextos:
 *
 *  - No NAVEGADOR, a rota "/" é a vitrine — o visitante vê o catálogo.
 *  - No APP INSTALADO (standalone), "/" cai no login do painel. Quem
 *    abriu o aplicativo quer gerenciar estoque, não passear pela loja.
 *
 * A checagem é síncrona (`estaInstalado` lê o display-mode), então não
 * há flash da vitrine antes do redirecionamento.
 */
export function Entrada() {
  if (estaInstalado()) return <Navigate to="/admin/login" replace />
  return <Home />
}
