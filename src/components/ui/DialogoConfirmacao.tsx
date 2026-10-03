import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

export interface PedidoConfirmacao {
  titulo: string
  descricao: string
  rotuloConfirmar: string
  onConfirmar: () => void | Promise<void>
}

/**
 * Confirmação de ação destrutiva.
 *
 * `window.confirm` abre uma janela do navegador: fora do tema, ilumina
 * a tela toda e — em notebook com muitas abas — some atrás de outra
 * janela. Para uma concessionária, excluir uma moto é operação comum,
 * então a confirmação precisa ser previsível.
 *
 * O foco entra no botão de cancelar (o padrão seguro), Esc cancela e o
 * Tab fica preso dentro do diálogo enquanto ele estiver aberto.
 */
export function DialogoConfirmacao({
  pedido,
  onFechar,
  ocupado,
}: {
  pedido: PedidoConfirmacao | null
  onFechar: () => void
  ocupado?: boolean
}) {
  const caixa = useRef<HTMLDivElement>(null)
  const cancelar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!pedido) return
    cancelar.current?.focus()

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onFechar()
        return
      }
      if (event.key !== 'Tab' || !caixa.current) return

      const focaveis = caixa.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]

      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [pedido, onFechar])

  if (!pedido) return null

  /* No celular o diálogo sobe de baixo (alcance do polegar) e o rodapé
     reserva a altura da barra de navegação: com `p-4` puro os botões de
     confirmar/cancelar ficavam escondidos atrás dela — justamente a decisão
     que o diálogo existe para pedir. `max-h` + scroll interno cobrem a
     descrição longa da exclusão em telas de 320×568. */
  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center pt-4 pb-[calc(var(--spacing-nav-painel)+env(safe-area-inset-bottom,0px)+1rem)] sm:items-center sm:p-4 sm:pb-4">
      <button
        type="button"
        aria-label="Fechar confirmação"
        onClick={onFechar}
        className="absolute inset-0 bg-black/70"
      />
      <div
        ref={caixa}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-titulo"
        aria-describedby="dlg-descricao"
        className="relative max-h-full w-full max-w-md overflow-y-auto rounded-lg border border-white/10 bg-night-900 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand-500/40 bg-brand-500/10 text-brand-500"
          >
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="dlg-titulo"
              className="font-display text-lg font-semibold tracking-wide text-paper uppercase"
            >
              {pedido.titulo}
            </h2>
            <p id="dlg-descricao" className="mt-2 text-sm leading-relaxed text-steel-400">
              {pedido.descricao}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end">
          <button
            ref={cancelar}
            type="button"
            onClick={onFechar}
            className="btn btn-secondary h-11 w-full sm:h-auto sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void pedido.onConfirmar()}
            className="btn btn-danger h-11 w-full sm:h-auto sm:w-auto"
          >
            {ocupado ? 'Excluindo...' : pedido.rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}