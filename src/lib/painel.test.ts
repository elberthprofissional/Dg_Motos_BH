import { describe, expect, it } from 'vitest'
import { motorcycles } from '../data/motorcycles'
import { contarPorStatus, filtrarEstoque, resumirEstoque, tempoRelativo } from './painel'
import type { Motorcycle } from '../types'

const base = (patch: Partial<Motorcycle>): Motorcycle => ({
  id: patch.slug ?? 'id',
  slug: 'moto',
  marca: 'Honda',
  modelo: 'CG 160',
  ano: 2022,
  preco: 15000,
  quilometragem: null,
  cilindrada: 160,
  categoria: 'Street',
  descricao: '',
  especificacoes: [],
  imagens: [],
  destaque: false,
  status: 'disponivel',
  ...patch,
})

describe('filtrarEstoque', () => {
  it('sem busca e status "todas" devolve o estoque inteiro', () => {
    const todas = filtrarEstoque(motorcycles, { busca: '', status: 'todas' })
    expect(todas).toHaveLength(motorcycles.length)
  })

  it('filtra por status', () => {
    const lista = [
      base({ slug: 'a', status: 'disponivel' }),
      base({ slug: 'b', status: 'vendida' }),
      base({ slug: 'c', status: 'indisponivel' }),
    ]
    expect(filtrarEstoque(lista, { busca: '', status: 'vendida' }).map((m) => m.slug)).toEqual(['b'])
  })

  it('busca ignora acento e maiúsculas', () => {
    const lista = [base({ slug: 'a', modelo: 'XRE 300' }), base({ slug: 'b', modelo: 'Fazer' })]
    expect(filtrarEstoque(lista, { busca: 'xre', status: 'todas' }).map((m) => m.slug)).toEqual(['a'])
  })

  it('combina busca e status', () => {
    const lista = [
      base({ slug: 'a', modelo: 'XRE 300', status: 'vendida' }),
      base({ slug: 'b', modelo: 'XRE 190', status: 'disponivel' }),
    ]
    const r = filtrarEstoque(lista, { busca: 'xre', status: 'disponivel' })
    expect(r.map((m) => m.slug)).toEqual(['b'])
  })

  it('termo ausente devolve lista vazia', () => {
    expect(filtrarEstoque(motorcycles, { busca: 'bmw', status: 'todas' })).toEqual([])
  })
})

describe('resumirEstoque', () => {
  it('conta por status e soma os valores', () => {
    const lista: Motorcycle[] = [
      base({ slug: 'a', status: 'disponivel', preco: 10000 }),
      base({ slug: 'b', status: 'disponivel', preco: 20000 }),
      base({ slug: 'c', status: 'vendida', preco: 30000 }),
      base({ slug: 'd', status: 'indisponivel', preco: 40000 }),
    ]
    const r = resumirEstoque(lista)
    expect(r).toEqual({
      total: 4,
      disponiveis: 2,
      indisponiveis: 1,
      vendidas: 1,
      valorDisponivel: 30000,
      valorEmEstoque: 70000,
      valorTotal: 100000,
    })
    expect(contarPorStatus(r, 'vendida')).toBe(1)
    expect(r.valorEmEstoque).toBe(r.valorDisponivel + 40000)
  })
})

describe('tempoRelativo', () => {
  const agora = new Date('2026-01-10T12:00:00Z')

  it('descreve minutos, horas, dias e meses', () => {
    expect(tempoRelativo('2026-01-10T11:59:30Z', agora)).toBe('agora')
    expect(tempoRelativo('2026-01-10T11:45:00Z', agora)).toBe('há 15 min')
    expect(tempoRelativo('2026-01-10T09:00:00Z', agora)).toBe('há 3 h')
    expect(tempoRelativo('2026-01-08T12:00:00Z', agora)).toBe('há 2 dias')
    expect(tempoRelativo('2025-11-10T12:00:00Z', agora)).toBe('há 2 meses')
  })

  it('devolve "data inválida" para texto não parseável', () => {
    expect(tempoRelativo('ontem', agora)).toBe('data inválida')
  })
})
