import { getSupabase } from './supabase'

/** Situação do cliente no acompanhamento do dono (mini-CRM). */
export type LeadStatus = 'novo' | 'negociando' | 'fechado' | 'nao_fechou'

export const STATUS_LEAD: LeadStatus[] = ['novo', 'negociando', 'fechado', 'nao_fechou']

export interface Lead {
  id: string
  tipo: string
  nome: string
  telefone: string
  dados: Record<string, unknown>
  origem: string | null
  criado_em: string
  /** Presente só em bases com a migração aplicada. */
  status?: LeadStatus | null
  /** Nota livre do dono ("manda msg terça"). */
  nota?: string | null
}

export function statusDoLead(lead: Lead): LeadStatus {
  return STATUS_LEAD.includes(lead.status as LeadStatus) ? (lead.status as LeadStatus) : 'novo'
}

/** `null` = indisponível (sem Supabase ou erro). `[]` = nenhum lead ainda. */
export async function buscarLeads(): Promise<Lead[] | null> {
  const sb = getSupabase()
  if (!sb) return null

  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(200)

  if (error) return null
  return (data ?? []) as Lead[]
}

/**
 * Atualiza acompanhamento do cliente (status e/ou nota).
 *
 * Só o dono logado consegue: RLS permite update em leads apenas para
 * `authenticated` — o visitante nunca toca nestas colunas.
 */
export async function atualizarLead(
  id: string,
  mudancas: { status?: LeadStatus; nota?: string },
): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const { error } = await sb.from('leads').update(mudancas).eq('id', id)
  return error ? { ok: false, erro: error.message } : { ok: true, erro: null }
}

export function linkWhatsapp(telefone: string): string {
  return `https://wa.me/55${telefone.replace(/\D/g, '')}`
}
