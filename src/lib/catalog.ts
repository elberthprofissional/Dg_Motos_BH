import type { Motorcycle, MotorcycleStatus, MotorcycleCategory, MotorcycleSpec } from '../types'
import { getSupabase, urlPublica, BUCKET_FOTOS } from './supabase'
import { caminhoDeBucket } from './fotos'

/**
 * ============================================================
 * CATÁLOGO — leitura e escrita
 * ============================================================
 *
 * Fonte de verdade: o Postgres.
 *   motorcycles        → a moto
 *   motorcycle_images  → fotos em relação 1:N, ordenadas por `posicao`
 *
 * O arquivo src/data/motorcycles.ts continua existindo como **fallback**
 * para quando o Supabase não está configurado ou está fora do ar. Isso
 * mantém o site no ar mesmo com o banco derrubado — o que importa para
 * uma loja que perde venda por site fora do ar.
 */

/**
 * Linha crua do Postgres, do jeito que o PostgREST devolve.
 *
 * `numeric` chega como string; `motorcycle_images` chega como recurso
 * embutido (select `*, motorcycle_images(...)`), por isso o nome aninhado.
 */
interface LinhaImagem {
  src?: unknown
  alt?: unknown
  posicao?: unknown
}

interface LinhaCatalogo {
  id: string
  slug: string
  marca: string
  modelo: string
  ano: number
  preco: number | string
  /** Colunas da promoção; só existem depois da migração 06 aplicar. */
  em_promocao?: boolean | number | null
  preco_antes?: number | string | null
  quilometragem: number | null
  cilindrada: number | null
  categoria: string
  descricao: string
  especificacoes: unknown
  status: string
  created_at?: string | null
  updated_at?: string | null
  /** Só existe depois da migração 09 (lixeira). */
  lixeira_em?: string | null
  motorcycle_images?: LinhaImagem[] | null
}

/** Normaliza a lista de imagens embutida e a ordena por `posicao`. */
function lerImagens(linhas: LinhaImagem[] | null | undefined, altPadrao: string) {
  return (linhas ?? [])
    .filter((f) => typeof f?.src === 'string' && (f.src as string).trim().length > 0)
    .map((f) => ({
      src: f.src as string,
      alt: typeof f.alt === 'string' && f.alt.trim() ? f.alt : altPadrao,
      posicao: typeof f.posicao === 'number' ? f.posicao : 0,
    }))
    .sort((a, b) => a.posicao - b.posicao)
    .map(({ src, alt }) => ({ src, alt }))
}

/**
 * Converte uma linha do Postgres no formato do site.
 *
 * O PostgREST devolve `numeric` como string e `jsonb` já parseado, mas
 * um array vazio ou null quebraria o `.map()` das páginas. Normalizar
 * aqui evita espalhar `?? []` pelo código inteiro.
 */
export function linhaParaMotos(linha: LinhaCatalogo): Motorcycle {
  const specs = Array.isArray(linha.especificacoes) ? linha.especificacoes : []
  const nomeCompleto = `${linha.marca} ${linha.modelo}`

  return {
    id: linha.id,
    slug: linha.slug,
    marca: linha.marca,
    modelo: linha.modelo,
    ano: Number(linha.ano),
    preco: Number(linha.preco),
    precoAntes: linha.preco_antes == null ? null : Number(linha.preco_antes),
    quilometragem: linha.quilometragem == null ? null : Number(linha.quilometragem),
    cilindrada: linha.cilindrada == null ? null : Number(linha.cilindrada),
    categoria: linha.categoria as MotorcycleCategory,
    descricao: linha.descricao ?? '',
    especificacoes: specs.filter(
      (s): s is MotorcycleSpec => typeof s?.label === 'string' && typeof s?.value === 'string',
    ),
    imagens: lerImagens(linha.motorcycle_images, nomeCompleto),
    emPromocao: Boolean(linha.em_promocao),
    status: linha.status as MotorcycleStatus,
    criadoEm: linha.created_at ?? undefined,
    atualizadoEm: linha.updated_at ?? undefined,
    lixeiraEm: linha.lixeira_em ?? null,
  }
}

