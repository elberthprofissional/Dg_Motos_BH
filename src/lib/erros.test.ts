import { describe, expect, it } from 'vitest'
import { falhaDeCarregamento } from './erros'

describe('falhaDeCarregamento', () => {
  it('reconhece o erro de chunk do Chrome', () => {
    expect(
      falhaDeCarregamento(
        new Error('Failed to fetch dynamically imported module: https://x/assets/Admin-abc.js'),
      ),
    ).toBe(true)
  })

  it('reconhece as variantes de Firefox e Safari', () => {
    expect(falhaDeCarregamento(new Error('error loading dynamically imported module'))).toBe(true)
    expect(falhaDeCarregamento(new Error('Importing a module script failed.'))).toBe(true)
    expect(falhaDeCarregamento(new Error('Loading chunk 42 failed.'))).toBe(true)
  })

  it('não confunde erro comum com falha de chunk', () => {
    expect(falhaDeCarregamento(new Error('Algo deu errado ao salvar.'))).toBe(false)
    expect(falhaDeCarregamento(null)).toBe(false)
    expect(falhaDeCarregamento(undefined)).toBe(false)
  })
})
