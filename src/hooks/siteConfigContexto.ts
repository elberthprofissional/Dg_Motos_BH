import { useEffect, useMemo, useState } from 'react'
import { EVENTO_CONFIG, lerConfig } from '../lib/configLoja'
import type { ConfigLoja } from '../lib/configLoja'

/**
 * Configuração da loja para a vitrine.
 *
 * Não há busca no banco: a config vem do painel do dono (localStorage)
 * ou, sem ela, dos valores de fábrica em src/data/site.ts — ver
 * src/lib/configLoja.ts.
 *
 * O hook escuta EVENTO_CONFIG para que uma edição salva no painel
 * apareça na vitrine imediatamente, sem recarregar a página.
 */
export interface EstadoSiteConfig {
  config: ConfigLoja
  carregando: boolean
  doBanco: boolean
}

export function useSiteConfig(): EstadoSiteConfig {
  const [config, setConfig] = useState<ConfigLoja>(lerConfig)

  useEffect(() => {
    const aoMudar = () => setConfig(lerConfig())
    window.addEventListener(EVENTO_CONFIG, aoMudar)
    return () => window.removeEventListener(EVENTO_CONFIG, aoMudar)
  }, [])

  return useMemo(() => ({ config, carregando: false, doBanco: false }), [config])
}
