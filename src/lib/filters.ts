import type { Motorcycle, MotorcycleCategory } from '../types'
import type { BikeFilterState } from '../types'

export const PRECO_MAX = 60000
/** Piso da busca: 0 = "sem chão", a faixa abre do zero como a Barroca. */
export const PRECO_MIN = 0
export const ANO_MIN = 2015
export const ANO_MAX = 2026

export const ORDENACOES: { value: BikeFilterState['ordenacao']; label: string }[] = [
  { value: 'ano-desc', label: 'Mais recentes' },
  { value: 'preco-asc', label: 'Menor preço' },
  { value: 'preco-desc', label: 'Maior preço' },
  { value: 'relevancia', label: 'Relevância' },
]

export const CATEGORIAS: MotorcycleCategory[] = [
  'Street',
  'Trail',
  'Naked',
  'Scooter',
  'Esportiva',
  'Custom',
]

export const FILTROS_PADRAO: BikeFilterState = {
  busca: '',
  marca: '',
  modelo: '',
  precoMin: PRECO_MIN,
  precoMax: PRECO_MAX,
  anoMin: ANO_MIN,
  categoria: 'todas',
  ordenacao: 'relevancia',
}

/**
 * Marcas presentes no estoque, para popular o filtro sem exigir uma lista
 * fixa em código (a loja pode receber qualquer marca).
 */
export function marcasDisponiveis(motos: Motorcycle[]): string[] {
  return [...new Set(motos.map((m) => m.marca.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

/**
 * Categorias presentes no estoque, na ordem canônica de CATEGORIAS.
 *
 * O filtro público só oferece o que existe de verdade: um chip "Scooter"
 * sem nenhuma scooter no catálogo é um filtro que sempre leva ao estado
 * vazio — ruído, não ajuda. Quem consome decide: com menos de duas
 * categorias distintas não vale mostrar o controle.
 */
export function categoriasDisponiveis(motos: Motorcycle[]): MotorcycleCategory[] {
  const presentes = new Set(motos.map((m) => m.categoria).filter(Boolean))
  return CATEGORIAS.filter((c) => presentes.has(c))
}

/**
 * Modelos presentes no estoque para a marca escolhida (ou de todas as
 * marcas, quando nenhuma foi escolhida). O <select> de modelo só é útil
 * com a marca na mão — sem ela é uma lista genuína de centenas de
 * modelos, e esse controle não ajuda ninguém.
 */
export function modelosDisponiveis(motos: Motorcycle[], marca: string): string[] {
  const alvo = marca.trim().toLowerCase()
  return [
    ...new Set(
      motos
        .filter((m) => !alvo || m.marca.toLowerCase() === alvo)
        .map((m) => m.modelo.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function filtrarMotos(
  motos: Motorcycle[],
  f: BikeFilterState,
): Motorcycle[] {
  const busca = f.busca.trim().toLowerCase()

  const filtradas = motos.filter((m) => {
    // O catálogo público só mostra o que está realmente à venda.
    if (m.status !== 'disponivel') return false
    if (f.marca && m.marca !== f.marca) return false
    if (f.modelo && m.modelo.trim() !== f.modelo) return false
    if (f.precoMin > PRECO_MIN && m.preco < f.precoMin) return false
    if (f.precoMax < PRECO_MAX && m.preco > f.precoMax) return false
    if (f.anoMin > ANO_MIN && m.ano < f.anoMin) return false
    if (f.categoria !== 'todas' && m.categoria !== f.categoria) return false
    if (busca) {
      const alvo = `${m.marca} ${m.modelo} ${m.ano}`.toLowerCase()
      if (!alvo.includes(busca)) return false
    }
    return true
  })

  // Promoção manda: a moto com preço de "por" sai na frente e o restante
  // fica na ordem de chegada do ano — relevância para quem está vendendo.
  const porRelevancia = (a: Motorcycle, b: Motorcycle) =>
    Number(b.emPromocao) - Number(a.emPromocao) || b.ano - a.ano

  switch (f.ordenacao) {
    case 'preco-asc':
      return filtradas.sort((a, b) => a.preco - b.preco)
    case 'preco-desc':
      return filtradas.sort((a, b) => b.preco - a.preco)
    case 'ano-desc':
      return filtradas.sort((a, b) => b.ano - a.ano)
    default:
      return filtradas.sort(porRelevancia)
  }
}

export function temFiltroAtivo(f: BikeFilterState): boolean {
  return (
    f.busca.trim() !== '' ||
    f.marca !== '' ||
    f.modelo !== '' ||
    f.precoMin > PRECO_MIN ||
    f.precoMax < PRECO_MAX ||
    f.anoMin > ANO_MIN ||
    f.categoria !== 'todas' ||
    f.ordenacao !== 'relevancia'
  )
}
