import { createContext, useContext } from 'react'
import type { ConfigLoja } from '../lib/configLoja'

/**
 * Contrato do contexto de configuração da loja.
 *
 * Fica num arquivo só de tipos (sem componente) para não atrapalhar o
 * Fast Refresh do Vite, que não funciona quando um arquivo exporta
 * componente e hook ao mesmo tempo.
 */
export interface EstadoSiteConfig {
  /** Config mesclada (banco sobre defaults). Nunca é null. */
  config: ConfigLoja
  /** `true` enquanto o banco ainda não respondeu. */
  carregando: boolean
  /** `true` quando os valores vieram do banco (e não do fallback). */
  doBanco: boolean
}

export const SiteConfigContexto = createContext<EstadoSiteConfig | null>(null)

export function useSiteConfig(): EstadoSiteConfig {
  const ctx = useContext(SiteConfigContexto)
  if (!ctx) throw new Error('useSiteConfig precisa estar dentro do <SiteConfigProvider>')
  return ctx
}
