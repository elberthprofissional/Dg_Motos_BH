import { SITE, SITE_URL, WHATSAPP_NUMBER } from '../data/site'

/**
 * ============================================================
 * CONFIGURAÇÃO DA LOJA
 * ============================================================
 *
 * Os dados comerciais da loja (WhatsApp, Instagram, endereço, horários)
 * têm dois níveis:
 *
 *  1. O valor de FÁBRICA, versionado em src/data/site.ts. É o fallback
 *     quando não há nada salvo — mudar aqui passa por review e build.
 *  2. O valor SALVO no painel do dono (/admin), que vive no
 *     `localStorage` deste navegador. O painel edita, a vitrine lê.
 *
 * Por que localStorage e não já no banco: a mudança vale na hora, sem
 * round-trip, e o contrato de `ConfigLoja` não muda quando a fonte
 * virar a tabela do Supabase — só `lerConfig`/`gravarConfig` trocam de
 * tripas. Limitação conhecida e aceita: a config salva vale só para o
 * navegador onde foi gravada; os visitantes veem o padrão de fábrica.
 *
 * Um `localStorage` vazio ou corrompido degrada para o padrão, então o
 * site nunca fica sem contato.
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

/** Valor de fábrica, montado a partir de src/data/site.ts. */
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

const CHAVE = 'dg-motos:config-loja'

/**
 * Evento emitido a cada gravação/limpeza. A vitrine (useSiteConfig)
 * escuta e re-renderiza na hora; sem ele, uma edição no painel só
 * apareceria depois de recarregar a página.
 */
export const EVENTO_CONFIG = 'dg-motos:config-mudou'

function avisarMudanca(): void {
  try {
    window.dispatchEvent(new Event(EVENTO_CONFIG))
  } catch {
    // Sem window (prerender/SSR): os leitores pegam no próximo mount.
  }
}

/** O valor salvo no painel ou, sem ele, o de fábrica. */
export function lerConfig(): ConfigLoja {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return configPadrao()
    const salvo = JSON.parse(bruto) as Partial<ConfigLoja>
    // Merge por campo: um schema antigo com campo faltando não derruba
    // a config inteira — o campo ausente volta ao valor de fábrica.
    return { ...configPadrao(), ...salvo }
  } catch {
    // JSON inválido ou storage bloqueado: comportamento de fábrica.
    return configPadrao()
  }
}

/** Salva a config editada no painel. */
export function gravarConfig(config: ConfigLoja): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(config))
  } catch {
    // Storage cheio ou bloqueado (modos privados): a edição ainda vale
    // nesta sessão porque o state do React a mantém — só não sobrevive
    // a um refresh. Sem exceção estourando na cara do dono.
  }
  avisarMudanca()
}

/** Restaura os valores de fábrica (src/data/site.ts). */
export function limparConfig(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // Sem storage não há nada a limpar.
  }
  avisarMudanca()
}

/** URL base do site (para schema.org e links absolutos). */
export { SITE_URL }