export interface ResultadoCatalogo {
  motos: Motorcycle[]
  /** `true` quando os dados vieram do banco (e não do fallback). */
  doBanco: boolean
  /** Mensagem para exibir no admin quando o banco falhou. */
  erro: string | null
}

/**
 * Colunas lidas pela API.
 *
 * Lista explícita de propósito: `*` trazia `custo_compra` para qualquer
 * visitante (a chave anon é pública). O custo agora só sai pela função
 * `custo_da_moto`, que exige admin.
 */
const COLUNAS_MOTO =
  'id, slug, marca, modelo, ano, preco, em_promocao, preco_antes, quilometragem, cilindrada, categoria, descricao, especificacoes, status, created_at, updated_at'

const COLUNAS_IMAGENS = 'motorcycle_images(src, alt, posicao)'

/** Select usado em toda leitura: a moto + as fotos já ordenadas. */
const SELECT_MOTO = `${COLUNAS_MOTO}, lixeira_em, ${COLUNAS_IMAGENS}`

/** Select para banco que ainda não rodou a migração 09 (sem lixeira). */
const SELECT_MOTO_SEM_LIXEIRA = `${COLUNAS_MOTO}, ${COLUNAS_IMAGENS}`

function colunaDaLixeiraAusente(error: { code?: string; message: string }): boolean {
  return error.code === '42703' || /lixeira_em/i.test(error.message)
}

/**
 * Busca o catálogo completo.
 *
 * Motos vendidas e indisponíveis vêm junto de propósito: o dono precisa
 * vê-las no admin para poder reativar. Quem filtra o que pode aparecer
 * na vitrine é filtrarMotos().
 *
 * A lixeira fica de fora por padrão — inclusive para o dono autenticado,
 * que veria tudo se dependesse só do RLS. O painel pede
 * `incluirLixeira: true`.
 */
export async function buscarCatalogo(
  opcoes: { incluirLixeira?: boolean } = {},
): Promise<ResultadoCatalogo> {
  const sb = getSupabase()
  if (!sb) {
    return { motos: [], doBanco: false, erro: 'Supabase não configurado neste deploy.' }
  }

  try {
    const primeira = await sb
      .from('motorcycles')
      .select(SELECT_MOTO)
      .order('ano', { ascending: false })

    // Banco que ainda não rodou a migração 09: lê sem a coluna da
    // lixeira em vez de deixar o painel inteiro sem catálogo.
    const resposta =
      primeira.error && colunaDaLixeiraAusente(primeira.error)
        ? await sb
            .from('motorcycles')
            .select(SELECT_MOTO_SEM_LIXEIRA)
            .order('ano', { ascending: false })
        : primeira

    const { data, error } = resposta

    if (error) {
      return { motos: [], doBanco: false, erro: error.message }
    }

    const motos = ((data ?? []) as LinhaCatalogo[])
      .map(linhaParaMotos)
      .filter((moto) => opcoes.incluirLixeira || !moto.lixeiraEm)

    return {
      motos,
      doBanco: true,
      erro: null,
    }
  } catch (e) {
    // Rede caída, DNS, CORS ou projeto pausado: sem o catch a promessa
    // rejeitava e a vitrine ficava "carregando" para sempre.
    return {
      motos: [],
      doBanco: false,
      erro: e instanceof Error ? e.message : 'Falha ao consultar o catálogo.',
    }
  }
}

export interface MotoParaSalvar {
  slug: string
  marca: string
  modelo: string
  ano: number
  preco: number
  quilometragem: number | null
  cilindrada: number | null
  categoria: MotorcycleCategory
  descricao: string
  especificacoes: MotorcycleSpec[]
  imagens: { src: string; alt: string }[]
  emPromocao: boolean
  precoAntes: number | null
  status: MotorcycleStatus
}

