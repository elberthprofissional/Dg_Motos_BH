import { createContext, use } from 'react'
import type { Motorcycle } from '../types'

export interface EstadoCatalogo {
  /** Catálogo a exibir: do banco se respondeu, senão o arquivo estático. */
  motos: Motorcycle[]
  /** Ainda buscando no banco. Evita mostrar 404 antes da resposta. */
  carregando: boolean
  /** `true` quando os dados vieram do Postgres. */
  doBanco: boolean
}

export const CatalogoContexto = createContext<EstadoCatalogo | null>(null)

/**
 * Lê o catálogo compartilhado.
 *
 * O contexto é preenchido uma única vez pelo layout, então todas as
 * páginas (e o prerender do build) injetam os dados pelo mesmo caminho.
 */
export function useCatalogo(): EstadoCatalogo {
  const ctx = use(CatalogoContexto)
  if (!ctx) {
    throw new Error('useCatalogo precisa estar dentro do RootLayout')
  }
  return ctx
}