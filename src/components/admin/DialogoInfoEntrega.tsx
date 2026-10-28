import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ImageOff } from 'lucide-react'
import type { EntregaRegistro } from '../../data/entregas'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { campoLinha } from './campoLinha'

export interface InfoEntrega {
  modelo: string
  cliente: string
  data: string
}

interface DialogoInfoEntregaProps {
  /** Publicação em edição; `null` mantém o diálogo fechado. */
  post: EntregaRegistro | null
  ocupado: boolean
  erro: string | null
  onFechar: () => void
  onSalvar: (info: InfoEntrega) => void
}

/**
 * Informações da entrega — o que a foto conta, não só a imagem.
 *
 * O modelo e o cliente ficam no painel e aparecem na sobreposição de
 * cada foto; a galeria pública continua anônima, só com a data. A data
 * da entrega é a mesma que o site já usa para o mês.
 */
export function DialogoInfoEntrega({
  post,
  ocupado,
  erro,
  onFechar,
  onSalvar,
}: DialogoInfoEntregaProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const modeloRef = useRef<HTMLInputElement>(null)

  const [modelo, setModelo] = useState('')
  const [cliente, setCliente] = useState('')
  const [data, setData] = useState('')
  const [erroLocal, setErroLocal] = useState<string | null>(null)

  const idAberto = post?.id ?? null

  // Reabre só quando entra outra publicação: o painel pode recarregar
  // com o diálogo aberto e isso não pode apagar o que foi digitado.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (post && !dialog.open) {
      // Versões antigas gravavam "Publicação" como nome: é ausência
      // de informação, não um modelo de moto.
      setModelo(post.motoNome === 'Publicação' ? '' : post.motoNome)
      setCliente(post.nomeCliente)
      setData(post.entregueEm)
      setErroLocal(null)
      dialog.showModal()
      modeloRef.current?.focus()
    } else if (!post && dialog.open) {
      dialog.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idAberto])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const aoFechar = () => onFechar()
    dialog.addEventListener('close', aoFechar)
    return () => dialog.removeEventListener('close', aoFechar)
  }, [onFechar])

  function aoConfirmar(evento: FormEvent) {
    evento.preventDefault()
    if (!post || ocupado) return

    const nomeDoModelo = modelo.trim()
    if (!nomeDoModelo) {
      setErroLocal('Informe o modelo da moto — é ele que aparece na foto.')
      modeloRef.current?.focus()
      return
    }
    if (!data) {
      setErroLocal('Informe a data da entrega.')
      return
    }

    setErroLocal(null)
    onSalvar({ modelo: nomeDoModelo, cliente: cliente.trim(), data })
  }

  const mensagem = erroLocal ?? erro

  return (
    <dialog
      ref={dialogRef}
      className="dialogo"
      aria-labelledby="dlg-info-entrega-titulo"
      onCancel={(evento) => {
        if (ocupado) evento.preventDefault()
      }}
    >
      {post ? (
        <form
          className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto"
          onSubmit={aoConfirmar}
        >
          <header className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div className="grid size-12 shrink-0 place-items-center overflow-hidden bg-painel-2">
              {post.imagens[0] ? (
                <img
                  src={post.imagens[0]}
                  alt=""
                  aria-hidden="true"
                  className="size-full object-cover"
                  onError={(evento) => {
                    evento.currentTarget.onerror = null
                    evento.currentTarget.src = PLACEHOLDER_CARD
                  }}
                />
              ) : (
                <ImageOff className="size-5 text-steel-500" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="dlg-info-entrega-titulo"
                className="font-display text-lg leading-tight font-semibold text-paper"
              >
                Informações da entrega
              </h2>
              <p className="mt-1 text-sm text-steel-400">
                {post.fotos.length === 1 ? '1 foto nesta entrega' : `${post.fotos.length} fotos nesta entrega`}
              </p>
            </div>
          </header>

          <div className="px-5 py-5 sm:px-6">
            <div>
              <label htmlFor="info-entrega-modelo" className="field-label">
                Modelo da moto
              </label>
              <input
                id="info-entrega-modelo"
                ref={modeloRef}
                type="text"
                value={modelo}
                onChange={(evento) => setModelo(evento.target.value)}
                className={campoLinha}
                placeholder="Ex.: Honda CG 160 Start"
                autoComplete="off"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="info-entrega-cliente" className="field-label">
                  Cliente <span className="font-normal text-steel-600">(opcional)</span>
                </label>
                <input
                  id="info-entrega-cliente"
                  type="text"
                  value={cliente}
                  onChange={(evento) => setCliente(evento.target.value)}
                  className={campoLinha}
                  placeholder="Quem levou a moto"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="info-entrega-data" className="field-label">
                  Data da entrega
                </label>
                <input
                  id="info-entrega-data"
                  type="date"
                  value={data}
                  onChange={(evento) => setData(evento.target.value)}
                  className={`${campoLinha} numeros`}
                />
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-steel-500">
              Modelo, cliente e data aparecem na sobreposição das fotos aqui no painel. A galeria
              pública continua só com a data.
            </p>

            {mensagem ? (
              <p
                role="alert"
                className="mt-4 border-l-2 border-marca bg-night-900 px-3 py-2.5 text-sm leading-relaxed text-brand-400"
              >
                {mensagem}
              </p>
            ) : null}
          </div>

          <footer className="border-t border-line px-5 py-4 sm:px-6">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                disabled={ocupado}
                className="foco-painel inline-flex h-11 items-center px-3 text-sm font-medium text-steel-400 transition-colors hover:text-paper disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ocupado}
                className="foco-painel inline-flex h-11 items-center bg-marca px-5 text-sm font-semibold text-white transition-colors hover:bg-marca-forte disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ocupado ? 'Salvando…' : 'Salvar informações'}
              </button>
            </div>
          </footer>
        </form>
      ) : null}
    </dialog>
  )
}
