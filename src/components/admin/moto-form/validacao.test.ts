import { describe, expect, it } from 'vitest'
import { VAZIO, ANO_MAXIMO, ANO_MINIMO, anoValido, avaliarMoto } from './validacao'
import type { MotoParaSalvar } from '../../../lib/catalog'

/**
 * O form é `noValidate`, então quem barra o submit é `avaliarMoto`:
 * um erro por vez, na ordem que o dono preenche — identificação,
 * ano, preço, promoção. O banco continua sendo a barreira final.
 */

const motoBase = (): MotoParaSalvar => ({ ...VAZIO })

describe('janela de anos', () => {
  it(`aceita de ${ANO_MINIMO} até ${ANO_MAXIMO} (modelo seguinte)`, () => {
    expect(anoValido(ANO_MINIMO)).toBe(true)
    expect(anoValido(ANO_MAXIMO)).toBe(true)
  })

  it('recusa fora da janela, decimais e zero', () => {
    expect(anoValido(ANO_MINIMO - 1)).toBe(false)
    expect(anoValido(ANO_MAXIMO + 1)).toBe(false)
    expect(anoValido(2022.5)).toBe(false)
    expect(anoValido(0)).toBe(false)
  })
})

describe('avaliarMoto', () => {
  it('moto nova completa não gera erro', () => {
    const moto = motoBase()
    moto.marca = 'Honda'
    moto.modelo = 'CG 160'
    moto.preco = 17900
    expect(avaliarMoto(moto)).toBeNull()
  })

  it('falta de marca ou modelo pede os dois', () => {
    expect(avaliarMoto(VAZIO)).toBe('Faltou marca ou modelo.')

    const semModelo = motoBase()
    semModelo.marca = 'Honda'
    expect(avaliarMoto(semModelo)).toBe('Faltou marca ou modelo.')
  })

  it('ano fora da janela devolve o intervalo válido', () => {
    const moto = motoBase()
    moto.marca = 'Honda'
    moto.modelo = 'CG 160'
    moto.preco = 17900
    moto.ano = ANO_MAXIMO + 1
    expect(avaliarMoto(moto)).toContain('entre 1980 e')
  })

  it('preço zero, negativo ou NaN é sempre erro', () => {
    const moto = motoBase()
    moto.marca = 'Honda'
    moto.modelo = 'CG 160'
    moto.ano = 2022
    expect(avaliarMoto(moto)).toContain('Informe o preço de venda')
    moto.preco = -50
    expect(avaliarMoto(moto)).toContain('Informe o preço de venda')
    moto.preco = Number.NaN
    expect(avaliarMoto(moto)).toContain('Informe o preço de venda')
  })

  it('promoção exige um "de" maior que o "por"', () => {
    const moto = motoBase()
    moto.marca = 'Honda'
    moto.modelo = 'CG 160'
    moto.ano = 2022
    moto.preco = 17900
    moto.emPromocao = true
    expect(avaliarMoto(moto)).toContain('o preço "de" precisa')

    moto.precoAntes = 17900 // igual ao "por": não é promoção
    expect(avaliarMoto(moto)).toContain('o preço "de" precisa')

    moto.precoAntes = 19000 // "de" maior: certo
    expect(avaliarMoto(moto)).toBeNull()
  })

  it('sem promoção ativa, o "de" faltando não importa', () => {
    const moto = motoBase()
    moto.marca = 'Honda'
    moto.modelo = 'CG 160'
    moto.ano = 2022
    moto.preco = 17900
    moto.precoAntes = null
    moto.emPromocao = false
    expect(avaliarMoto(moto)).toBeNull()
  })
})