/**
 * Modelos únicos já cadastrados, para o formulário sugerir de forma
 * atalho (chip clicável). Não obriga escolher — é atalho, não lista
 * fechada: um modelo novo continua sendo digitado à mão.
 */
export function modelosDisponiveis(
  motos: Motorcycle[],
): { marca: string; modelo: string; categoria: MotorcycleCategory }[] {
  const mapa = new Map<string, { marca: string; modelo: string; categoria: MotorcycleCategory }>()
  for (const m of motos) {
    const chave = `${m.marca}|${m.modelo}`.toLowerCase()
    if (!mapa.has(chave)) {
      mapa.set(chave, { marca: m.marca, modelo: m.modelo, categoria: m.categoria })
    }
  }
  return [...mapa.values()].sort((a, b) =>
    (a.marca + a.modelo).localeCompare(b.marca + b.modelo, 'pt-BR'),
  )
}

/** Normaliza um texto para virar parte de um slug (sem acento, sem espaço). */
export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Monta o slug no padrão `marca-modelo-ano`.
 *
 * Quando marca e modelo são iguais (modelo "Yamaha" da marca "Yamaha"),
 * a parte repetida é removida: a URL fica "yamaha-2020" em vez de
 * "yamaha-yamaha-2020".
 */
export function montarSlug(marca: string, modelo: string, ano: number): string {
  const partes = [slugificar(marca), slugificar(modelo), String(ano)].filter(Boolean)
  const unicas = partes.filter((p, i) => p !== partes[i - 1])
  return unicas.join('-')
}

/**
 * Substitui as fotos da moto numa única transação.
 *
 * O form manda a lista completa e ordenada; a função do banco apaga as
 * linhas antigas e insere as novas juntas. Antes eram duas requisições:
 * se a inserção falhasse no meio, a moto ficava sem foto nenhuma. Os
 * arquivos no Storage saem depois do save, em `excluirFotosRemovidas`.
 */
async function salvarImagens(motoId: string, imagens: { src: string; alt: string }[]) {
  const sb = getSupabase()!
  const { error } = await sb.rpc('salvar_imagens_da_moto', {
    p_moto_id: motoId,
    p_imagens: imagens.map(({ src, alt }) => ({ src, alt })),
  })

  if (!error) return null

  if (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    /salvar_imagens_da_moto/i.test(error.message)
  ) {
    return 'O banco ainda não tem a rotina que grava as fotos. Rode a migração 11_seguranca_e_transacoes.sql no SQL Editor do Supabase.'
  }

  return error.message
}

export async function salvarMoto(
  dados: MotoParaSalvar,
  id?: string,
): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  // O dono nunca digita slug: o endereço sai do que ele já preencheu.
  const slugBase =
    dados.slug.trim() || montarSlug(dados.marca, dados.modelo, dados.ano) || 'moto'

  const payload = {
    slug: slugBase,
    marca: dados.marca,
    modelo: dados.modelo,
    ano: dados.ano,
    preco: dados.preco,
    quilometragem: dados.quilometragem,
    cilindrada: dados.cilindrada,
    categoria: dados.categoria,
    descricao: dados.descricao,
    especificacoes: dados.especificacoes,
    em_promocao: dados.emPromocao,
    preco_antes: dados.precoAntes,
    status: dados.status,
  }

  let motoId = id

  if (id) {
    const { error } = await sb.from('motorcycles').update(payload).eq('id', id)
    if (error) return { ok: false, erro: error.message }
  } else {
    // Duas unidades do mesmo modelo e ano são normais num pátio. Em vez de
    // devolver um erro de "duplicate key" que o dono não teria como
    // resolver (não há campo de slug), o endereço ganha um número:
    // -2, -3…
    let erro: { code?: string; message: string; details?: string | null } | null = null
    for (let tentativa = 1; tentativa <= 50; tentativa++) {
      const slug = tentativa === 1 ? slugBase : `${slugBase}-${tentativa}`
      const { data, error } = await sb
        .from('motorcycles')
        .insert({ ...payload, slug })
        .select('id')
        .single()
      if (!error) {
        motoId = (data as { id: string }).id
        erro = null
        break
      }
      erro = error
      const ehSlugRepetido =
        error.code === '23505' && /slug/i.test(`${error.message} ${error.details ?? ''}`)
      if (!ehSlugRepetido) break
    }
    if (!motoId) return { ok: false, erro: erro?.message ?? 'Erro ao salvar.' }
  }

  const erroImagens = await salvarImagens(motoId!, dados.imagens)
  return erroImagens ? { ok: false, erro: erroImagens } : { ok: true, erro: null }
}

