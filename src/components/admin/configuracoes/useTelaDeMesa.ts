import { useSyncExternalStore } from 'react'

const CONSULTA_MESA = '(min-width: 1024px)'

function assinarTelaDeMesa(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_MESA)
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

function lerTelaDeMesa() {
  return window.matchMedia(CONSULTA_MESA).matches
}

/** `true` em tela de mesa — o mesmo corte do `lg:` do Tailwind. */
export function useTelaDeMesa(): boolean {
  return useSyncExternalStore(assinarTelaDeMesa, lerTelaDeMesa, () => false)
}
