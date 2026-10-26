import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import type { MotorcycleImage } from '../../types'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface BikeGalleryProps {
  imagens: MotorcycleImage[]
  titulo: string
}

const PLACEHOLDER = { src: PLACEHOLDER_CARD, alt: 'Foto ainda não disponível' }

/**
 * Palco da ficha.
 *
 * As fotos do anúncio são retrato (3:4). No desktop o palco ocupa a
 * coluna inteira e acompanha a leitura; no celular vira uma foto 4:5
 * logo abaixo do preço. As miniaturas ficam numa faixa sólida, sem
 * véu de vidro, e a foto pode abrir inteira num <dialog> nativo.
 */
export function BikeGallery({ imagens, titulo }: BikeGalleryProps) {
  const lista = imagens.length > 0 ? imagens : [PLACEHOLDER]
  const [ativa, setAtiva] = useState(0)
  const [ampliada, setAmpliada] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const botaoAmpliarRef = useRef<HTMLButtonElement>(null)

  const total = lista.length
  const indice = ativa % total
  const atual = lista[indice]

  const altDe = (img: MotorcycleImage, i: number) =>
    img.alt.trim() || `${titulo} — foto ${i + 1} de ${total}`

  useEffect(() => {
    if (!ampliada) return

    const aoTeclar = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setAtiva((i) => (i + 1) % total)
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setAtiva((i) => (i - 1 + total) % total)
      }
    }

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', aoTeclar)

    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [ampliada, total])

  function abrirAmpliada() {
    dialogRef.current?.showModal()
    setAmpliada(true)
  }

  function fecharAmpliada() {
    dialogRef.current?.close()
  }

  function aoFechar() {
    setAmpliada(false)
    botaoAmpliarRef.current?.focus()
  }

  return (
    <div role="group" aria-label={`Fotos de ${titulo}`} className="flex h-full flex-col">
      <div
        id="foto-principal"
        className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-painel-2 sm:aspect-[4/3] lg:aspect-auto lg:min-h-0 lg:flex-1 lg:shrink"
      >
        {lista.map((img, i) => (
          <img
            key={`${img.src}-${i}`}
            src={img.src}
            alt={i === indice ? altDe(img, i) : ''}
            aria-hidden={i === indice ? undefined : true}
            width={1200}
            height={1600}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            decoding="async"
            className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-500 motion-reduce:transition-none ${
              i === indice ? 'opacity-100' : 'opacity-0'
            }`}
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER_CARD
            }}
          />
        ))}

        <button
          ref={botaoAmpliarRef}
          type="button"
          onClick={abrirAmpliada}
          className="absolute top-3 right-3 z-10 inline-flex h-11 items-center gap-2 bg-fundo/90 px-3 text-sm font-semibold text-texto transition-colors hover:bg-marca hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
          aria-label={`Ampliar foto de ${titulo}`}
        >
          <Maximize2 className="size-[18px]" aria-hidden="true" />
          <span className="hidden sm:inline">Ampliar</span>
        </button>
      </div>

      {total > 1 ? (
        <div className="flex shrink-0 items-center justify-between gap-4 bg-fundo px-3 py-3">
          <div className="flex w-full min-w-0 gap-2 overflow-x-auto">
            {lista.map((img, i) => (
              <button
                key={`${img.src}-miniatura-${i}`}
                type="button"
                aria-pressed={i === indice}
                aria-controls="foto-principal"
                aria-label={`Ver ${altDe(img, i)}`}
                onClick={() => setAtiva(i)}
                className={`relative w-12 shrink-0 cursor-pointer overflow-hidden border-b-2 bg-painel-2 transition-[opacity,border-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco sm:w-14 lg:w-16 ${
                  i === indice
                    ? 'border-marca opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-85'
                }`}
                style={{ aspectRatio: '3 / 4' }}
              >
                <img
                  src={img.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover object-center"
                  onError={(event) => {
                    event.currentTarget.src = PLACEHOLDER_CARD
                  }}
                />
              </button>
            ))}
          </div>

          <p className="numeros hidden shrink-0 text-sm leading-none text-texto-3 sm:block">
            {indice + 1} / {total}
          </p>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        Foto {indice + 1} de {total}: {altDe(atual, indice)}
      </p>

      <dialog
        ref={dialogRef}
        aria-label={`Fotos de ${titulo}`}
        onClose={aoFechar}
        onClick={(event) => {
          if (event.target === event.currentTarget) fecharAmpliada()
        }}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-0 text-texto backdrop:bg-[#080706]"
      >
        <div className="pointer-events-none flex h-full flex-col">
          <div className="pointer-events-auto flex items-center justify-between gap-4 p-4">
            <p className="numeros text-sm text-texto-2">
              Foto {indice + 1} de {total}
            </p>
            <button
              type="button"
              onClick={fecharAmpliada}
              aria-label="Fechar foto ampliada"
              className="grid size-11 place-items-center bg-painel text-texto transition-colors hover:bg-marca hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
            {total > 1 ? (
              <button
                type="button"
                onClick={() => setAtiva((i) => (i - 1 + total) % total)}
                aria-label="Foto anterior"
                className="pointer-events-auto absolute left-2 z-10 grid size-12 place-items-center bg-painel text-texto transition-colors hover:bg-marca hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco sm:left-6"
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
            ) : null}

            <img
              src={atual.src}
              alt={altDe(atual, indice)}
              className="pointer-events-auto max-h-full max-w-full object-contain"
              onError={(event) => {
                event.currentTarget.src = PLACEHOLDER_CARD
              }}
            />

            {total > 1 ? (
              <button
                type="button"
                onClick={() => setAtiva((i) => (i + 1) % total)}
                aria-label="Próxima foto"
                className="pointer-events-auto absolute right-2 z-10 grid size-12 place-items-center bg-painel text-texto transition-colors hover:bg-marca hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco sm:right-6"
              >
                <ChevronRight className="size-6" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <p className="pointer-events-auto px-4 pb-5 text-center text-sm leading-relaxed text-texto-3">
            Use as setas do teclado para passar as fotos. Esc fecha.
          </p>
        </div>
      </dialog>
    </div>
  )
}
