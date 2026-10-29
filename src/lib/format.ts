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
  return `Olá! Vi a ${nomeExibicao(marca, modelo)} ${ano} no site da DG Motos e quero saber mais sobre ela.`
}

/** CTA geral de negociação. */
export function buildDefaultMessage(): string {
  return 'Olá! Vim pelo site da DG Motos e quero saber mais sobre as motos.'
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

export function bikeTitle(bike: Pick<Motorcycle, 'marca' | 'modelo'>): string {
  return nomeExibicao(bike.marca, bike.modelo)
}

/**
 * Descrição pública da moto, antes do preço: o mesmo texto no site e
 * no HTML pré-renderizado. `bikeTitle` remove a marca repetida no nome
 * do modelo, então as duas versões mostram o mesmo nome.
 */
export function resumoPublico(
  bike: Pick<Motorcycle, 'marca' | 'modelo' | 'ano' | 'quilometragem'>,
): string {
  const km = bike.quilometragem != null ? ` com ${formatKm(bike.quilometragem)}` : ''
  return `${bikeTitle(bike)} ${bike.ano}${km} na DG Motos, em Belo Horizonte.`
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

/**
 * Preço abaixo de R$ 1.000 numa moto quase sempre é digitação incompleta
 * ("23" no lugar de "23.000"). Não bloqueia o cadastro: sinaliza para o
 * dono conferir antes de anunciar.
 */
export function precoPareceIncompleto(preco: number): boolean {
  return !Number.isFinite(preco) || preco < 1_000
}

/** Preço fora do anúncio público: valor incompleto ou alto demais. */
export function precoEmConferencia(preco: number): boolean {
  return precoPareceIncompleto(preco) || precoRequerConfirmacao(preco)
}

/**
 * Lê valor digitado no formato brasileiro, do jeito que o dono escreve:
 * "23.000", "23.000,50", "R$ 23 mil", "291,6". Ponto com exatamente três
 * dígitos depois é milhar; ponto com outra quantidade é decimal — é o que
 * permite "23.000" virar 23000 e "291.6" continuar 291,6.
 */
export function parseNumeroBR(texto: string): number | null {
  let limpo = texto
    .toLowerCase()
    .replace(/r\$/g, '')
    .replace(/\s+/g, '')
    .replace(/reais?$/, '')
  if (!limpo) return null

  let multiplicador = 1
  if (/milh(?:ão|oes|ões)$/.test(limpo)) {
    limpo = limpo.replace(/milh(?:ão|oes|ões)$/, '')
    multiplicador = 1_000_000
  } else if (limpo.endsWith('mil')) {
    limpo = limpo.slice(0, -3)
    multiplicador = 1_000
  }

  if (!/^[\d.,]+$/.test(limpo) || !/\d/.test(limpo)) return null

  let normalizado: string
  if (limpo.includes(',')) {
    if ((limpo.match(/,/g) ?? []).length > 1) return null
    normalizado = limpo.replace(/\./g, '').replace(',', '.')
  } else if (limpo.includes('.')) {
    const partes = limpo.split('.')
    if (partes.some((parte) => parte === '')) return null
    const gruposDeMilhar = partes.slice(1).every((parte) => parte.length === 3)
    if (gruposDeMilhar) {
      normalizado = partes.join('')
    } else if (partes.length === 2) {
      normalizado = `${partes[0]}.${partes[1]}`
    } else {
      return null
    }
  } else {
    normalizado = limpo
  }

  const valor = Number(normalizado)
  if (!Number.isFinite(valor)) return null
  return valor * multiplicador
}

/** Número para o campo de edição: milhar com ponto, decimal com vírgula. */
export function formatarNumeroBR(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
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
