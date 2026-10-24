import type { EntregaPublicada, EntregaRegistro, StatusEntrega } from '../data/entregas'
import { BUCKET_ENTREGAS, getSupabase } from './supabase'

interface LinhaEntrega {
  id: string
  moto: string
  foto_path: string | null
  legenda: string | null
  nome_cliente: string | null
  entregue_em: string | null
  autorizacao_publicacao: boolean
  status: StatusEntrega
  ordem: number
  updated_at: string
}

export interface EntregaParaSalvar {
  id: string
  moto: string
  fotoPath: string | null
  legenda: string
  nomeCliente: string
  entregueEm: string
  autorizacaoPublicacao: boolean
  status: StatusEntrega
  ordem: number
}

const COLUNAS =
  'id,moto,foto_path,legenda,nome_cliente,entregue_em,autorizacao_publicacao,status,ordem,updated_at'

async function assinarFoto(path: string | null, validadeSegundos = 60 * 60 * 24): Promise<string | null> {
  if (!path) return null
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.storage
    .from(BUCKET_ENTREGAS)
    .createSignedUrl(path, validadeSegundos)
  if (error) return null
  return data.signedUrl
}

async function paraRegistro(linha: LinhaEntrega): Promise<EntregaRegistro> {
  return {
    id: linha.id,
    moto: linha.moto,
    fotoPath: linha.foto_path,
    imagemUrl: await assinarFoto(linha.foto_path),
    legenda: linha.legenda ?? '',
    nomeCliente: linha.nome_cliente ?? '',
    entregueEm: linha.entregue_em ?? '',
    autorizacaoPublicacao: linha.autorizacao_publicacao,
    status: linha.status,
    ordem: linha.ordem,
    updatedAt: linha.updated_at,
  }
}

export async function buscarEntregasAdmin(): Promise<EntregaRegistro[]> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')

  const { data, error } = await sb
    .from('entregas')
    .select(COLUNAS)
    .order('ordem', { ascending: true })
    .order('entregue_em', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  return Promise.all(((data ?? []) as LinhaEntrega[]).map(paraRegistro))
}

export async function buscarEntregasPublicadas(): Promise<EntregaPublicada[]> {
  const sb = getSupabase()
  if (!sb) return []

  const { data, error } = await sb
    .from('entregas')
    .select('id,moto,foto_path,legenda,nome_cliente,entregue_em')
    .eq('status', 'publicada')
    .order('ordem', { ascending: true })
    .order('entregue_em', { ascending: false, nullsFirst: false })

  if (error || !data) return []

  const registros = await Promise.all(
    (data as Pick<LinhaEntrega, 'id' | 'moto' | 'foto_path' | 'legenda' | 'nome_cliente' | 'entregue_em'>[])
      .map(async (linha): Promise<EntregaPublicada | null> => {
        const imagem = await assinarFoto(linha.foto_path, 60 * 60)
        if (!imagem) return null
        return {
          id: linha.id,
          moto: linha.moto,
          imagem,
          nomeCliente: linha.nome_cliente || undefined,
          depoimento: linha.legenda || undefined,
          entregueEm: linha.entregue_em || undefined,
        }
      }),
  )
  return registros.filter((item): item is EntregaPublicada => item !== null)
}

export async function salvarEntrega(dados: EntregaParaSalvar): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  if (dados.status === 'publicada' && (!dados.fotoPath || !dados.autorizacaoPublicacao)) {
    throw new Error('Para publicar, adicione uma foto e confirme a autorização de uso.')
  }

  const linha = {
    id: dados.id,
    moto: dados.moto.trim(),
    foto_path: dados.fotoPath,
    legenda: dados.legenda.trim() || null,
    nome_cliente: dados.nomeCliente.trim() || null,
    entregue_em: dados.entregueEm || null,
    autorizacao_publicacao: dados.autorizacaoPublicacao,
    status: dados.status,
    ordem: Math.max(0, Math.trunc(dados.ordem)),
  }

  const { error } = await sb.from('entregas').upsert(linha, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

export async function arquivarEntrega(id: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  const { error } = await sb.from('entregas').update({ status: 'arquivada' }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function removerFotoEntrega(path: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  const { error } = await sb.storage.from(BUCKET_ENTREGAS).remove([path])
  if (error) throw new Error(error.message)
}
