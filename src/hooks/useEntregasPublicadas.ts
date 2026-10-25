import { useEffect, useState } from 'react'
import type { EntregaPublicada } from '../data/entregas'
import { buscarEntregasPublicadas } from '../lib/entregas'

/**
 * Posts publicados no mural.
 *
 * A re-assinatura acontece antes de a URL vencer (as do mural valem 1h),
 * então uma aba aberta não fica com fotos quebradas. `limite` existe
 * para a Home pedir só o que cabe na seção — a página de entregas pede
 * tudo.
 */
export function useEntregasPublicadas(limite?: number) {
  const [entregas, setEntregas] = useState<EntregaPublicada[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    let ultimaBusca = 0
    const atualizar = () => {
      ultimaBusca = Date.now()
      void buscarEntregasPublicadas(limite)
        .then((resultado) => {
          if (ativo) setEntregas(resultado)
        })
        .finally(() => {
          if (ativo) setCarregando(false)
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
  }, [limite])

  return { entregas, carregando }
}
