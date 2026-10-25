import type { Motorcycle } from '../types'

export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatKm(km: number | null): string {
  if (km == null) return 'Km a confirmar'
  return `${km.toLocaleString('pt-BR')} km`
}

/** Mensagem para interesse em uma moto específica (spec do projeto). */
export function buildBikeMessage(marca: string, modelo: string, ano: number): string {
  return `Olá! Tenho interesse na ${nomeExibicao(marca, modelo)} ${ano} anunciada no site da DG Motos. Gostaria de receber mais informações.`
}

/** CTA geral de negociação. */
export function buildDefaultMessage(): string {
  return 'Olá! Vim pelo site da DG Motos e gostaria de negociar uma motocicleta.'
}

/**
 * "março de 2026" a partir da data da entrega (YYYY-MM-DD).
 *
 * O meio-dia evita que o fuso de Brasília empurre a data para o dia
 * anterior quando o navegador está em UTC.
 */
export function mesDaEntrega(valor?: string): string | null {
  if (!valor) return null
  const data = new Date(`${valor}T12:00:00`)
  if (Number.isNaN(data.valueOf())) return null
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(data)
}

export function bikeTitle(bike: Motorcycle): string {
  return nomeExibicao(bike.marca, bike.modelo)
}

export function bikeModelName(bike: Motorcycle): string {
  const marca = bike.marca.trim()
  const titulo = nomeExibicao(bike.marca, bike.modelo)
  return marca ? titulo.slice(marca.length).trim() : titulo
}

/** Valores muito acima de R$ 1 milhão são preservados, mas pedem confirmação antes da negociação. */
export function precoRequerConfirmacao(preco: number): boolean {
  return preco >= 1_000_000
}

function nomeExibicao(marcaInformada: string, modeloInformado: string): string {
  const marca = marcaInformada.trim()
  let modelo = modeloInformado.trim()

  // O banco pode guardar o nome completo no campo de modelo. Remova
  // repetições iniciais apenas na apresentação, sem regravar o cadastro.
  while (marca && modelo.toLocaleLowerCase('pt-BR').startsWith(marca.toLocaleLowerCase('pt-BR'))) {
    modelo = modelo.slice(marca.length).trim()
  }

  return [marca, modelo].filter(Boolean).join(' ')
}

/**
 * Desconto da promoção, em % inteiro — é o que aparece no selo circular
 * ("-15%") no card e na ficha. Fora da promoção, sem "de" informado ou
 * com "de" maior que o "por" (desconto negativo), volta null e o card
 * desenha o preço comum sem selo.
 */
export function descontoPercentual(bike: Motorcycle): number | null {
  if (!bike.emPromocao || bike.precoAntes == null) return null
  if (bike.precoAntes <= bike.preco) return null
  return Math.round((1 - bike.preco / bike.precoAntes) * 100)
}
