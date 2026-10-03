import { describe, expect, it } from 'vitest'
import { linhaParaMotos, montarSlug, motoParaFormulario, slugificar } from './catalog'
import type { Motorcycle } from '../types'

/**
 * Cobre a borda entre o formato do Postgres (numeric como string, jsonb
 * com-shape livre) e o formato que as páginas do site esperam.
 *
 * Os testes rodam sem Supabase: exercitam só as funções puras. O
 * comportamento com banco real precisa ser validado com um projeto de
 * teste — ver docs/SUPABASE.md.
 */

const linhaBase = {
  id: 'uuid-1',
  slug: 'honda-xre-300-2021',
  marca: 'Honda',
  modelo: 'XRE 300',
  ano: 2021,
  preco: 31900,
  quilometragem: 32000,
  cilindrada: 291,
  categoria: 'Trail',
  descricao: 'Trail versátil.',
  especificacoes: [{ label: 'Motor', value: 'Mono OHc' }],
  imagens: [{ src: '/motos/honda-xre-300-2021/01.webp', alt: 'frontal' }],
  destaque: false,
  disponibilidade: 'disponivel',
}

describe('linhaParaMotos', () => {
  it('mantém os campos quando a linha já está no formato do site', () => {
    const moto = linhaParaMotos(linhaBase)
    expect(moto.slug).toBe('honda-xre-300-2021')
    expect(moto.preco).toBe(31900)
    expect(moto.categoria).toBe('Trail')
    expect(moto.especificacoes).toHaveLength(1)
  })

  it('converte numeric vindo como string do PostgREST', () => {
    const moto = linhaParaMotos({ ...linhaBase, preco: '31900.00', ano: '2021' as unknown as number })
    expect(moto.preco).toBe(31900)
    expect(moto.ano).toBe(2021)
  })

  it('preserva quilometragem e cilindrada nulas', () => {
    const moto = linhaParaMotos({ ...linhaBase, quilometragem: null, cilindrada: null })
    expect(moto.quilometragem).toBeNull()
    expect(moto.cilindrada).toBeNull()
  })

  it('normaliza jsonb vazio ou nulo sem quebrar as páginas', () => {
    const moto = linhaParaMotos({
      ...linhaBase,
      especificacoes: null as unknown as [],
      imagens: null as unknown as [],
    })
    // As páginas fazem .map() direto nestas listas: se vier null, quebraria.
    expect(moto.especificacoes).toEqual([])
    expect(moto.imagens).toEqual([])
  })

  it('descarta item de foto sem src e completa o alt com o modelo', () => {
    const moto = linhaParaMotos({
      ...linhaBase,
      imagens: [{ src: '/a.webp' }, { src: '' }, {}],
    })
    expect(moto.imagens).toHaveLength(1)
    expect(moto.imagens[0].alt).toBe('XRE 300')
  })

  it('descarta especificação incompleta', () => {
    const moto = linhaParaMotos({
      ...linhaBase,
      especificacoes: [{ label: 'Motor', value: 'Mono' }, { label: 'Câmbio' }, null],
    })
    expect(moto.especificacoes).toEqual([{ label: 'Motor', value: 'Mono' }])
  })

  it('normaliza destaque vindo como 0/1 do Postgres', () => {
    expect(linhaParaMotos({ ...linhaBase, destaque: 1 as unknown as boolean }).destaque).toBe(true)
    expect(linhaParaMotos({ ...linhaBase, destaque: 0 as unknown as boolean }).destaque).toBe(false)
  })
})

describe('slugificar', () => {
  it('remove acentos e espaços do tipo "CG 160" e "VentoX"', () => {
    expect(slugificar('CG 160')).toBe('cg-160')
    expect(slugificar('VentoX 150')).toBe('ventox-150')
  })

  it('não deixa barra nem caractere especial na URL', () => {
    expect(slugificar('XTZ 250 / Landu')).not.toMatch(/[^a-z0-9-]/)
  })

  it('devolve string vazia quando não sobra nada utilizável', () => {
    expect(slugificar('---')).toBe('')
  })
})

describe('montarSlug', () => {
  it('junta marca, modelo e ano', () => {
    expect(montarSlug('Honda', 'XRE 300', 2021)).toBe('honda-xre-300-2021')
  })

  it('usa a marca como prefixo quando o modelo é igual a ela', () => {
    // Evitaria "yamaha-yamaha-150-2020".
    expect(montarSlug('Yamaha', 'Yamaha', 2020)).toBe('yamaha-2020')
  })
})

describe('motoParaFormulario', () => {
  const moto: Motorcycle = linhaParaMotos(linhaBase)

  it('mantém o slug para o admin não perder a URL ao editar', () => {
    expect(motoParaFormulario(moto).slug).toBe('honda-xre-300-2021')
  })

  it('preserva especificações e fotos para reenvio sem alteração', () => {
    const form = motoParaFormulario(moto)
    expect(form.especificacoes).toEqual(moto.especificacoes)
    expect(form.imagens).toEqual(moto.imagens)
  })
})