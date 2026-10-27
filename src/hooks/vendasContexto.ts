import { createContext, use } from 'react'
import type { ResumoVendas } from '../lib/painel'
import type { Venda, VendaParaSalvar } from '../types'

/**
 * Contrato do contexto de vendas do painel.
 *
 * Fica num arquivo só de contexto/hook (sem componente) para não
 * atrapalhar o Fast Refresh do Vite.
 */
export interface VendasContextoValor {
  vendas: Venda[]
  resumo: ResumoVendas
  carregando: boolean
  erro: string | null
  /** Salva (insere ou corrige) e devolve erro para o diálogo mostrar. */
  salvarVenda: (dados: VendaParaSalvar) => Promise<string | null>
  excluirVenda: (id: string) => Promise<string | null>
  /**
   * Desvincula a venda de uma moto que voltou pro pátio. O registro
   * fica no histórico — só deixa de apontar para a moto ativa.
   */
  desvincularVenda: (motoId: string) => Promise<string | null>
}

export const VendasContexto = createContext<VendasContextoValor | null>(null)

export function useVendas(): VendasContextoValor {
  const ctx = use(VendasContexto)
  if (!ctx) throw new Error('useVendas deve ser usado dentro de VendasProvider')
  return ctx
}
