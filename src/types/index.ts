export type MotorcycleCategory =
  | 'Street'
  | 'Trail'
  | 'Naked'
  | 'Scooter'
  | 'Esportiva'
  | 'Custom'

/**
 * Situação da moto no estoque.
 *   disponivel  → aparece no site e pode ser comprada
 *   vendida     → saiu do estoque (não aparece no site)
 *   indisponivel → existe, mas está fora de linha no momento
 */
export type MotorcycleStatus = 'disponivel' | 'vendida' | 'indisponivel'

export interface MotorcycleSpec {
  label: string
  value: string
}

export interface MotorcycleImage {
  /** Caminho em /public (ex.: /motos/xre-300-2021/frente.jpg) ou URL do Supabase Storage */
  src: string
  alt: string
}

export interface Motorcycle {
  id: string
  slug: string
  marca: string
  modelo: string
  ano: number
  preco: number
  quilometragem: number | null
  cilindrada: number | null
  categoria: MotorcycleCategory
  descricao: string
  especificacoes: MotorcycleSpec[]
  imagens: MotorcycleImage[]
  destaque: boolean
  status: MotorcycleStatus
  /**
   * ISO do primeiro cadastro, preenchido só quando a moto vem do banco.
   * O fallback de `src/data/motorcycles.ts` não tem created_at — por isso
   * opcional, e por isso o painel nunca deve assumir que existe.
   */
  criadoEm?: string
  /** ISO da última alteração, preenchido só quando a moto vem do banco. */
  atualizadoEm?: string
}

export type BikeSort = 'relevancia' | 'preco-asc' | 'preco-desc' | 'ano-desc'

export interface BikeFilterState {
  busca: string
  marca: string
  precoMax: number
  anoMin: number
  categoria: MotorcycleCategory | 'todas'
  ordenacao: BikeSort
}
