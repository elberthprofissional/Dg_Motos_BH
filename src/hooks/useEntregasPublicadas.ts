import { useEffect, useState } from 'react'
import type { EntregaPublicada } from '../data/entregas'
import { buscarEntregasPublicadas } from '../lib/entregas'

export function useEntregasPublicadas() {
  const [entregas, setEntregas] = useState<EntregaPublicada[]>([])

  useEffect(() => {
    let ativo = true
    let ultimaBusca = 0
    const atualizar = () => {
      ultimaBusca = Date.now()
      void buscarEntregasPublicadas().then((resultado) => {
        if (ativo) setEntregas(resultado)
      })
    }
    atualizar()
    const intervalo = window.setInterval(atualizar, 50 * 60 * 1000)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaBusca > 50 * 60 * 1000) {
        atualizar()
      }
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [])

  return entregas
}
