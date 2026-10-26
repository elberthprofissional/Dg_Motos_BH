import { describe, expect, it } from 'vitest'
import { chaveDoModelo, fichaDeReferencia } from './fichasModelo'

describe('chaveDoModelo', () => {
  it('ignora caixa, acentos e espaços repetidos', () => {
    expect(chaveDoModelo('  HONDA ', 'XRE   RÁLLY 300')).toBe('honda|xre rally 300')
  })
})

describe('fichaDeReferencia', () => {
  it('encontra a ficha da XRE Rally 300', () => {
    const ficha = fichaDeReferencia({ marca: 'Honda', modelo: 'XRE Rally 300' })
    expect(ficha?.modelo).toBe('XRE Rally 300')
    expect(ficha?.grupos).toHaveLength(3)
    expect(ficha?.descricao.length).toBeGreaterThan(0)
  })

  it('encontra a ficha quando o modelo repete a marca', () => {
    const ficha = fichaDeReferencia({ marca: 'Honda', modelo: 'Honda XRE Rally 300' })
    expect(ficha?.modelo).toBe('XRE Rally 300')
  })

  it('devolve null para um modelo sem ficha verificada', () => {
    expect(fichaDeReferencia({ marca: 'Yamaha', modelo: 'Fazer 250' })).toBeNull()
  })
})
