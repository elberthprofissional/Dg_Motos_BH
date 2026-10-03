import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export interface Feedback {
  tipo: 'ok' | 'erro'
  texto: string
}

const ESTILOS = {
  ok: { caixa: 'border-ok/40 bg-night-900 text-ok', icone: CheckCircle2 },
  erro: { caixa: 'border-brand-500/40 bg-night-900 text-brand-500', icone: AlertCircle },
} as const

/**
 * Confirmação efêmera de operação.
 *
 * Salvar moto, excluir, trocar senha: até agora o painel confirmava
 * essas ações só pelo fato de a tela mudar (ou pior, não confirmava
 * nada). O toast fecha o ciclo — o dono recebe a confirmação de que a
 * gravação no banco aconteceu, sem precisar conferir o estado da lista.
 */
export function Toast({
  feedback,
  onFechar,
  duracao = 5000,
}: {
  feedback: Feedback | null
  onFechar: () => void
  duracao?: number
}) {
  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(onFechar, duracao)
    return () => clearTimeout(t)
  }, [feedback, onFechar, duracao])

  if (!feedback) return null
  const { caixa, icone: Icone } = ESTILOS[feedback.tipo]

  /* Posicionamento: mesmo cálculo do <main> do painel — nav + safe area +
     folga. Com `bottom-20` fixo o aviso ficava colado na barra e, em iPhone
     com entalhe, atrás do gesto de voltar. */
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 [bottom:calc(var(--spacing-nav-painel)+env(safe-area-inset-bottom,0px)+0.75rem)] lg:bottom-6 lg:left-auto lg:right-6 lg:justify-end lg:px-0"
    >
      <div
        className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-xl shadow-black/50 ${caixa}`}
      >
        <Icone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-steel-200">{feedback.texto}</p>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar aviso"
          className="-mt-0.5 -mr-1 shrink-0 rounded p-1 text-steel-500 transition-colors hover:text-paper"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}