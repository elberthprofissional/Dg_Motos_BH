import type { EntregaRegistro } from '../../../data/entregas'

/**
 * ============================================================
 * MURAL — datas e faltas do rascunho
 * ============================================================
 * Funções puras do mural de publicações, fora do componente para o
 * arquivo principal ficar com o estado e a orquestração.
 */

export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function dataCurta(data: string): string {
  if (!data) return ''
  const valor = new Date(`${data}T12:00:00`)
  if (Number.isNaN(valor.valueOf())) return ''
  return `${valor.getDate()} ${MESES_CURTOS[valor.getMonth()]} ${valor.getFullYear()}`
}

/** Rascunho antigo só trava por falta de foto: é o único que falta. */
export function faltasDoRascunho(post: EntregaRegistro): string | null {
  return post.fotos.length === 0 ? 'Falta uma foto' : null
}
