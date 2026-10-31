import type { Motorcycle } from '../../../types'
import { diasNaLoja } from '../../../lib/painel'
import { formatKm } from '../../../lib/format'

/**
 * ============================================================
 * ESTOQUE — ordenação, ficha curta e tempo na loja
 * ============================================================
 * Funções puras da aba, fora do componente para o arquivo principal
 * ficar com estado e orquestração.
 */

/* Vendida não é situação de estoque: a moto sai do pátio e passa a
   viver na aba Vendidas. Por isso não há filtro "Vendidas" aqui. */
export type OrdemEstoque = 'padrao' | 'preco-desc' | 'preco-asc' | 'ano-desc'

export const ORDENS: { valor: OrdemEstoque; rotulo: string }[] = [
  { valor: 'padrao', rotulo: 'Ordem padrão' },
  { valor: 'preco-desc', rotulo: 'Maior preço' },
  { valor: 'preco-asc', rotulo: 'Menor preço' },
  { valor: 'ano-desc', rotulo: 'Mais novo' },
]

export function ordenarEstoque(motos: Motorcycle[], ordem: OrdemEstoque): Motorcycle[] {
  if (ordem === 'preco-desc') return [...motos].sort((a, b) => b.preco - a.preco)
  if (ordem === 'preco-asc') return [...motos].sort((a, b) => a.preco - b.preco)
  if (ordem === 'ano-desc') return [...motos].sort((a, b) => b.ano - a.ano)
  return [...motos].sort(
    (a, b) =>
      Number(b.emPromocao) - Number(a.emPromocao) ||
      b.ano - a.ano ||
      a.modelo.localeCompare(b.modelo, 'pt-BR'),
  )
}

export function fichaTecnica(moto: Motorcycle): string[] {
  const itens = [String(moto.ano)]
  if (moto.cilindrada != null) itens.push(`${moto.cilindrada} cc`)
  if (moto.quilometragem != null) itens.push(formatKm(moto.quilometragem))
  return itens
}

/**
 * Há quanto tempo a moto está na loja, em dias. É o número que mostra
 * o que está encalhando — vale mais que repetir "Disponível" na linha.
 */
export function rotuloNaLoja(moto: Motorcycle): string {
  const dias = diasNaLoja(moto)
  if (dias == null) return 'Sem data'
  if (dias === 0) return 'Hoje'
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`
}
