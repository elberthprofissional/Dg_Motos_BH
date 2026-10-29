import type { Motorcycle, MotorcycleStatus, MotorcycleSpec } from '../../types'
import { getSupabase } from '../supabase'

/**
 * ============================================================
 * CATÁLOGO — leitura
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
 *
 * Escrita mora em `./escrita`; Storage e exclusão definitiva, em `./fotos`.
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
  /** Colunas da promoção (01_esquema.sql); opcionais para banco antigo. */
  em_promocao?: boolean | number | null
  preco_antes?: number | string | null
  quilometragem: number | null
  cilindrada: number | null
  descricao: string
  especificacoes: unknown
  status: string
  created_at?: string | null
  updated_at?: string | null
  /** Coluna da lixeira (01_esquema.sql); ausente em banco antigo. */
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
  'id, slug, marca, modelo, ano, preco, em_promocao, preco_antes, quilometragem, cilindrada, descricao, especificacoes, status, created_at, updated_at'

const COLUNAS_IMAGENS = 'motorcycle_images(src, alt, posicao)'

/** Select usado em toda leitura: a moto + as fotos já ordenadas. */
const SELECT_MOTO = `${COLUNAS_MOTO}, lixeira_em, ${COLUNAS_IMAGENS}`

/** Select para banco que ainda não tem a coluna da lixeira. */
const SELECT_MOTO_SEM_LIXEIRA = `${COLUNAS_MOTO}, ${COLUNAS_IMAGENS}`

function colunaDaLixeiraAusente(error: { code?: string; message: string }): boolean {
  return error.code === '42703' || /lixeira_em/i.test(error.message)
}

/** Erro de banco sem a coluna da lixeira vira instrução, não stack trace. */
export function mensagemLixeira(error: { code?: string; message: string }): string {
  if (colunaDaLixeiraAusente(error)) {
    return 'A coluna da lixeira ainda não existe no banco. Rode supabase/migrations/01_esquema.sql no SQL Editor do Supabase.'
  }
  return error.message
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

  try {    // Novidade no topo: o estoque ganha motos o tempo todo, e ordenar
    // só por ano juntava tudo do mesmo ano sem revelar o que chegou.
    // `created_at` primeiro (o que entrou por último), ano desempata.
    const primeira = await sb
      .from('motorcycles')
      .select(SELECT_MOTO)
      .order('created_at', { ascending: false, nullsFirst: false })
      .order('ano', { ascending: false })

    // Banco que ainda não tem a coluna da lixeira: lê sem ela em vez
    // de deixar o painel inteiro sem catálogo.
    const resposta =
      primeira.error && colunaDaLixeiraAusente(primeira.error)
        ? await sb
            .from('motorcycles')
            .select(SELECT_MOTO_SEM_LIXEIRA)
            .order('created_at', { ascending: false, nullsFirst: false })
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