/** Erro de banco sem a coluna da lixeira vira instrução, não stack trace. */
function mensagemLixeira(error: { code?: string; message: string }): string {
  if (colunaDaLixeiraAusente(error)) {
    return 'A coluna da lixeira ainda não existe no banco. Rode a migração 09_lixeira_do_estoque.sql no SQL Editor do Supabase.'
  }
  return error.message
}

/**
 * Tira a moto do site e do pátio sem apagar nada: a ficha e as fotos
 * continuam no banco até o dono restaurar ou apagar de vez na Lixeira.
 *
 * O status original é preservado de propósito — restaurar devolve a moto
 * ao lugar de onde ela saiu (pátio ou Vendidas).
 */
export async function moverParaLixeira(
  id: string,
): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const { error } = await sb
    .from('motorcycles')
    .update({ lixeira_em: new Date().toISOString() })
    .eq('id', id)

  return error ? { ok: false, erro: mensagemLixeira(error) } : { ok: true, erro: null }
}

/** Devolve a moto ao estoque/Vendidas, mantendo o status que ela tinha. */
export async function restaurarMoto(
  id: string,
): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const { error } = await sb.from('motorcycles').update({ lixeira_em: null }).eq('id', id)

  return error ? { ok: false, erro: mensagemLixeira(error) } : { ok: true, erro: null }
}

/**
 * Lê o custo de compra de uma moto pelo RPC do painel.
 *
 * A coluna `custo_compra` não faz parte do select do catálogo (era
 * legível por qualquer visitante). O diálogo de venda chama esta função
 * para gravar o lucro no histórico.
 */
export async function buscarCustoCompra(motoId: string): Promise<number | null> {
  const sb = getSupabase()
  if (!sb) return null

  const { data, error } = await sb.rpc('custo_da_moto', { p_moto_id: motoId })
  if (error) throw new Error(error.message)
  if (data == null || data === '') return null
  const numero = Number(data)
  return Number.isFinite(numero) ? numero : null
}

export interface ResultadoExclusao {
  ok: boolean
  erro: string | null
  /** A exclusão funcionou, mas sobrou algo para o dono resolver. */
  aviso?: string | null
}

/**
 * Apaga de vez as motos indicadas e limpa os arquivos delas no Storage.
 *
 * Só remove linhas que estejam na lixeira: o filtro protege contra um
 * clique errado em uma moto ativa. As linhas de `motorcycle_images` caem
 * sozinhas (on delete cascade), mas os arquivos no bucket NÃO — por isso
 * buscamos as fotos antes e apagamos cada uma. Sem isso, o bucket
 * acumularia lixo a cada exclusão definitiva.
 *
 * A resposta vai além de ok/erro: se o banco apagou mas o Storage
 * recusou, ou se alguma linha deixou de estar na lixeira entre o clique
 * e o delete, o dono recebe um aviso em vez de um falso "tudo certo".
 */
