import type { MotoParaSalvar } from '../../../lib/catalog'

/**
 * ============================================================
 * VALIDAÇÃO DO FORMULÁRIO DE MOTO
 * ============================================================
 * Funções puras, testáveis sem render: `avaliarMoto` devolve o
 * primeiro erro humano ou null quando o form está prático para
 * o banco. O banco continua sendo a barreira final — aqui só
 * adiantamos a resposta.
 */

export const ANO_MINIMO = 1980

/** Ano do modelo seguinte: a loja já anuncia a moto do ano que vem. */
export const ANO_MAXIMO = new Date().getFullYear() + 1

/**
 * Ano plausível, com folga para o modelo seguinte. `min`/`max` do input
 * não seguram submit programático, e o form é `noValidate` — então a
 * barreira é aqui.
 */
export function anoValido(ano: number): boolean {
  return Number.isInteger(ano) && ano >= ANO_MINIMO && ano <= ANO_MAXIMO
}

/**
 * Estado de fábrica de uma moto nova em edição nenhuma.
 */
export const VAZIO: MotoParaSalvar = {
  slug: '',
  marca: '',
  modelo: '',
  ano: new Date().getFullYear(),
  preco: 0,
  quilometragem: null,
  cilindrada: null,
  descricao: '',
  especificacoes: [],
  imagens: [],
  emPromocao: false,
  precoAntes: null,
  status: 'disponivel',
}

/**
 * Primeiro erro de preenchimento, com mensagem humana ao dono,
 * ou null quando dá pra chamar o banco.
 */
export function avaliarMoto(form: MotoParaSalvar): string | null {
  if (!form.marca.trim() || !form.modelo.trim()) {
    return 'Faltou marca ou modelo.'
  }
  if (!anoValido(form.ano)) {
    return `Informe o ano da moto — entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`
  }
  if (!Number.isFinite(form.preco) || form.preco <= 0) {
    return 'Informe o preço de venda da moto — por exemplo, 23.000.'
  }
  // O banco também barreira isso (check da promoção), mas o erro viria
  // cru do Postgres: valida aqui dá mensagem humana ao dono.
  if (form.emPromocao && (form.precoAntes == null || form.precoAntes <= form.preco)) {
    return 'Pra anunciar em promoção, o preço "de" precisa estar preenchido e ser maior que o "por".'
  }
  return null
}
