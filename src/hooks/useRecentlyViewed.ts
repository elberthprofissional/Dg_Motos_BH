import { useEffect, useSyncExternalStore } from 'react'
import { motorcycles } from '../data/motorcycles'
import type { Motorcycle } from '../types'

const KEY = 'dgmotos:vistas-recentes'
const CHANGE_EVENT = 'dgmotos:recent-change'
const MAX = 8

/**
 * Store das visitas recentes, fora do React.
 *
 * `useState` + `setState` dentro de effect causava um segundo render
 * sempre que a página da moto montava. Com useSyncExternalStore o valor
 * é lido durante o render, sem efeito colateral.
 */
const listeners = new Set<() => void>()

let cache: string[] | null = null

function lerSlugs(): string[] {
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

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function notificar() {
  cache = null
  for (const l of listeners) l()
}

if (typeof window !== 'undefined') {
  // `storage` cobre outras abas; o evento customizado cobre a mesma aba.
  window.addEventListener('storage', notificar)
  window.addEventListener(CHANGE_EVENT, notificar)
}

/** Registra a visita a uma moto (chamar na página de detalhe). */
export function useRegisterView(slug: string | undefined): void {
  useEffect(() => {
    if (!slug) return
    try {
      const atual = lerSlugs().filter((s) => s !== slug)
      localStorage.setItem(KEY, JSON.stringify([slug, ...atual].slice(0, MAX)))
      // Avisa os hooks da mesma aba: o evento `storage` só dispara em outras.
      window.dispatchEvent(new Event('dgmotos:recent-change'))
    } catch {
      /* storage indisponível: ignora silenciosamente */
    }
  }, [slug])
}

/** Lista as motos vistas recentemente (mais recentes primeiro). */
export function useRecentlyViewed(excluirSlug?: string): Motorcycle[] {
  const slugs = useSyncExternalStore(subscribe, lerSlugs, () => [])

  return slugs
    .filter((s) => s !== excluirSlug)
    .map((s) => motorcycles.find((m) => m.slug === s))
    .filter((m): m is Motorcycle => Boolean(m))
}
