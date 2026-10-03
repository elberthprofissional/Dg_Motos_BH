import type { Motorcycle, MotorcycleCategory } from '../types'
import type { BikeFilterState } from '../types'

export const PRECO_MAX = 60000
export const PRECO_MIN = 5000
export const ANO_MIN = 2015
export const ANO_MAX = 2026

export const ORDENACOES: { value: BikeFilterState['ordenacao']; label: string }[] = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'preco-asc', label: 'Menor preço' },
  { value: 'preco-desc', label: 'Maior preço' },
  { value: 'ano-desc', label: 'Mais recentes (ano)' },
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
  precoMax: PRECO_MAX,
  anoMin: ANO_MIN,
  categoria: 'todas',
  ordenacao: 'relevancia',
}

export function filtrarMotos(
  motos: Motorcycle[],
  f: BikeFilterState,
): Motorcycle[] {
  const busca = f.busca.trim().toLowerCase()

  const filtradas = motos.filter((m) => {
    if (m.disponibilidade === 'vendida') return false
    if (f.precoMax < PRECO_MAX && m.preco > f.precoMax) return false
    if (f.anoMin > ANO_MIN && m.ano < f.anoMin) return false
    if (f.categoria !== 'todas' && m.categoria !== f.categoria) return false
    if (busca) {
      const alvo = `${m.marca} ${m.modelo} ${m.ano}`.toLowerCase()
      if (!alvo.includes(busca)) return false
    }
    return true
  })

  const porRelevancia = (a: Motorcycle, b: Motorcycle) =>
    Number(b.destaque) - Number(a.destaque) || b.ano - a.ano

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
    f.precoMax < PRECO_MAX ||
    f.anoMin > ANO_MIN ||
    f.categoria !== 'todas' ||
    f.ordenacao !== 'relevancia'
  )
}
