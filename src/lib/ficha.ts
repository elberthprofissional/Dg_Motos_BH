import type { Motorcycle } from '../types'
import { fichaDeReferencia } from '../data/fichasModelo'
import { bikeTitle, formatKm } from './format'

/**
 * Texto de apoio quando a unidade não tem descrição nem ficha de linha.
 * Só afirma o que está cadastrado — nada sobre estado, revisão ou dono.
 */
function textoDeApoio(bike: Motorcycle): string {
  const km =
    bike.quilometragem != null
      ? ` O odômetro marca ${formatKm(bike.quilometragem)}.`
      : ''
  const cilindrada = bike.cilindrada ? `, ${bike.cilindrada} cc` : ''
  return `${bikeTitle(bike)} ${bike.ano}${cilindrada}, cadastrada no estoque da DG Motos em Belo Horizonte.${km} Fale com a loja para conferir o estado, a documentação e as condições de pagamento.`
}

/** Parágrafos da descrição pública: a da loja, a da linha ou o apoio. */
export function descricaoDe(bike: Motorcycle): string[] {
  const daLoja = bike.descricao.trim()
  if (daLoja) {
    return daLoja
      .split(/\n{2,}/)
      .map((paragrafo) => paragrafo.trim())
      .filter(Boolean)
  }

  return fichaDeReferencia(bike)?.descricao ?? [textoDeApoio(bike)]
}
