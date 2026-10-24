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
  /**
   * O preço de referência ("de") da promoção, riscado no site. Só faz
   * sentido quando `emPromocao` é true — o formulário já garante isso,
   * mas quem consome deve tratar null independentemente.
   */
  precoAntes: number | null
  /**
   * Moto em promoção: ganha o selo circular de desconto, o preço
   * "de → por" e sai na frente na vitrine (no lugar do antigo destaque).
   */
  emPromocao: boolean
  quilometragem: number | null
  cilindrada: number | null
  categoria: MotorcycleCategory
  descricao: string
  especificacoes: MotorcycleSpec[]
  imagens: MotorcycleImage[]
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
  /** Modelo escolhido em cascata (só os do marca escolhida). Vazio = todos. */
  modelo: string
  precoMin: number
  precoMax: number
  anoMin: number
  categoria: MotorcycleCategory | 'todas'
  ordenacao: BikeSort
}
