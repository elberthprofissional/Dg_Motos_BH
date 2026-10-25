import { SITE, SITE_URL, WHATSAPP_NUMBER } from '../data/site'
import { getSupabase } from './supabase'

/**
 * ============================================================
 * CONFIGURAÇÃO DA LOJA
 * ============================================================
 *
 * Os dados comerciais da loja (WhatsApp, Instagram, endereço, horários)
 * têm três níveis, nesta ordem de prioridade:
 *
 *  1. Banco de dados (site_settings) — fonte global, editável pelo dono
 *     sem rebuild. É o que vale pra todos os visitantes.
 *  2. localStorage — compatibilidade com versões antigas e quando o banco
 *     não estiver configurado. Vale só neste navegador.
 *  3. src/data/site.ts — valores de fábrica, versionados.
 *
 * O painel edita o banco (quando disponível) e também sincroniza com
 * localStorage para leitura imediata.
 */

export interface ConfigLoja {
  whatsapp: string | null
  instagramHandle: string
  instagramUrl: string
  enderecoRua: string
  enderecoCidadeUf: string
  horarios: { dias: string; horas: string }[]
}

/** Valor de fábrica, montado a partir de src/data/site.ts. */
export function configPadrao(): ConfigLoja {
  return {
    whatsapp: WHATSAPP_NUMBER,
    instagramHandle: SITE.instagram.handle,
    instagramUrl: SITE.instagram.url,
    enderecoRua: SITE.endereco.rua,
    enderecoCidadeUf: SITE.endereco.cidadeUf,
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

/** Mescla config com valores de fábrica para garantir campos obrigatórios.
 *  Descarta chaves obsoletas (ex.: telefoneExibicao, removido do painel). */
function normalizarConfig(salvo: Partial<ConfigLoja> | null | undefined): ConfigLoja {
  const { telefoneExibicao: _obsoleta, ...resto } = (salvo ?? {}) as Partial<ConfigLoja> & {
    telefoneExibicao?: unknown
  }
  return { ...configPadrao(), ...resto }
}

/** Busca configuração salva no banco. */
export async function lerConfigDoBanco(): Promise<ConfigLoja | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'loja')
      .maybeSingle()

    if (error || !data?.value) return null
    const value = data.value as Partial<ConfigLoja>
    return normalizarConfig(value)
  } catch {
    return null
  }
}

/** Salva configuração no banco. */
export async function gravarConfigNoBanco(config: ConfigLoja): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'loja', value: config, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )

    return !error
  } catch {
    return false
  }
}

/** Restaura configuração no banco para os valores de fábrica. */
export async function limparConfigNoBanco(): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'loja', value: configPadrao(), updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )

    return !error
  } catch {
    return false
  }
}

const CHAVE = 'dg-motos:config-loja'

/**
 * Evento emitido a cada gravação/limpeza. A vitrine (useSiteConfig)
 * escuta e re-renderiza na hora.
 */
export const EVENTO_CONFIG = 'dg-motos:config-mudou'

function avisarMudanca(): void {
  try {
    window.dispatchEvent(new Event(EVENTO_CONFIG))
  } catch {
    // Sem window (prerender/SSR): os leitores pegam no próximo mount.
  }
}

/** Salva cópia local no localStorage (cache/compatibilidade). */
export function salvarConfigLocal(config: ConfigLoja): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(config))
  } catch {
    // Storage cheio ou bloqueado
  }
}

/** Lê cópia local do localStorage. */
export function lerConfigLocal(): ConfigLoja | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return null
    const salvo = JSON.parse(bruto) as Partial<ConfigLoja>
    return normalizarConfig(salvo)
  } catch {
    return null
  }
}

/** Limpa cópia local do localStorage. */
export function limparConfigLocal(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // Sem storage não há nada a limpar.
  }
}

/** O valor salvo no painel ou, sem ele, o de fábrica. */
export function lerConfig(): ConfigLoja {
  const local = lerConfigLocal()
  if (local) return local
  return configPadrao()
}

/** Salva a config editada no painel (localStorage + evento). */
export function gravarConfig(config: ConfigLoja): void {
  salvarConfigLocal(config)
  avisarMudanca()
}

/** Restaura os valores de fábrica (src/data/site.ts). */
export function limparConfig(): void {
  limparConfigLocal()
  avisarMudanca()
}
export { SITE_URL }
