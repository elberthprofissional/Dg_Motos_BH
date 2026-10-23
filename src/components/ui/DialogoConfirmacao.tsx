import { useEffect, useRef } from 'react'

export interface PedidoConfirmacao {
  titulo: string
  descricao: string
  rotuloConfirmar: string
  onConfirmar: () => void | Promise<void>
  /**
   * Tom visual. `perigo` (padrão) é o carimbo para ações destrutivas
   * (excluir). `neutro` é para confirmações inofensivas — sair, descartar
   * rascunho — onde um alerta vermelho daria peso errado à ação.
   */
  tom?: 'perigo' | 'neutro'
  /** Texto do botão enquanto a ação roda (padrão: "Processando..."). */
  rotuloOcupado?: string
}

/**
 * Confirmação de ação destrutiva.
 *
 * `window.confirm` abre uma janela do navegador: fora do tema, ilumina
 * a tela toda e — em notebook com muitas abas — some atrás de outra
 * janela. Para uma concessionária, excluir uma moto é operação comum,
 * então a confirmação precisa ser previsível.
 *
 * O diálogo é um `<dialog>` nativo: o foco fica preso dentro dele
 * enquanto está aberto, Esc cancela e o navegador devolve o foco ao
 * botão que o abriu. O foco inicial é o botão de cancelar — o padrão
 * seguro.
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  // O callback é guardado numa ref para que o listener do `close` não
  // precise ser re-registrado a cada render.
  const onFecharRef = useRef(onFechar)
  useEffect(() => {
    onFecharRef.current = onFechar
  }, [onFechar])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (pedido && !dialog.open) {
      dialog.showModal()
      cancelarRef.current?.focus()
    } else if (!pedido && dialog.open) {
      dialog.close()
    }
  }, [pedido])

  // Esc e o botão de fechar do próprio diálogo passam por aqui.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const aoFechar = () => onFecharRef.current()
    dialog.addEventListener('close', aoFechar)
    return () => dialog.removeEventListener('close', aoFechar)
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="dialogo"
      aria-labelledby="dlg-titulo"
      aria-describedby="dlg-descricao"
    >
      {pedido && (
        <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-6 sm:p-7">
          {/* Minimalista: título em uma linha, texto curto, dois botões.
              Sem ícone em quadro — a cor do botão de confirmar carrega o
              peso da ação (vermelho sólido para confirmar). */}
          <h2 id="dlg-titulo" className="text-base font-semibold text-white">
            {pedido.titulo}
          </h2>
          <p id="dlg-descricao" className="mt-2 text-sm leading-relaxed text-neutral-400">
            {pedido.descricao}
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              ref={cancelarRef}
              type="button"
              onClick={onFechar}
              className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium text-neutral-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void pedido.onConfirmar()}
              className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-red-950/50 transition-all hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ocupado ? (pedido.rotuloOcupado ?? 'Processando...') : pedido.rotuloConfirmar}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
