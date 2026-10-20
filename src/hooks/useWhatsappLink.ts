import { whatsappUrlCom } from '../lib/configLoja'
import { useSiteConfig } from './siteConfigContexto'

/**
 * Link wa.me com o número configurado pelo dono (painel) ou, na falta,
 * o de src/data/site.ts. `null` = sem número: o componente cai para /contato.
 *
 * Fica em hooks/ e não em lib/ porque depende do contexto React — lib/
 * é só de funções puras, testáveis sem renderizar.
 */
export function useWhatsappLink(message: string): string | null {
  const { config } = useSiteConfig()
  return whatsappUrlCom(config, message)
}
