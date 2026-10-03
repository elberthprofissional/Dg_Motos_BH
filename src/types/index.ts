export type MotorcycleCategory =
  | 'Street'
  | 'Trail'
  | 'Naked'
  | 'Scooter'
  | 'Esportiva'
  | 'Custom'

export type MotorcycleAvailability = 'disponivel' | 'reservada' | 'vendida'

export interface MotorcycleSpec {
  label: string
  value: string
}

export interface MotorcycleImage {
  /** Caminho em /public (ex.: /motos/xre-300-2021/frente.jpg) */
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
  disponibilidade: MotorcycleAvailability
  /**
   * ISO do primeiro cadastro, preenchido só quando a moto vem do banco.
   * O fallback de `src/data/motorcycles.ts` não tem created_at — por isso
   * opcional, e por isso o painel nunca deve assumir que existe.
   */
  criadoEm?: string
  /**
   * Quanto a loja PAGOU na moto. Opcional: quem não quiser controlar
   * custo simplesmente deixa vazio — o financeiro soma só o que tem.
   */
  precoCompra?: number | null
  /** ISO da venda (preenchido pelo painel ao marcar como vendida). */
  vendidoEm?: string | null
}

export type BikeSort = 'relevancia' | 'preco-asc' | 'preco-desc' | 'ano-desc'

export interface BikeFilterState {
  busca: string
  precoMax: number
  anoMin: number
  categoria: MotorcycleCategory | 'todas'
  ordenacao: BikeSort
}
