import type { Motorcycle, MotorcycleAvailability, MotorcycleCategory, MotorcycleSpec } from '../types'
import { getSupabase } from './supabase'
import { urlPublica } from './supabase'

/**
 * ============================================================
 * CATÁLOGO — leitura e escrita
 * ============================================================
 *
 * Fonte de verdade: o Postgres (tabela `motorcycles`).
 *
 * O arquivo src/data/motorcycles.ts continua existindo como **fallback**
 * para quando o Supabase não está configurado ou está fora do ar. Isso
 * mantém o site no ar mesmo com o banco derrubado — o que importa para
 * uma loja que perde venda por site fora do ar.
 */

interface LinhaCatalogo {
  id: string
  slug: string
  marca: string
  modelo: string
  ano: number
  preco: number | string
  quilometragem: number | null
  cilindrada: number | null
  categoria: string
  descricao: string
  especificacoes: unknown
  imagens: unknown
  destaque: boolean
  disponibilidade: string
  created_at?: string | null
  preco_compra?: number | string | null
  vendido_em?: string | null
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
  const fotos = Array.isArray(linha.imagens) ? linha.imagens : []

  return {
    id: linha.id,
    slug: linha.slug,
    marca: linha.marca,
    modelo: linha.modelo,
    ano: Number(linha.ano),
    preco: Number(linha.preco),
    quilometragem: linha.quilometragem == null ? null : Number(linha.quilometragem),
    cilindrada: linha.cilindrada == null ? null : Number(linha.cilindrada),
    categoria: linha.categoria as MotorcycleCategory,
    descricao: linha.descricao ?? '',
    especificacoes: specs.filter(
      (s): s is MotorcycleSpec => typeof s?.label === 'string' && typeof s?.value === 'string',
    ),
    imagens: fotos
      // `src` vazio também é string: sem este teste, entraria um item
      // quebrado e o componente de imagem renderizaria <img src="">.
      .filter(
        (f): f is { src: string; alt?: unknown } =>
          typeof f?.src === 'string' && f.src.trim().length > 0,
      )
      .map((f) => ({ src: f.src, alt: typeof f.alt === 'string' ? f.alt : linha.modelo })),
    destaque: Boolean(linha.destaque),
    disponibilidade: linha.disponibilidade as MotorcycleAvailability,
    criadoEm: linha.created_at ?? undefined,
    precoCompra:
      linha.preco_compra == null ? null : Number(linha.preco_compra) || null,
    vendidoEm: linha.vendido_em ?? null,
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
 * Busca o catálogo completo.
 *
 * Motos vendidas vêm junto de propósito: o dono precisa vê-las no admin
 * para poder reativar. Quem filtra é a página pública, em filtrarMotos().
 */
export async function buscarCatalogo(): Promise<ResultadoCatalogo> {
  const sb = getSupabase()
  if (!sb) {
    return { motos: [], doBanco: false, erro: 'Supabase não configurado neste deploy.' }
  }

  const { data, error } = await sb
    .from('motorcycles')
    .select('*')
    .order('ano', { ascending: false })

  if (error) {
    return { motos: [], doBanco: false, erro: error.message }
  }

  return { motos: ((data ?? []) as LinhaCatalogo[]).map(linhaParaMotos), doBanco: true, erro: null }
}

export interface MotoParaSalvar {
  slug: string
  marca: string
  modelo: string
  ano: number
  preco: number
  /** Custo de aquisição; null = dono não controla. */
  precoCompra: number | null
  quilometragem: number | null
  cilindrada: number | null
  categoria: MotorcycleCategory
  descricao: string
  especificacoes: MotorcycleSpec[]
  imagens: { src: string; alt: string }[]
  destaque: boolean
  disponibilidade: MotorcycleAvailability
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

export async function salvarMoto(
  dados: MotoParaSalvar,
  id?: string,
): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const payload = {
    slug: dados.slug,
    marca: dados.marca,
    modelo: dados.modelo,
    ano: dados.ano,
    preco: dados.preco,
    preco_compra: dados.precoCompra,
    quilometragem: dados.quilometragem,
    cilindrada: dados.cilindrada,
    categoria: dados.categoria,
    descricao: dados.descricao,
    especificacoes: dados.especificacoes,
    imagens: dados.imagens,
    destaque: dados.destaque,
    disponibilidade: dados.disponibilidade,
  }

  const query = id
    ? sb.from('motorcycles').update(payload).eq('id', id)
    : sb.from('motorcycles').insert(payload)

  const { error } = await query
  return error
    ? { ok: false, erro: error.message }
    : { ok: true, erro: null }
}

export async function excluirMoto(id: string): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const { error } = await sb.from('motorcycles').delete().eq('id', id)
  return error ? { ok: false, erro: error.message } : { ok: true, erro: null }
}

/**
 * Marca a moto como vendida e registra a data da venda (usada no
 * financeiro e no tempo médio de venda).
 */
export async function marcarComoVendida(
  id: string,
): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const { error } = await sb
    .from('motorcycles')
    .update({ disponibilidade: 'vendida', vendido_em: new Date().toISOString() })
    .eq('id', id)
  return error ? { ok: false, erro: error.message } : { ok: true, erro: null }
}

/**
 * Grava um lead antes de abrir o WhatsApp.
 *
 * Falha de envio não pode travar o atendimento: se o banco estiver
 * fora, o visitante ainda precisa falar com a loja. Por isso o erro é
 * devolvido, mas o fluxo do form continua.
 */
export async function registrarLead(dados: {
  tipo: 'financiamento' | 'troca'
  nome: string
  telefone: string
  dados: Record<string, unknown>
  origem: string
}): Promise<{ ok: boolean; erro: string | null }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }

  const { error } = await sb.from('leads').insert({
    tipo: dados.tipo,
    nome: dados.nome,
    telefone: dados.telefone,
    dados: dados.dados,
    origem: dados.origem,
  })
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
    precoCompra: m.precoCompra ?? null,
    quilometragem: m.quilometragem,
    cilindrada: m.cilindrada,
    categoria: m.categoria,
    descricao: m.descricao,
    especificacoes: m.especificacoes,
    imagens: m.imagens,
    destaque: m.destaque,
    disponibilidade: m.disponibilidade,
  }
}

export { urlPublica }