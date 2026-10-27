import type { Motorcycle } from '../types'
import { fichaDeReferencia } from '../data/fichasModelo'

/**
 * Parágrafos da descrição pública: o que a loja escreveu manda.
 * Sem texto da loja, entra a ficha da linha; sem ficha, fica em
 * branco — nenhum texto “de apoio” no lugar de quem estava calado.
 */
export function descricaoDe(bike: Motorcycle): string[] {
  const daLoja = bike.descricao.trim()
  if (daLoja) {
    return daLoja
      .split(/\n{2,}/)
      .map((paragrafo) => paragrafo.trim())
      .filter(Boolean)
  }

  return fichaDeReferencia(bike)?.descricao ?? []
}
