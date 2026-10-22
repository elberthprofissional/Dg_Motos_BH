import { describe, expect, it } from 'vitest'
import { motorcycles } from '../data/motorcycles'
import {
  ANO_MAX,
  ANO_MIN,
  FILTROS_PADRAO,
  PRECO_MIN,
  filtrarMotos,
  modelosDisponiveis,
  temFiltroAtivo,
} from './filters'
import type { BikeFilterState } from '../types'

const COM_TODAS = FILTROS_PADRAO

const com = (patch: Partial<BikeFilterState>): BikeFilterState => ({ ...COM_TODAS, ...patch })

describe('filtrarMotos', () => {
  it('devolve o catálogo inteiro sem filtros', () => {
    expect(filtrarMotos(motorcycles, COM_TODAS)).toHaveLength(motorcycles.length)
  })

  it('nunca exibe moto vendida nem indisponível', () => {
    const fora = motorcycles.filter((m) => m.status !== 'disponivel')
    const slugs = filtrarMotos(motorcycles, COM_TODAS).map((m) => m.slug)
    for (const m of fora) expect(slugs).not.toContain(m.slug)
  })

  it('filtra por marca', () => {
    const hondas = filtrarMotos(motorcycles, com({ marca: 'Honda' }))
    expect(hondas.length).toBeGreaterThan(0)
    for (const m of hondas) expect(m.marca).toBe('Honda')
  })

  it('busca por marca e modelo, sem diferenciar maiúsculas', () => {
    const resultado = filtrarMotos(motorcycles, com({ busca: 'xre' })).map((m) => m.modelo)
    expect(resultado).toContain('XRE 300')
  })

  it('busca ignora espaços em volta', () => {
    const a = filtrarMotos(motorcycles, com({ busca: '  honda  ' }))
    const b = filtrarMotos(motorcycles, com({ busca: 'honda' }))
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
  })

  it('busca por termo ausente retorna lista vazia', () => {
    expect(filtrarMotos(motorcycles, com({ busca: 'bmw' }))).toEqual([])
  })

  it('filtra por categoria', () => {
    const trails = filtrarMotos(motorcycles, com({ categoria: 'Trail' }))
    expect(trails.length).toBeGreaterThan(0)
    for (const m of trails) expect(m.categoria).toBe('Trail')
  })

  it('filtra por preço máximo', () => {
    const teto = 15000
    for (const m of filtrarMotos(motorcycles, com({ precoMax: teto }))) {
      expect(m.preco).toBeLessThanOrEqual(teto)
    }
  })

  it('filtra por preço mínimo', () => {
    const piso = 25000
    for (const m of filtrarMotos(motorcycles, com({ precoMin: piso }))) {
      expect(m.preco).toBeGreaterThanOrEqual(piso)
    }
  })

  it('faixa de preço completa não restringe o catálogo', () => {
    expect(
      filtrarMotos(motorcycles, com({ precoMin: PRECO_MIN, precoMax: 60000 })),
    ).toHaveLength(motorcycles.length)
  })

  it('filtra por modelo', () => {
    const resultado = filtrarMotos(motorcycles, com({ modelo: 'XRE 300' }))
    expect(resultado.length).toBeGreaterThan(0)
    for (const m of resultado) expect(m.modelo).toBe('XRE 300')
  })

  it('filtra por ano mínimo', () => {
    const piso = 2022
    for (const m of filtrarMotos(motorcycles, com({ anoMin: piso }))) {
      expect(m.ano).toBeGreaterThanOrEqual(piso)
    }
  })

  it('preço no teto padrão (60k) não restringe o catálogo', () => {
    // O valor inicial do slider precisa se comportar como "sem filtro".
    expect(filtrarMotos(motorcycles, com({ precoMax: 60000 }))).toHaveLength(
      motorcycles.length,
    )
  })

  it('ordena por preço crescente', () => {
    const precos = filtrarMotos(motorcycles, com({ ordenacao: 'preco-asc' })).map((m) => m.preco)
    expect(precos).toEqual([...precos].sort((a, b) => a - b))
  })

  it('ordena por preço decrescente', () => {
    const precos = filtrarMotos(motorcycles, com({ ordenacao: 'preco-desc' })).map((m) => m.preco)
    expect(precos).toEqual([...precos].sort((a, b) => b - a))
  })

  it('ordena por ano decrescente', () => {
    const anos = filtrarMotos(motorcycles, com({ ordenacao: 'ano-desc' })).map((m) => m.ano)
    expect(anos).toEqual([...anos].sort((a, b) => b - a))
  })

  it('relevância põe destaques na frente', () => {
    const primeiro = filtrarMotos(motorcycles, com({ ordenacao: 'relevancia' }))[0]
    expect(primeiro.destaque).toBe(true)
  })

  it('não muta o array original', () => {
    const antes = [...motorcycles]
    filtrarMotos(motorcycles, com({ ordenacao: 'preco-asc' }))
    expect(motorcycles).toEqual(antes)
  })

  it('combina busca, categoria e ordenação', () => {
    const resultado = filtrarMotos(
      motorcycles,
      com({ busca: 'yamaha', categoria: 'Trail', ordenacao: 'preco-asc' }),
    )
    for (const m of resultado) {
      expect(m.marca).toBe('Yamaha')
      expect(m.categoria).toBe('Trail')
    }
  })

  it('anos do catálogo ficam dentro das faixas dos sliders', () => {
    for (const m of motorcycles) {
      expect(m.ano).toBeGreaterThanOrEqual(ANO_MIN)
      expect(m.ano).toBeLessThanOrEqual(ANO_MAX)
    }
  })
})

describe('temFiltroAtivo', () => {
  it('detecta estado padrão como sem filtro', () => {
    expect(temFiltroAtivo(COM_TODAS)).toBe(false)
  })

  it('detecta busca com espaços como filtro inativo', () => {
    expect(temFiltroAtivo(com({ busca: '   ' }))).toBe(false)
  })

  it('detecta cada filtro individualmente', () => {
    expect(temFiltroAtivo(com({ busca: 'honda' }))).toBe(true)
    expect(temFiltroAtivo(com({ marca: 'Honda' }))).toBe(true)
    expect(temFiltroAtivo(com({ modelo: 'XRE 300' }))).toBe(true)
    expect(temFiltroAtivo(com({ precoMin: 10000 }))).toBe(true)
    expect(temFiltroAtivo(com({ precoMax: 20000 }))).toBe(true)
    expect(temFiltroAtivo(com({ anoMin: 2021 }))).toBe(true)
    expect(temFiltroAtivo(com({ categoria: 'Trail' }))).toBe(true)
    expect(temFiltroAtivo(com({ ordenacao: 'preco-asc' }))).toBe(true)
  })
})

describe('modelosDisponiveis', () => {
  it('sem marca, devolve modelos de todas as marcas', () => {
    const modelos = modelosDisponiveis(motorcycles, '')
    expect(modelos).toContain('XRE 300')
    expect([...modelos]).toEqual([...modelos].sort((a, b) => a.localeCompare(b, 'pt-BR')))
  })

  it('com marca, devolve só os modelos dela', () => {
    const modelos = modelosDisponiveis(motorcycles, 'Honda')
    expect(modelos.length).toBeGreaterThan(0)
    for (const modelo of modelos) {
      expect(
        motorcycles.some((m) => m.marca === 'Honda' && m.modelo === modelo),
      ).toBe(true)
    }
  })

  it('marca sem nenhuma moto no estoque devolve lista vazia', () => {
    expect(modelosDisponiveis(motorcycles, 'Beto')).toEqual([])
  })
})