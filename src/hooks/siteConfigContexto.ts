import { createContext, use } from 'react'
import type { ConfigLoja } from '../lib/configLoja'

/**
 * Configuração da loja compartilhada pela vitrine.
 *
 * O provedor lê o banco uma única vez; todos os componentes que precisam
 * do contato/endereço/horários consomem o mesmo estado. Sem isso, cada
 * `useSiteConfig` virava uma consulta própria a `site_settings`.
 *
 * Fica num arquivo só de contexto/hook (sem componente) para não
 * atrapalhar o Fast Refresh do Vite.
 */

export interface EstadoSiteConfig {
  config: ConfigLoja
  carregando: boolean
  doBanco: boolean
}

export const SiteConfigContexto = createContext<EstadoSiteConfig | null>(null)

export function useSiteConfig(): EstadoSiteConfig {
  const ctx = use(SiteConfigContexto)
  if (!ctx) throw new Error('useSiteConfig precisa estar dentro do <SiteConfigProvider>')
  return ctx
}
