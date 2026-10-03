import { getSupabase } from './supabase'
import { SITE, SITE_URL, WHATSAPP_NUMBER } from '../data/site'
import { linhaParaFinanciamento } from './financiamento'
import { financiamentoFormParaJsonb } from './financiamento'
import type { ConfigFinanciamento } from './financiamento'
import type { FormFinanciamento } from './financiamento'

/**
 * ============================================================
 * CONFIGURAÇÃO DA LOJA — leitura e escrita
 * ============================================================
 *
 * Fonte de verdade: a tabela `config_loja` (uma linha só, id = 1),
 * editável pelo dono em /admin -> Configurações.
 *
 * O arquivo src/data/site.ts continua existindo como **fallback**:
 * enquanto o banco não tem config (ou está fora do ar), o site usa os
 * valores de lá. Assim o site nunca quebra por falta do banco.
 *
 * Atenção: o site é estático. Salvar aqui muda o que o PAINEL vê; para
 * a vitrine e o Google refletirem, é preciso publicar (novo build).
 */

/** Formato canônico da config, já mesclada com os defaults. */
export interface ConfigLoja {
  whatsapp: string | null
  instagramHandle: string
  instagramUrl: string
  telefoneExibicao: string | null
  enderecoRua: string
  enderecoCidadeUf: string
  mapsUrl: string
  horarios: { dias: string; horas: string }[]
  /** Conteúdo editável da página /financiamento (título, etapas etc.). */
  financiamento: ConfigFinanciamento
}

/** Linha crua da tabela (tudo opcional — o banco pode ter nulls). */
interface LinhaConfig {
  whatsapp: string | null
  instagram_handle: string | null
  instagram_url: string | null
  telefone_exibicao: string | null
  endereco_rua: string | null
  endereco_cidade_uf: string | null
  maps_url: string | null
  horarios: unknown
  /** Base antigas podem não ter esta coluna; ausente = usa o padrão. */
  financiamento?: unknown
}

/** Defaults vindos de src/data/site.ts (o fallback oficial). */
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
    financiamento: linhaParaFinanciamento(null),
  }
}

/**
 * Mescla a linha do banco sobre os defaults.
 *
 * Campo por campo: só sobrescreve o que veio preenchido. Assim uma
 * config parcial no banco (ex.: só o WhatsApp salvo) não apaga o
 * Instagram nem o endereço do fallback.
 */
export function linhaParaConfig(linha: LinhaConfig | null): ConfigLoja {
  const base = configPadrao()
  if (!linha) return base

  const horarios = Array.isArray(linha.horarios)
    ? linha.horarios.filter(
        (h): h is { dias: string; horas: string } =>
          typeof h?.dias === 'string' && typeof h?.horas === 'string',
      )
    : []

  return {
    whatsapp: linha.whatsapp?.trim() ? linha.whatsapp.trim() : base.whatsapp,
    instagramHandle: linha.instagram_handle?.trim() || base.instagramHandle,
    instagramUrl: linha.instagram_url?.trim() || base.instagramUrl,
    telefoneExibicao: linha.telefone_exibicao?.trim() || base.telefoneExibicao,
    enderecoRua: linha.endereco_rua?.trim() || base.enderecoRua,
    enderecoCidadeUf: linha.endereco_cidade_uf?.trim() || base.enderecoCidadeUf,
    mapsUrl: linha.maps_url?.trim() || base.mapsUrl,
    horarios: horarios.length > 0 ? horarios : base.horarios,
    financiamento: linhaParaFinanciamento(linha.financiamento),
  }
}

/** Busca a config do banco (ou os defaults se o banco não responder). */
export async function buscarConfigLoja(): Promise<ConfigLoja> {
  const sb = getSupabase()
  if (!sb) return configPadrao()

  const { data, error } = await sb.from('config_loja').select('*').eq('id', 1).maybeSingle()
  if (error || !data) return configPadrao()

  return linhaParaConfig(data as LinhaConfig)
}

/** Formato do formulário do admin (tudo string; vazio = usar default). */
export interface FormConfigLoja {
  whatsapp: string
  instagramHandle: string
  instagramUrl: string
  telefoneExibicao: string
  enderecoRua: string
  enderecoCidadeUf: string
  mapsUrl: string
}

export type { FormFinanciamento }

/**
 * Valida o formulário. Devolve mensagem de erro ou `null`.
 *
 * WhatsApp aceita só dígitos (DDI+DDD+número), como o wa.me exige.
 */
export function validarFormConfig(form: FormConfigLoja): string | null {
  const wa = form.whatsapp.replace(/\D/g, '')
  if (wa && (wa.length < 10 || wa.length > 13)) {
    return 'WhatsApp: use só dígitos com DDI e DDD (ex.: 5531987654321).'
  }
  if (form.instagramUrl && !/^https:\/\/(www\.)?instagram\.com\//.test(form.instagramUrl)) {
    return 'Instagram: a URL deve começar com https://instagram.com/.'
  }
  return null
}

/** Converte o formulário na linha a salvar (string vazia vira null). */
export function formParaLinha(form: FormConfigLoja): LinhaConfig {
  const limpar = (v: string) => {
    const t = v.trim()
    return t === '' ? null : t
  }
  return {
    whatsapp: form.whatsapp.replace(/\D/g, '') || null,
    instagram_handle: limpar(form.instagramHandle),
    instagram_url: limpar(form.instagramUrl),
    telefone_exibicao: limpar(form.telefoneExibicao),
    endereco_rua: limpar(form.enderecoRua),
    endereco_cidade_uf: limpar(form.enderecoCidadeUf),
    maps_url: limpar(form.mapsUrl),
    horarios: [], // edição de horários vem depois; vazio = usa fallback
  }
}

/** Salva a config no banco (upsert: cria a linha 1 se ainda não existe). */
export async function salvarConfigLoja(
  form: FormConfigLoja,
  financiamento?: FormFinanciamento,
): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const { error } = await sb
    .from('config_loja')
    .upsert({
      id: 1,
      ...formParaLinha(form),
      ...(financiamento
        ? { financiamento: financiamentoFormParaJsonb(financiamento) }
        : {}),
    })
  return error ? { ok: false, erro: error.message } : { ok: true, erro: null }
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
