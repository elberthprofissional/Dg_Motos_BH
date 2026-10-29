import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Feedback } from '../components/ui/Toast'
import type { Motorcycle } from '../types'

interface Opcoes {
  /** Motos do pátio (sem lixeira); `null` enquanto o catálogo carrega. */
  ativas: Motorcycle[] | null
  onFeedback: (feedback: Feedback) => void
}

/**
 * ============================================================
 * PRÉVIA NO ENDEREÇO — /admin/estoque/:id
 * ============================================================
 * A prévia tem endereço próprio: recarregar ou voltar pelo navegador
 * devolve o dono à mesma tela. O hook resolve a rota, guarda qual moto
 * está aberta e cuida dos casos em que ela deixa de existir.
 */
export function usePreviaRota({ ativas, onFeedback }: Opcoes) {
  const navigate = useNavigate()
  const params = useParams()
  const subrota = params['*'] ?? ''
  const previaId = /^estoque\/([^/]+)\/?$/.exec(subrota)?.[1] ?? null

  const motoDaPrevia = useMemo(
    () =>
      previaId === null || ativas === null
        ? null
        : (ativas.find((moto) => moto.id === previaId) ?? null),
    [previaId, ativas],
  )

  // Rota desconhecida dentro do painel volta para a mesa de estoque.
  useEffect(() => {
    if (subrota && previaId === null) navigate('/admin', { replace: true })
  }, [subrota, previaId, navigate])

  // A prévia só existe enquanto a moto está no pátio. Se ela sair por
  // outro caminho (outra aba, lixeira), o dono volta para a lista em
  // vez de ficar numa tela vazia.
  const previaOrfa = previaId !== null && ativas !== null && motoDaPrevia === null
  useEffect(() => {
    if (!previaOrfa) return
    onFeedback({ tipo: 'erro', texto: 'Essa moto não está mais no estoque.' })
    navigate('/admin', { replace: true })
  }, [previaOrfa, navigate, onFeedback])

  // Abrir a prévia começa do topo; voltar devolve a lista à posição em
  // que estava (o Estoque continua montado por baixo). O `instant`
  // ignora o scroll suave global — animar aqui faria a tela "escorrer"
  // sozinha logo depois do clique, e o carregamento das fotos ainda
  // cancelava o destino no meio do caminho.
  const rolagemAntesDaPrevia = useRef(0)
  const jaAbriuPrevia = useRef(false)
  useEffect(() => {
    if (previaId !== null) {
      rolagemAntesDaPrevia.current = window.scrollY
      jaAbriuPrevia.current = true
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (jaAbriuPrevia.current) {
      jaAbriuPrevia.current = false
      window.scrollTo({ top: rolagemAntesDaPrevia.current, behavior: 'instant' })
    }
  }, [previaId])

  return { previaId, motoDaPrevia }
}
