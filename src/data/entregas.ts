/**
 * Histórias reais de entregas publicadas na home.
 * Adicione uma entrada somente depois de receber a foto e a autorização
 * de uso; nome e depoimento são opcionais.
 */
export interface EntregaRealizada {
  id: string
  moto: string
  imagem: string
  nomeCliente?: string
  depoimento?: string
  entregueEm?: string
  /** Temporary internet image, only for a local CSS review. Remove after review. */
  previaTemporaria?: boolean
}

export const entregasRealizadas: EntregaRealizada[] = []
