import { formatarNumeroBR, parseNumeroBR } from '../../../lib/format'

/**
 * ============================================================
 * NÚMEROS ALIMENTADOS POR CAMPO DE TEXTO
 * ============================================================
 * Km, cilindrada e preço chegam como texto e saem como número
 * (ou null). Os helpers moram aqui para as seções do formulário
 * lerem e escreverem os mesmos tipos sem duplicar regra.
 */

/** Converte "32.500", "32.500 km" ou "291,6" em número; texto solto vira null. */
export function numeroOuNulo(texto: string): number | null {
  return parseNumeroBR(texto)
}

/**
 * Km e cilindrada: 0 é o mesmo que não preenchido.
 *
 * O campo mostra vazio para zero, então o estado também não pode
 * guardar zero — senão a lista diverge do que o dono vê na tela.
 */
export function positivoOuNulo(texto: string): number | null {
  const n = numeroOuNulo(texto)
  return n != null && n > 0 ? n : null
}

/** Número pronto para o campo (vazio se não preenchido, BR quando há). */
export function textoInicial(valor: number | null): string {
  return valor == null || valor === 0 ? '' : formatarNumeroBR(valor)
}
