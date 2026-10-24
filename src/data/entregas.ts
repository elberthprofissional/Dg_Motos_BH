export type StatusEntrega = 'rascunho' | 'publicada' | 'arquivada'

/** Dados que podem aparecer no mural público depois da publicação no admin. */
export interface EntregaPublicada {
  id: string
  moto: string
  imagem: string
  nomeCliente?: string
  depoimento?: string
  entregueEm?: string
}

/** Registro completo usado pelo painel; imagens são mantidas privadas no Storage. */
export interface EntregaRegistro {
  id: string
  moto: string
  fotoPath: string | null
  imagemUrl: string | null
  nomeCliente: string
  legenda: string
  entregueEm: string
  autorizacaoPublicacao: boolean
  status: StatusEntrega
  ordem: number
  updatedAt: string
}
