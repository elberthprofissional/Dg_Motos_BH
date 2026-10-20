import { SITE, SITE_URL, WHATSAPP_NUMBER } from '../data/site'

/**
 * ============================================================
 * CONFIGURAÇÃO DA LOJA — somente leitura
 * ============================================================
 *
 * Os dados comerciais da loja (WhatsApp, Instagram, endereço, horários)
 * vivem em src/data/site.ts, versionados junto com o código.
 *
 * Por que não no banco: são informações que mudam raramente e cujo erro
 * é caro (endereço errado no Google, telefone errado no botão). Manter em
 * código significa que toda alteração passa por revisão e build — e o site
 * nunca fica com "meio configurado" se o banco cair.
 *
 * Este módulo só dá forma ao que está em site.ts para os componentes da
 * vitrine, sem nenhuma chamada de rede.
 */

export interface ConfigLoja {
  whatsapp: string | null
  instagramHandle: string
  instagramUrl: string
  telefoneExibicao: string | null
  enderecoRua: string
  enderecoCidadeUf: string
  mapsUrl: string
  horarios: { dias: string; horas: string }[]
}

/** Config da loja, montada a partir de src/data/site.ts. */
export function configPadrao(): ConfigLoja {
  return {
    whatsapp: WHATSAPP_NUMBER,
    instagramHandle: SITE.instagram.handle,
    instagramUrl: SITE.instagram.url,
    telefoneExibicao: SITE.telefoneExibicao,
    enderecoRua: SITE.endereco.rua,
    enderecoCidadeUf: SITE.endereco.cidadeUf,
    mapsUrl: SITE.mapsUrl,
    horarios: SITE.horarios ?? [],
  }
}

/** Link wa.me com a config informada (null = sem número, cair para /contato). */
export function whatsappUrlCom(
  config: Pick<ConfigLoja, 'whatsapp'>,
  message?: string,
): string | null {
  if (!config.whatsapp) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${config.whatsapp}${text}`
}

/** URL base do site (para schema.org e links absolutos). */
export { SITE_URL }
