import { formatPrice, precoEmConferencia } from '../../lib/format'

/**
 * Preço do anúncio compacto (lista de "outras motos" e meta
 * descrição da ficha). Fica aqui porque a página e a lista de
 * recomendadas precisam dizer a mesma coisa.
 */
export function precoDeLista(preco: number): string {
  return precoEmConferencia(preco) ? 'Sob consulta' : formatPrice(preco)
}
