import { configPadrao } from '../lib/configLoja'
import type { ConfigLoja } from '../lib/configLoja'

/**
 * Configuração da loja para a vitrine.
 *
 * Não há mais provider nem busca no banco: os valores vêm direto de
 * src/data/site.ts (ver src/lib/configLoja.ts). O hook existe apenas para
 * os componentes não precisarem saber de onde a config vem.
 */
export interface EstadoSiteConfig {
  config: ConfigLoja
  carregando: boolean
  doBanco: boolean
}

const CONFIG: EstadoSiteConfig = { config: configPadrao(), carregando: false, doBanco: false }

export function useSiteConfig(): EstadoSiteConfig {
  return CONFIG
}
