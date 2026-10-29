import type { Motorcycle, MotorcycleSpec, MotorcycleStatus } from '../../types'
import { getSupabase } from '../supabase'
import { mensagemLixeira } from './leitura'

/**
 * ============================================================
 * CATÁLOGO — escrita
 * ============================================================
 * Cadastro da moto, slug, status e lixeira. Leitura mora em
 * `./leitura`; Storage e exclusão definitiva, em `./fotos`.
 */

export interface MotoParaSalvar {
  slug: string
  marca: string
  modelo: string
  ano: number
  preco: number
  quilometragem: number | null
  cilindrada: number | null
  descricao: string
  especificacoes: MotorcycleSpec[]
  imagens: { src: string; alt: string }[]
  emPromocao: boolean
  precoAntes: number | null
  status: MotorcycleStatus
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
 * Devolve o próximo endereço livre a partir da lista do que já existe.
 *
 * Duas unidades do mesmo modelo e ano são normais num pátio: a primeira
 * fica com `marca-modelo-ano`, a segunda ganha `-2`, a terceira `-3`…
 * Pega o sufixo mais alto + 1, que nunca colide com nada da lista.
 * `slugBase` é regex seguro por construção: só tem `[a-z0-9-]` e nunca
 * termina em hífen — por isso a âncora não precisa de escape.
 */
export function proximoSlug(slugBase: string, existentes: string[]): string {
  let maior = 0
  for (const slug of existentes) {
    if (slug === slugBase) {
      maior = Math.max(maior, 1)
      continue
    }
    const sufixo = new RegExp(`^${slugBase}-(\\d+)$`).exec(slug)
    if (sufixo) maior = Math.max(maior, Number(sufixo[1]))
  }
  return maior === 0 ? slugBase : `${slugBase}-${maior + 1}`
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
    return 'O banco ainda não tem a rotina que grava as fotos. Rode supabase/migrations/03_funcoes.sql no SQL Editor do Supabase.'
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
    // Em vez de tentar a sorte (o loop antigo inseria, levava 23505,
    // incrementava e inseria de novo — até 50 round-trips), uma consulta
    // `ilike` traz quem já usa o endereço e `proximoSlug` responde na
    // hora. Sobra um retry curto só para a corrida de dois cadastros ao
    // mesmo tempo (o dono salvando em dois aparelhos): re-consulta e
    // insere de novo. Três voltas bastam — se não der, é outro problema.
    const MAX_TENTATIVAS = 3
    let slug = slugBase
    let erro: { code?: string; message: string } | null = null

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      if (tentativa > 1) {
        // Recomeça do banco: alguém ocupou o endereço entre a consulta
        // e a inserção. Só re-consulta quando isso acontecer.
        const consulta = await sb
          .from('motorcycles')
          .select('slug')
          .ilike('slug', `${slugBase}%`)
        if (consulta.error) return { ok: false, erro: consulta.error.message }
        slug = proximoSlug(
          slugBase,
          (consulta.data ?? []).map((linha) => linha.slug),
        )
      }

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

    if (!motoId) {
      return {
        ok: false,
        erro: erro?.message ?? `Não foi possível reservar o endereço da moto.`,
      }
    }
  }

  const erroImagens = await salvarImagens(motoId!, dados.imagens)
  return erroImagens ? { ok: false, erro: erroImagens } : { ok: true, erro: null }
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
    descricao: m.descricao,
    especificacoes: m.especificacoes,
    imagens: m.imagens,
    emPromocao: m.emPromocao,
    precoAntes: m.precoAntes,
    status: m.status,
  }
}
