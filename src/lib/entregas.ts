import type { EntregaPublicada, EntregaRegistro, StatusEntrega } from '../data/entregas'
import { BUCKET_ENTREGAS, getSupabase } from './supabase'

interface LinhaEntrega {
  id: string
  moto_id: string | null
  moto_nome: string
  fotos: string[] | null
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
  motoId: string
  motoNome: string
  fotos: string[]
  legenda: string
  nomeCliente: string
  entregueEm: string
  autorizacaoPublicacao: boolean
  status: StatusEntrega
  ordem: number
}

const COLUNAS =
  'id,moto_id,moto_nome,fotos,legenda,nome_cliente,entregue_em,autorizacao_publicacao,status,ordem,updated_at'

/**
 * Assina TODAS as fotos da página em uma única chamada e devolve um mapa
 * caminho → URL.
 *
 * Antes era uma requisição por foto: um mural com dez posts de seis
 * fotos fazia sessenta idas ao Storage antes de a seção aparecer. O
 * caminho que não pôde ser assinado simplesmente não entra no mapa — a
 * foto correspondente fica sem URL e o chamador decide o que fazer.
 */
async function assinarFotos(
  paths: string[],
  validadeSegundos = 60 * 60 * 24,
): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  const sb = getSupabase()
  const unicos = [...new Set(paths)]
  if (!sb || unicos.length === 0) return urls

  const { data, error } = await sb.storage
    .from(BUCKET_ENTREGAS)
    .createSignedUrls(unicos, validadeSegundos)
  if (error || !data) return urls

  for (const item of data) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
  }
  return urls
}

function paraRegistro(linha: LinhaEntrega, urls: Map<string, string>): EntregaRegistro {
  const fotos = linha.fotos ?? []
  return {
    id: linha.id,
    motoId: linha.moto_id ?? '',
    motoNome: linha.moto_nome,
    fotos,
    // Alinhadas por índice com `fotos`; sem URL, string vazia.
    imagens: fotos.map((caminho) => urls.get(caminho) ?? ''),
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
  const linhas = (data ?? []) as LinhaEntrega[]
  const urls = await assinarFotos(linhas.flatMap((linha) => linha.fotos ?? []))
  return linhas.map((linha) => paraRegistro(linha, urls))
}

export async function buscarEntregasPublicadas(limite?: number): Promise<EntregaPublicada[]> {
  const sb = getSupabase()
  if (!sb) return []

  const consulta = sb
    .from('entregas')
    // Só o que a galeria mostra: fotos e data. Nome, moto e legenda
    // permanecem no painel e nunca são enviados ao navegador do visitante.
    .select('id,fotos,entregue_em')
    .eq('status', 'publicada')
    .order('ordem', { ascending: true })
    .order('entregue_em', { ascending: false, nullsFirst: false })

  // A Home passa um limite para não baixar a galeria inteira só para
  // preencher a seção; a página /sonhos pede tudo.
  const { data, error } = await (limite && limite > 0 ? consulta.limit(limite) : consulta)

  if (error || !data) return []

  const linhas = data as Pick<LinhaEntrega, 'id' | 'fotos' | 'entregue_em'>[]
  // Uma assinatura para a galeria inteira (URLs de 1h, renovadas pelo hook).
  const urls = await assinarFotos(linhas.flatMap((linha) => linha.fotos ?? []), 60 * 60)

  const registros = linhas.map((linha): EntregaPublicada | null => {
    const imagens = (linha.fotos ?? []).map((caminho) => urls.get(caminho) ?? '').filter(Boolean)
    // Post sem nenhuma foto legível não tem o que mostrar na galeria.
    if (imagens.length === 0) return null
    return {
      id: linha.id,
      imagens,
      entregueEm: linha.entregue_em || undefined,
    }
  })
  return registros.filter((item): item is EntregaPublicada => item !== null)
}

export async function salvarEntrega(dados: EntregaParaSalvar): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  if (dados.status === 'publicada' && (dados.fotos.length === 0 || !dados.autorizacaoPublicacao)) {
    throw new Error('Para publicar, adicione ao menos uma foto e confirme a autorização de uso.')
  }

  const linha = {
    id: dados.id,
    // Moto roteirizada desde o estoque. Avulso fica nulo — o nome
    // denormalizado (moto_nome) cobre a exibição nos dois casos.
    moto_id: dados.motoId || null,
    moto_nome: dados.motoNome.trim(),
    fotos: dados.fotos,
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

export async function removerFotosEntrega(paths: string[]): Promise<void> {
  const sb = getSupabase()
  if (!sb || paths.length === 0) return
  const { error } = await sb.storage.from(BUCKET_ENTREGAS).remove(paths)
  if (error) throw new Error(error.message)
}
