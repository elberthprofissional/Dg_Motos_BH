import { useId, useRef, useState } from 'react'
import { Camera, ImagePlus, Images, Loader2, X } from 'lucide-react'
import { temCameraNaHora } from '../../lib/dispositivo'

interface AreaUploadFotoProps {
  enviando: boolean
  /** Linha de apoio quando parado; vazia usa o texto padrão. */
  resumo?: string
  /** Depois que já existem fotos, vira uma linha curta de "adicionar". */
  compacto?: boolean
  onEscolher: () => void
  onTirarFoto: () => void
  onArquivos: (arquivos: FileList) => void
}

/**
 * Retângulo único de upload. No desktop abre o seletor; no toque abre
 * uma folha curta com galeria e câmera, sem depender do menu nativo.
 */
export function AreaUploadFoto({
  enviando,
  resumo,
  compacto = false,
  onEscolher,
  onTirarFoto,
  onArquivos,
}: AreaUploadFotoProps) {
  const folhaRef = useRef<HTMLDialogElement>(null)
  const galeriaRef = useRef<HTMLButtonElement>(null)
  const [temCamera] = useState(temCameraNaHora)
  const [arrastando, setArrastando] = useState(false)
  const tituloId = useId()

  function abrirSeletor() {
    if (enviando) return
    if (!temCamera) {
      onEscolher()
      return
    }
    folhaRef.current?.showModal()
    galeriaRef.current?.focus()
  }

  function escolherDaGaleria() {
    onEscolher()
    folhaRef.current?.close()
  }

  function tirarFoto() {
    onTirarFoto()
    folhaRef.current?.close()
  }

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!enviando) setArrastando(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setArrastando(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          if (!enviando) onArquivos(e.dataTransfer.files)
        }}
        className={`border border-dashed bg-painel-2 transition-colors ${
          arrastando ? 'border-brand-400 bg-brand-500/5' : 'border-line-forte'
        }`}
      >
        <button
          type="button"
          onClick={abrirSeletor}
          disabled={enviando}
          aria-haspopup={temCamera ? 'dialog' : undefined}
          aria-busy={enviando || undefined}
          className={
            compacto
              ? 'foco-painel flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-medium text-steel-300 transition-colors hover:bg-painel-3 hover:text-paper disabled:cursor-wait'
              : 'foco-painel flex w-full flex-col items-center gap-1 px-4 py-6 text-center transition-colors hover:bg-painel-3 disabled:cursor-wait'
          }
        >
          {compacto ? (
            <>
              {enviando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-4 text-brand-400" aria-hidden="true" />
              )}
              {enviando ? 'Enviando fotos…' : 'Adicionar mais fotos'}
            </>
          ) : (
            <>
              <span aria-hidden="true" className="grid size-10 place-items-center border border-line bg-night-950 text-brand-400">
                {enviando ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              </span>
              <span className="mt-1.5 text-sm font-semibold text-paper">
                {enviando ? 'Enviando fotos…' : 'Upload foto'}
              </span>
              <span className="text-xs leading-snug text-steel-400">
                {enviando
                  ? 'Preparando as imagens antes de enviar.'
                  : resumo ||
                    (temCamera
                      ? 'Escolher da galeria ou tirar na hora'
                      : 'Clique para escolher ou arraste as fotos aqui')}
              </span>
              <span className="text-[11px] text-steel-500">JPG, PNG ou WebP · até 12 MB cada</span>
            </>
          )}
        </button>
      </div>

      {temCamera ? (
        <dialog
          ref={folhaRef}
          className="dialogo dialogo-folha"
          aria-labelledby={tituloId}
          onClick={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.close()
          }}
        >
          <div className="px-5 pt-3 pb-4">
            <div aria-hidden="true" className="mx-auto h-1 w-10 bg-line-forte" />
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={tituloId} className="font-display text-lg font-semibold text-paper">
                  Adicionar foto
                </h2>
                <p className="mt-1 text-xs text-steel-400">Escolha da galeria ou tire na hora.</p>
              </div>
              <button
                type="button"
                onClick={() => folhaRef.current?.close()}
                aria-label="Fechar"
                className="foco-painel grid size-10 shrink-0 place-items-center border border-line text-steel-400 transition-colors hover:border-line-forte hover:text-paper"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                ref={galeriaRef}
                type="button"
                onClick={escolherDaGaleria}
                className="foco-painel flex min-h-24 flex-col items-center justify-center gap-2 border border-line-forte bg-painel-2 px-3 py-4 text-center transition-colors hover:border-brand-400/60 hover:bg-painel-3"
              >
                <Images className="size-5 text-brand-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-paper">Escolher foto</span>
                <span className="text-[11px] text-steel-500">Da galeria</span>
              </button>
              <button
                type="button"
                onClick={tirarFoto}
                className="foco-painel flex min-h-24 flex-col items-center justify-center gap-2 border border-line-forte bg-painel-2 px-3 py-4 text-center transition-colors hover:border-brand-400/60 hover:bg-painel-3"
              >
                <Camera className="size-5 text-brand-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-paper">Tirar foto</span>
                <span className="text-[11px] text-steel-500">Abrir a câmera</span>
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  )
}
