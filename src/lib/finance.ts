/**
 * Cálculo de parcelamento — sistema Price (juros compostos).
 *
 * Funções puras, sem dependência de React, para poderem ser testadas
 * isoladamente (ver src/lib/finance.test.ts).
 */

/**
 * Taxa mensal ESTIMADA, apenas para simulação ilustrativa.
 * Condições reais vêm da instituição financeira na análise de crédito.
 */
export const JUROS_MENSAL_ESTIMADO = 0.0149

export const PARCELAS = [12, 24, 36, 48, 60] as const

export type Parcela = (typeof PARCELAS)[number]

export interface Simulacao {
  entrada: number
  financiado: number
  parcela: number
  total: number
}

/**
 * Parcela fixa de um financiamento (sistema Price).
 * Com juros zero, degrada para a divisão simples.
 */
export function calcularParcela(valor: number, i: number, n: number): number {
  if (n <= 0) return 0
  if (i <= 0) return valor / n
  return (valor * i) / (1 - Math.pow(1 + i, -n))
}

/**
 * Simula um financiamento com entrada percentual.
 * Valores são arredondados para reais inteiros, como o banco apresenta.
 */
export function simularFinanciamento(
  preco: number,
  entradaPct: number,
  parcelas: number,
  jurosMensal = JUROS_MENSAL_ESTIMADO,
): Simulacao {
  const entrada = Math.round((preco * entradaPct) / 100)
  const financiado = preco - entrada
  const parcela = Math.round(calcularParcela(financiado, jurosMensal, parcelas))
  return { entrada, financiado, parcela, total: entrada + parcela * parcelas }
}