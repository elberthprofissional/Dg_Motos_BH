import { describe, expect, it } from 'vitest'
import { positivoOuNulo, textoInicial } from './valores'

/**
 *
 * Km e cilindrada chegam como texto e viram número (ou null). Zero,
 * negativo e lixo de texto significam "não preenchido" — a lista do
 * banco não pode guardar 0 que a tela mostra vazio.
 */

describe('positivoOuNulo', () => {
  it('lê números brasileiros e sufixos falados (mil, reais)', () => {
    expect(positivoOuNulo('32.500')).toBe(32500)
    expect(positivoOuNulo('291,6')).toBe(291.6)
    expect(positivoOuNulo('32 mil')).toBe(32000)
    expect(positivoOuNulo('32.500 reais')).toBe(32500)
    // sufixo que não é número: lixo, como o botão do km manual não digita
    expect(positivoOuNulo('32.500 km')).toBeNull()
  })

  it('vira null em vazio, zero, negativo e lixo', () => {
    expect(positivoOuNulo('')).toBeNull()
    expect(positivoOuNulo('0')).toBeNull()
    expect(positivoOuNulo('-10')).toBeNull()
    expect(positivoOuNulo('não sei')).toBeNull()
  })
})

describe('textoInicial', () => {
  it('vazio para null e zero; BR quando tem valor', () => {
    expect(textoInicial(null)).toBe('')
    expect(textoInicial(0)).toBe('')
    expect(textoInicial(32500)).toBe(formatarNumero(32500))
  })
})

function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor)
}
