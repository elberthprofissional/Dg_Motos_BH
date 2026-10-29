import type {
  EntregaPublicada,
  EntregaRegistro,
  FotoNaLixeira,
  StatusEntrega,
} from '../data/entregas'
import { BUCKET_ENTREGAS, getSupabase } from './supabase'
import { comprimirParaWebp, FOTO_TAMANHO_MAX_MB } from './imagens'

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

interface LinhaFotoNaLixeira {
  id: string
  entrega_id: string
  caminho: string
  apagada_em: string
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

  // A Home passa um limite para não baixar o mural inteiro; sem limite,
  // a consulta traz todas as entregas publicadas.
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

/** Fotos que saíram do mural, da exclusão mais recente para a mais antiga. */
export async function buscarFotosNaLixeira(): Promise<FotoNaLixeira[]> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')

  const { data, error } = await sb
    .from('entregas_fotos_lixeira')
    .select('id,entrega_id,caminho,apagada_em')
    .order('apagada_em', { ascending: false })

  if (error) throw new Error(error.message)
  const linhas = (data ?? []) as LinhaFotoNaLixeira[]
  const urls = await assinarFotos(linhas.map((linha) => linha.caminho))
  return linhas.map((linha) => ({
    id: linha.id,
    entregaId: linha.entrega_id,
    caminho: linha.caminho,
    url: urls.get(linha.caminho) ?? '',
    apagadaEm: linha.apagada_em,
  }))
}

/**
 * Tira a foto do mural e deixa o arquivo guardado na lixeira.
 *
 * A RPC faz as duas escritas na mesma transação: não existe momento em
 * que a foto sumiu da publicação sem estar na lixeira (ou vice-versa).
 */
export async function moverFotoParaLixeira(entregaId: string, caminho: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  const { error } = await sb.rpc('mover_foto_entrega_para_lixeira', {
    p_entrega_id: entregaId,
    p_caminho: caminho,
  })
  if (error) throw new Error(error.message)
}

/** Devolve a foto à publicação de origem; ela volta ao ar se autorizada. */
export async function restaurarFotoDaLixeira(id: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  const { error } = await sb.rpc('restaurar_foto_da_lixeira', { p_id: id })
  if (error) throw new Error(error.message)
}

/**
 * Apaga de vez as fotos indicadas: saem da lixeira e do Storage.
 *
 * A linha sai primeiro. Se o Storage falhar, sobra um arquivo órfão —
 * invisível para o site — e o dono recebe o aviso, em vez de a foto
 * voltar para a lixeira pedindo para ser apagada outra vez.
 */
export async function apagarFotosDaLixeira(
  fotos: FotoNaLixeira[],
): Promise<{ aviso: string | null }> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  if (fotos.length === 0) return { aviso: null }

  const { error } = await sb
    .from('entregas_fotos_lixeira')
    .delete()
    .in('id', fotos.map((foto) => foto.id))
  if (error) throw new Error(error.message)

  const { error: erroStorage } = await sb.storage
    .from(BUCKET_ENTREGAS)
    .remove(fotos.map((foto) => foto.caminho))
  if (erroStorage) {
    return {
      aviso: `As fotos saíram da lixeira, mas ${fotos.length} arquivo(s) ficaram no bucket "entregas". Remova pelo painel do Supabase.`,
    }
  }
  return { aviso: null }
}

export async function salvarEntrega(dados: EntregaParaSalvar): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  if (dados.status === 'publicada' && dados.fotos.length === 0) {
    throw new Error('Para publicar, adicione ao menos uma foto.')
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

/**
 * Grava a lista de fotos restantes de uma publicação.
 *
 * Sem nenhuma foto o registro sai do mural como `arquivada` numa única
 * escrita: assim o check `entrega_publicada_autorizada` do banco (exige
 * foto quando o status é `publicada`) continua válido sem virar erro.
 */
export async function atualizarFotosEntrega(id: string, fotos: string[]): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')
  const linha = fotos.length === 0 ? { fotos, status: 'arquivada' } : { fotos }
  const { error } = await sb.from('entregas').update(linha).eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Sobe as fotos de uma publicação e devolve caminho + URL assinada.
 *
 * Falha parcial desfaz tudo o que subiu: uma publicação nunca é
 * gravada com meia dúzia de fotos e o resto sumido no meio do caminho.
 * As mensagens são de interface (aparecem no toast do painel).
 */
export async function enviarFotosEntrega(
  entregaId: string,
  arquivos: File[],
): Promise<{ paths: string[]; urls: string[] }> {
  if (arquivos.some((arquivo) => !arquivo.type.startsWith('image/'))) {
    throw new Error('Só fotos: escolha arquivos de imagem.')
  }
  if (arquivos.some((arquivo) => arquivo.size > FOTO_TAMANHO_MAX_MB * 1024 * 1024)) {
    throw new Error(`Cada foto precisa ter até ${FOTO_TAMANHO_MAX_MB} MB.`)
  }
  if (arquivos.length > 10) {
    throw new Error('Até 10 fotos por publicação.')
  }

  const sb = getSupabase()
  if (!sb) throw new Error('Supabase não configurado neste deploy.')

  const paths: string[] = []
  const urls: string[] = []
  try {
    for (const arquivo of arquivos) {
      const caminho = `${entregaId}/${crypto.randomUUID()}.webp`
      const blob = await comprimirParaWebp(arquivo)
      const { error: erroUpload } = await sb.storage
        .from(BUCKET_ENTREGAS)
        .upload(caminho, blob, { contentType: 'image/webp', upsert: false })
      if (erroUpload) throw erroUpload
      // Entra na lista já aqui: se a assinatura falhar em seguida, o
      // arquivo precisa entrar na limpeza junto com os outros.
      paths.push(caminho)

      const { data, error: erroAssinatura } = await sb.storage
        .from(BUCKET_ENTREGAS)
        .createSignedUrl(caminho, 60 * 60 * 24)
      if (erroAssinatura) throw erroAssinatura
      if (!data.signedUrl) throw new Error('Não foi possível preparar todas as fotos. Tente de novo.')

      urls.push(data.signedUrl)
    }
    return { paths, urls }
  } catch (e) {
    if (paths.length > 0) {
      await sb.storage.from(BUCKET_ENTREGAS).remove(paths).catch(() => undefined)
    }
    throw e
  }
}
