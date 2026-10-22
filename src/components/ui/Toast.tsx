import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export interface Feedback {
  tipo: 'ok' | 'erro'
  texto: string
}

const ESTILOS = {
  ok: { caixa: 'border-ok/40 bg-painel text-ok', icone: CheckCircle2 },
  erro: { caixa: 'border-marca/40 bg-painel text-marca-texto', icone: AlertCircle },
} as const

/**
 * Confirmação efêmera de operação.
 *
 * Salvar moto, excluir, trocar senha: até agora o painel confirmava
 * essas ações só pelo fato de a tela mudar (ou pior, não confirmava
 * nada). O toast fecha o ciclo — o dono recebe a confirmação de que a
 * gravação no banco aconteceu, sem precisar conferir o estado da lista.
 *
 * As regiões vivas (live regions) ficam montadas desde o começo: um
 * `role="status"` para a confirmação e um `role="alert"` para o erro.
 * Nascidas junto com a mensagem, elas não anunciam — nasceram antes.
 */
export function Toast({
  feedback,
  onFechar,
  duracao = 5000,
  acimaDaBarra = false,
}: {
  feedback: Feedback | null
  onFechar: () => void
  duracao?: number
  /** Sobe o aviso no celular para não ficar atrás da barra inferior. */
  acimaDaBarra?: boolean
}) {
  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(onFechar, duracao)
    return () => clearTimeout(t)
  }, [feedback, onFechar, duracao])

  /* Posicionamento: no celular fica sobre a base, somando só a safe area.
     Em iPhone com entalhe, sem a folga da safe area o aviso ficaria atrás
     do gesto de voltar. `acimaDaBarra` adiciona a altura da barra
     inferior (usada só no painel, que agora tem uma). */
  const posicao = `pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:justify-end lg:px-0 ${
    acimaDaBarra
      ? '[bottom:calc(env(safe-area-inset-bottom,0px)+0.75rem+4.5rem)]'
      : '[bottom:calc(env(safe-area-inset-bottom,0px)+0.75rem)]'
  }`

  const cartao = (tipo: 'ok' | 'erro') => {
    const { caixa, icone: Icone } = ESTILOS[tipo]
    return (
      <div
        className={`pointer-events-auto flex max-w-sm items-start gap-3 border px-4 py-3 shadow-lg shadow-black/30 ${caixa} /* taste-skill-ignore: overlay de notificacao */`}
      >
        <Icone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-texto-2">{feedback?.texto}</p>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar aviso"
          className="-mt-0.5 -mr-1 shrink-0 p-1 text-texto-3 transition-colors hover:text-texto"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className={posicao}>
        {feedback?.tipo === 'ok' ? cartao('ok') : null}
      </div>

      <div role="alert" aria-live="assertive" aria-atomic="true" className={posicao}>
        {feedback?.tipo === 'erro' ? cartao('erro') : null}
      </div>
    </>
  )
}