export async function excluirMotosDefinitivamente(
  ids: string[],
): Promise<ResultadoExclusao> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }
  if (ids.length === 0) return { ok: true, erro: null }

  const { data: fotos, error: erroFotos } = await sb
    .from('motorcycle_images')
    .select('src')
    .in('motorcycle_id', ids)
  if (erroFotos) {
    return {
      ok: false,
      erro: `Não foi possível ler as fotos antes de apagar: ${erroFotos.message}`,
    }
  }

  const { data: apagadas, error } = await sb
    .from('motorcycles')
    .delete()
    .in('id', ids)
    .not('lixeira_em', 'is', null)
    .select('id')
  if (error) return { ok: false, erro: mensagemLixeira(error) }

  const apagadasIds = new Set(((apagadas ?? []) as { id: string }[]).map((linha) => linha.id))
  if (apagadasIds.size === 0) {
    return {
      ok: false,
      erro: 'Nenhuma moto foi apagada. Atualize o painel e tente de novo.',
    }
  }
  const restantes = ids.filter((id) => !apagadasIds.has(id))

  const caminhos = (fotos ?? [])
    .map((f: { src?: string }) => (f.src ? caminhoDeBucket(f.src) : null))
    .filter((c): c is string => c !== null)

  let aviso: string | null = null
  if (caminhos.length > 0) {
    const { error: erroStorage } = await sb.storage.from(BUCKET_FOTOS).remove(caminhos)
    if (erroStorage) {
      aviso = `As fichas saíram do banco, mas ${caminhos.length} foto(s) ficaram no bucket "motos". Remova pelo painel do Supabase.`
    }
  }

  if (restantes.length > 0) {
    const texto = `${restantes.length} moto(s) já não estavam na lixeira e foram mantidas.`
    aviso = aviso ? `${texto} ${aviso}` : texto
  }

  return { ok: true, erro: null, aviso }
}

/** Apaga uma única moto da lixeira (atalho do caso mais comum). */
export async function excluirMotoDefinitivamente(id: string): Promise<ResultadoExclusao> {
  return excluirMotosDefinitivamente([id])
}

/**
 * Apaga do Storage as fotos que saíram do formulário.
 *
 * Roda só depois de `salvarMoto` dar certo. Apagar no clique de "remover"
 * deixaria a moto já gravada apontando para um arquivo que não existe caso
 * o dono cancelasse a edição — a ficha ficaria com imagem quebrada.
 *
 * Fotos locais do seed (`/motos/...`) não estão no bucket e são ignoradas
 * por `caminhoDeBucket`.
 */
export async function excluirFotosRemovidas(
  antes: { src: string }[],
  depois: { src: string }[],
): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  const mantidas = new Set(depois.map((f) => f.src))
  const caminhos = antes
    .map((f) => f.src)
    .filter((src) => !mantidas.has(src))
    .map(caminhoDeBucket)
    .filter((c): c is string => c !== null)

  if (caminhos.length > 0) {
    await sb.storage.from(BUCKET_FOTOS).remove(caminhos)
  }
}

/** Altera somente o status (usado nos atalhos do painel). */
export async function atualizarStatus(
  id: string,
  status: MotorcycleStatus,
): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const { error } = await sb.from('motorcycles').update({ status }).eq('id', id)
  return error ? { ok: false, erro: error.message } : { ok: true, erro: null }
}

/** Converte uma moto para o formato do formulário de edição. */
export function motoParaFormulario(m: Motorcycle): MotoParaSalvar {
  return {
    slug: m.slug,
    marca: m.marca,
    modelo: m.modelo,
    ano: m.ano,
    preco: m.preco,
    quilometragem: m.quilometragem,
    cilindrada: m.cilindrada,
    categoria: m.categoria,
    descricao: m.descricao,
    especificacoes: m.especificacoes,
    imagens: m.imagens,
    emPromocao: m.emPromocao,
    precoAntes: m.precoAntes,
    status: m.status,
  }
}

export { urlPublica }
