import { describe, expect, it } from 'vitest'
import { motorcycles } from '../data/motorcycles'
import {
  contarPorStatus,
  diasAteApagar,
  diasAteApagarDesde,
  filtrarEstoque,
  filtrarVendas,
  lucroPorMes,
  motosAtivas,
  motosNaLixeira,
  motosVencidasNaLixeira,
  resumirEstoque,
  resumirVendas,
  tempoRelativo,
  rotuloMes,
} from './painel'
import type { Motorcycle, Venda } from '../types'

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
  emPromocao: false,
  precoAntes: null,
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

  it('não conta nem soma o que está na lixeira', () => {
    const lista: Motorcycle[] = [
      base({ slug: 'a', status: 'disponivel', preco: 10000 }),
      base({ slug: 'b', status: 'vendida', preco: 90000, lixeiraEm: '2026-10-20T12:00:00Z' }),
    ]
    const r = resumirEstoque(lista)
    expect(r.total).toBe(1)
    expect(r.vendidas).toBe(0)
    expect(r.valorTotal).toBe(10000)
  })
})

describe('lixeira', () => {
  const lista: Motorcycle[] = [
    base({ slug: 'ativa' }),
    base({ slug: 'antiga', lixeiraEm: '2026-01-01T00:00:00Z' }),
    base({ slug: 'recente', lixeiraEm: '2026-02-01T00:00:00Z' }),
  ]

  it('separa as ativas das excluídas', () => {
    expect(motosAtivas(lista).map((m) => m.slug)).toEqual(['ativa'])
    expect(motosNaLixeira(lista).map((m) => m.slug)).toEqual(['recente', 'antiga'])
  })

  it('conta os dias que faltam para a exclusão automática', () => {
    const agora = new Date('2026-02-11T12:00:00Z')
    // 10 dias inteiros na lixeira → faltam 20 de 30.
    expect(diasAteApagar(base({ slug: 'x', lixeiraEm: '2026-02-01T00:00:00Z' }), agora)).toBe(20)
    // Fora da lixeira não expira.
    expect(diasAteApagar(base({ slug: 'y' }), agora)).toBeNull()
    // Data quebrada não vira prazo zero (senão apagaria o que não devia).
    expect(diasAteApagar(base({ slug: 'z', lixeiraEm: 'ontem' }), agora)).toBeNull()
  })

  it('vence o prazo aos 30 dias, nunca antes', () => {
    const cheia = base({ slug: 'cheia', lixeiraEm: '2026-02-08T00:00:00Z' }) // 30 dias
    const vencida = base({ slug: 'vencida', lixeiraEm: '2026-02-01T00:00:00Z' }) // 37 dias
    const noLimite = base({ slug: 'no-limite', lixeiraEm: '2026-02-09T00:00:00Z' }) // 29 dias
    const agora = new Date('2026-03-10T00:00:00Z')

    expect(diasAteApagar(cheia, agora)).toBe(0)
    expect(diasAteApagar(noLimite, agora)).toBe(1)
    expect(motosVencidasNaLixeira([cheia, vencida, noLimite], agora).map((m) => m.slug)).toEqual([
      'cheia',
      'vencida',
    ])
    // Um dia antes dos 30, nada é apagado.
    expect(motosVencidasNaLixeira([cheia], new Date('2026-03-09T00:00:00Z'))).toHaveLength(0)
  })

  it('calcula o prazo de qualquer item com data de baixa', () => {
    const agora = new Date('2026-02-11T12:00:00Z')
    // Fotos do mural usam a mesma conta, a partir de `apagadaEm`.
    expect(diasAteApagarDesde('2026-02-01T00:00:00Z', agora)).toBe(20)
    expect(diasAteApagarDesde('2026-01-01T00:00:00Z', agora)).toBe(0)
    expect(diasAteApagarDesde(null, agora)).toBeNull()
    expect(diasAteApagarDesde('ontem', agora)).toBeNull()
  })
})

const venda = (patch: Partial<Venda>): Venda => ({
  id: patch.valor?.toString() ?? 'v',
  motoId: null,
  marca: 'Honda',
  modelo: 'CG 160',
  ano: 2022,
  valor: 15000,
  formaPagamento: 'pix',
  comprador: null,
  telefone: null,
  custo: 12000,
  vendidaEm: '2026-01-05T12:00:00Z',
  ...patch,
})

describe('resumirVendas', () => {
  it('soma faturamento e lucro, ignorando venda sem custo no lucro', () => {
    const r = resumirVendas([
      venda({ id: 'a', valor: 16000, custo: 12000 }),
      venda({ id: 'b', valor: 10000, custo: 8000 }),
      venda({ id: 'c', valor: 9000, custo: null }),
    ])
    expect(r.quantidade).toBe(3)
    expect(r.faturamento).toBe(35000)
    expect(r.lucro).toBe(6000)
    expect(r.comCusto).toBe(2)
    expect(r.ticketMedio).toBe(Math.round(35000 / 3))
  })

  it('lista vazia devolve zeros e ticket médio 0', () => {
    expect(resumirVendas([])).toEqual({
      quantidade: 0,
      faturamento: 0,
      lucro: 0,
      comCusto: 0,
      ticketMedio: 0,
    })
  })
})

describe('lucroPorMes', () => {
  it('agrupa por mês na ordem cronológica e soma faturamento', () => {
    const r = lucroPorMes([
      venda({ id: 'a', valor: 16000, custo: 12000, vendidaEm: '2026-02-01T00:00:00Z' }),
      venda({ id: 'b', valor: 10000, custo: 8000, vendidaEm: '2026-01-01T00:00:00Z' }),
      venda({ id: 'c', valor: 5000, custo: null, vendidaEm: '2026-01-20T00:00:00Z' }),
    ])
    expect(r).toEqual([
      { mes: '2026-01', lucro: 2000, faturamento: 15000 },
      { mes: '2026-02', lucro: 4000, faturamento: 16000 },
    ])
  })
})

describe('filtrarVendas', () => {
  const lista = [
    venda({ id: 'a', modelo: 'CG 160', vendidaEm: '2026-01-05T00:00:00Z' }),
    venda({ id: 'b', modelo: 'XRE 300', vendidaEm: '2026-02-05T00:00:00Z' }),
  ]

  it('filtra por mês e por busca de comprador', () => {
    expect(filtrarVendas(lista, { busca: '', mes: '2026-02' }).map((v) => v.id)).toEqual(['b'])
    expect(filtrarVendas([{ ...lista[0], comprador: 'João' }], { busca: 'joao', mes: 'todas' })).toHaveLength(1)
  })
})

describe('rotuloMes', () => {
  it('formata yyyy-MM em jan/2026 e devolve o original se inacabado', () => {
    expect(rotuloMes('2026-01')).toBe('jan/2026')
    expect(rotuloMes('2026-12')).toBe('dez/2026')
    expect(rotuloMes('x')).toBe('x')
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
