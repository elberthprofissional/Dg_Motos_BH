import { useEffect, useRef } from 'react'
import { AlertTriangle, LogOut } from 'lucide-react'

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

  const neutro = pedido?.tom === 'neutro'
  const Icone = neutro ? LogOut : AlertTriangle

  return (
    <dialog
      ref={dialogRef}
      className="dialogo"
      aria-labelledby="dlg-titulo"
      aria-describedby="dlg-descricao"
    >
      {pedido && (
        <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <span
              aria-hidden="true"
              className={`grid size-10 shrink-0 place-items-center border ${
                neutro
                  ? 'border-borda bg-painel-2 text-texto-3'
                  : 'border-marca/40 bg-marca/10 text-marca-texto'
              }`}
            >
              <Icone className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id="dlg-titulo" className="titulo text-lg text-texto">
                {pedido.titulo}
              </h2>
              <p id="dlg-descricao" className="mt-2 text-sm leading-relaxed text-texto-2">
                {pedido.descricao}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end">
            <button
              ref={cancelarRef}
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
              className={`btn h-11 w-full sm:h-auto sm:w-auto ${
                neutro ? 'btn-primary' : 'btn-danger'
              }`}
            >
              {ocupado ? (pedido.rotuloOcupado ?? 'Processando...') : pedido.rotuloConfirmar}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
