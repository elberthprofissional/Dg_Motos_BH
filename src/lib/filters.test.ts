import { describe, expect, it } from 'vitest'
import { motorcycles } from '../data/motorcycles'
import { ANO_MAX, ANO_MIN, FILTROS_PADRAO, filtrarMotos, temFiltroAtivo } from './filters'
import type { BikeFilterState } from '../types'

const COM_TODAS = FILTROS_PADRAO

const com = (patch: Partial<BikeFilterState>): BikeFilterState => ({ ...COM_TODAS, ...patch })

describe('filtrarMotos', () => {
  it('devolve o catálogo inteiro sem filtros', () => {
    expect(filtrarMotos(motorcycles, COM_TODAS)).toHaveLength(motorcycles.length)
  })

  it('nunca exibe moto vendida', () => {
    const vendas = motorcycles.filter((m) => m.disponibilidade === 'vendida')
    const slugs = filtrarMotos(motorcycles, COM_TODAS).map((m) => m.slug)
    for (const v of vendas) expect(slugs).not.toContain(v.slug)
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
    expect(temFiltroAtivo(com({ precoMax: 20000 }))).toBe(true)
    expect(temFiltroAtivo(com({ anoMin: 2021 }))).toBe(true)
    expect(temFiltroAtivo(com({ categoria: 'Trail' }))).toBe(true)
    expect(temFiltroAtivo(com({ ordenacao: 'preco-asc' }))).toBe(true)
  })
})