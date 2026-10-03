import { describe, expect, it } from 'vitest'
import { JUROS_MENSAL_ESTIMADO, calcularParcela, simularFinanciamento } from './finance'

describe('calcularParcela', () => {
  it('sem juros divide o valor pelo número de parcelas', () => {
    expect(calcularParcela(12000, 0, 12)).toBe(1000)
  })

  it('com juros retorna valor maior que a divisão simples', () => {
    const comJuros = calcularParcela(12000, 0.0149, 12)
    expect(comJuros).toBeGreaterThan(1000)
  })

  it('parcela cresce aoAlongar o prazo', () => {
    const curto = calcularParcela(20000, JUROS_MENSAL_ESTIMADO, 12)
    const longo = calcularParcela(20000, JUROS_MENSAL_ESTIMADO, 60)
    expect(longo).toBeLessThan(curto)
  })

  it('parcela sobe ao aumentar a taxa, com prazo fixo', () => {
    // Prazo constante: juro maior encarece a parcela (Price).
    const barato = calcularParcela(20000, 0.01, 48)
    const caro = calcularParcela(20000, 0.02, 48)
    expect(caro).toBeGreaterThan(barato)
  })

  it('devolve zero em prazo inválido em vez de NaN', () => {
    expect(calcularParcela(10000, 0.0149, 0)).toBe(0)
  })

  it('nunca devolve NaN', () => {
    for (const n of [1, 12, 36, 60, 120]) {
      expect(Number.isNaN(calcularParcela(31900, JUROS_MENSAL_ESTIMADO, n))).toBe(false)
    }
  })
})

describe('simularFinanciamento', () => {
  it('divide preço em entrada e financiado', () => {
    const s = simularFinanciamento(20000, 20, 48)
    expect(s.entrada).toBe(4000)
    expect(s.financiado).toBe(16000)
  })

  it('total é entrada mais as parcelas', () => {
    const s = simularFinanciamento(31900, 20, 48)
    expect(s.total).toBe(s.entrada + s.parcela * 48)
  })

  it('entrada zero financia o preço inteiro', () => {
    const s = simularFinanciamento(13900, 0, 12)
    expect(s.entrada).toBe(0)
    expect(s.financiado).toBe(13900)
  })

  it('entrada 100% zera o financiado e a parcela', () => {
    const s = simularFinanciamento(13900, 100, 48)
    expect(s.financiado).toBe(0)
    expect(s.parcela).toBe(0)
    expect(s.total).toBe(13900)
  })

  it('mais parcelas significa parcela menor', () => {
    const curto = simularFinanciamento(31900, 20, 12)
    const longo = simularFinanciamento(31900, 20, 60)
    expect(longo.parcela).toBeLessThan(curto.parcela)
  })

  it('mais entrada significa parcela menor', () => {
    const pouca = simularFinanciamento(31900, 10, 48)
    const muita = simularFinanciamento(31900, 40, 48)
    expect(muita.parcela).toBeLessThan(pouca.parcela)
  })

  it('devolve valores inteiros, como o banco apresenta', () => {
    const s = simularFinanciamento(31900, 20, 48)
    expect(Number.isInteger(s.entrada)).toBe(true)
    expect(Number.isInteger(s.parcela)).toBe(true)
  })
})