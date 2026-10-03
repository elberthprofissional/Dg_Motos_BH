import { useCallback, useSyncExternalStore } from 'react'
import type { Motorcycle } from '../types'

const KEY = 'dgmotos:comparar'
const CHANGE_EVENT = 'dgmotos:compare-change'
export const COMPARE_MAX = 3

/**
 * Store do comparador sincronizado entre abas e entre componentes.
 *
 * Fica fora do React de propósito: `useCompare` é chamado por cada
 * BikeCard e também pelo painel e pela barra flutuante. Com estado
 * local, cada chamada criaria seus próprios listeners de `storage`.
 * Aqui existe um único assinante por consumidor do hook.
 */
const listeners = new Set<() => void>()

/** Snapshot em cache: useSyncExternalStore exige referência estável. */
let cache: string[] | null = null

function ler(): string[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      cache = []
    } else {
      const parsed: unknown = JSON.parse(raw)
      cache = Array.isArray(parsed)
        ? parsed.filter((s): s is string => typeof s === 'string')
        : []
    }
  } catch {
    cache = []
  }
  return cache
}

function escrever(slugs: string[]): void {
  cache = slugs
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs))
  } catch {
    /* storage indisponível: mantém apenas em memória */
  }
  for (const l of listeners) l()
}

// Sincroniza entre abas. Registrado uma vez no carregamento do módulo.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    cache = null
    for (const l of listeners) l()
  })
  window.addEventListener(CHANGE_EVENT, () => {
    for (const l of listeners) l()
  })
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * Comparador de motocicletas (até 3).
 *
 * Retorna `toggle` com o resultado da operação: `false` significa que o
 * limite foi atingido, e o chamador deve avisar o usuário.
 */
export function useCompare() {
  const slugs = useSyncExternalStore(subscribe, ler, () => [])

  const toggle = useCallback((slug: string): boolean => {
    const atual = ler()
    let proximo: string[]
    if (atual.includes(slug)) {
      proximo = atual.filter((s) => s !== slug)
    } else {
      if (atual.length >= COMPARE_MAX) return false // cheio
      proximo = [...atual, slug]
    }
    escrever(proximo)
    return true
  }, [])

  const limpar = useCallback(() => {
    escrever([])
  }, [])

  const isSelected = useCallback((slug: string) => slugs.includes(slug), [slugs])

  return { slugs, toggle, limpar, isSelected, MAX: COMPARE_MAX }
}

/** Converte slugs em motos na ordem selecionada. */
export function slugsToBikes(slugs: string[], all: Motorcycle[]): Motorcycle[] {
  const porSlug = new Map(all.map((m) => [m.slug, m]))
  return slugs
    .map((s) => porSlug.get(s))
    .filter((m): m is Motorcycle => Boolean(m))
}