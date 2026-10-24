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
   * Quanto a loja pagou na moto (dado do painel, nunca aparece no
   * site). Alimenta o cálculo de lucro na aba Vendas. Opcional:
   * sem custo, a moto não entra na conta de lucro — só no faturamento.
   */
  custoCompra?: number | null
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

/**
 * Formas de pagamento aceitas no registro da venda. 'outra' é o
 * retranco para "corpo a corpo": a loja cobra como quiser, o painel
 * só precisa saber rótulo.
 */
export type FormaPagamento = 'pix' | 'dinheiro' | 'financiamento' | 'cartao' | 'outra'

export const ROTULO_PAGAMENTO: Record<FormaPagamento, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  financiamento: 'Financiado',
  cartao: 'Cartão',
  outra: 'Outra',
}

/**
 * Venda registrada no painel. Os dados da moto são FOTO (gravados no
 * dia): se a moto for excluída depois, o histórico fica íntegro.
 */
export interface Venda {
  id: string
  motoId: string | null
  marca: string
  modelo: string
  ano: number
  valor: number
  formaPagamento: FormaPagamento
  comprador: string | null
  telefone: string | null
  /** Custo de compra na data da venda; null = sem custo conhecido. */
  custo: number | null
  /** ISO da data em que a venda foi registrada. */
  vendidaEm: string
}

export interface VendaParaSalvar {
  motoId: string | null
  marca: string
  modelo: string
  ano: number
  valor: number
  formaPagamento: FormaPagamento
  comprador: string | null
  telefone: string | null
  custo: number | null
}

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
