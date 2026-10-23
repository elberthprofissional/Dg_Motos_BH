import { useState } from 'react'
import type { MotorcycleImage } from '../../types'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface BikeGalleryProps {
  imagens: MotorcycleImage[]
  titulo: string
}

export function BikeGallery({ imagens, titulo }: BikeGalleryProps) {
  const [ativa, setAtiva] = useState(0)
  const lista = imagens.length > 0 ? imagens : [{ src: PLACEHOLDER_CARD, alt: titulo }]
  const atual = lista[ativa] ?? lista[0]

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
      <div
        className="order-2 flex gap-2 overflow-x-auto pb-0.5 md:order-1 md:flex-col md:overflow-visible"
        role="group"
        aria-label={`Fotos de ${titulo}`}
      >
        {lista.map((img, i) => (
          <button
            key={img.src}
            type="button"
            aria-pressed={i === ativa}
            aria-controls="foto-principal"
            aria-label={img.alt ? `Ver ${img.alt}` : `Ver foto ${i + 1} de ${lista.length}`}
            onClick={() => setAtiva(i)}
            className={`relative w-16 shrink-0 cursor-pointer overflow-hidden border-b-2 bg-painel-2 transition-[opacity,border-color] duration-200 ${
              i === ativa
                ? 'border-marca opacity-100'
                : 'border-transparent opacity-45 hover:opacity-80'
            }`}
            style={{ aspectRatio: '4 / 5' }}
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

      <div
        id="foto-principal"
        className="order-1 relative min-w-0 w-full overflow-hidden bg-painel-2 md:w-auto md:flex-1"
        style={{ aspectRatio: '4 / 5' }}
      >
        <img
          src={atual.src}
          alt={atual.alt || titulo}
          width={960}
          height={1200}
          fetchPriority="high"
          decoding="async"
          className="size-full object-contain object-center"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER_CARD
          }}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        Foto {ativa + 1} de {lista.length}: {atual.alt || titulo}
      </p>
    </div>
  )
}
