export type StatusEntrega = 'rascunho' | 'publicada' | 'arquivada'

/** Post que pode aparecer no mural público depois da publicação no admin. */
export interface EntregaPublicada {
  id: string
  moto: string
  /** Fotos do post, na ordem de exibição (URLs assinadas de 1h). */
  imagens: string[]
  nomeCliente?: string
  depoimento?: string
  entregueEm?: string
}

/**
 * Registro completo usado pelo painel.
 *
 * O post pode pertencer a uma moto do estoque (`motoId`) ou ter sido
 * criado avulso para uma venda que nunca foi cadastrada (`motoId`
 * nulo e nome digitado). As fotos vivem no Storage privado; aqui
 * guardam-se só os caminhos — as URLs são assinadas sob demanda.
 */
export interface EntregaRegistro {
  id: string
  /** Moto do estoque ligada ao post ('' = não vendida no estoque). */
  motoId: string
  /** Nome de exibição (calcado no registro; as vendas vêm da ficha da moto). */
  motoNome: string
  /** Caminhos das fotos no bucket privado do Storage. */
  fotos: string[]
  /** URLs assinadas, alinhadas por índice com `fotos` (uso só no painel). */
  imagens: string[]
  nomeCliente: string
  legenda: string
  entregueEm: string
  autorizacaoPublicacao: boolean
  status: StatusEntrega
  ordem: number
  updatedAt: string
}
