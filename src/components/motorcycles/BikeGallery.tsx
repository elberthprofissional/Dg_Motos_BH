import { useState } from 'react'
import type { MotorcycleImage } from '../../types'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface BikeGalleryProps {
  imagens: MotorcycleImage[]
  titulo: string
}

/**
 * Galeria da ficha.
 *
 * Recorte 16/10 — a mesma proporção das fichas do catálogo (BikeCard): a
 * mesma moto não pode mudar de proporção de uma página pra outra.
 * As miniaturas moram ABAIXO da foto grande, numa esteira; a tira
 * lateral de 64px curtia as fotos de rua ao meio, sem fôlego.
 */
export function BikeGallery({ imagens, titulo }: BikeGalleryProps) {
  const [ativa, setAtiva] = useState(0)
  const lista = imagens.length > 0 ? imagens : [{ src: PLACEHOLDER_CARD, alt: titulo }]
  const atual = lista[ativa] ?? lista[0]

  return (
    <div className="flex flex-col gap-3">
      <div
        id="foto-principal"
        className="relative aspect-[16/10] w-full overflow-hidden bg-painel-2"
      >
        <img
          src={atual.src}
          alt={atual.alt || titulo}
          width={1200}
          height={750}
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-center"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER_CARD
          }}
        />
      </div>

      {lista.length > 1 ? (
        <div
          role="group"
          aria-label={`Fotos de ${titulo}`}
          className="flex gap-2 overflow-x-auto pb-0.5"
        >
          {lista.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-pressed={i === ativa}
              aria-controls="foto-principal"
              aria-label={img.alt ? `Ver ${img.alt}` : `Ver foto ${i + 1} de ${lista.length}`}
              onClick={() => setAtiva(i)}
              className={`relative w-24 shrink-0 cursor-pointer overflow-hidden border-b-2 bg-painel-2 transition-[opacity,border-color] duration-200 sm:w-28 ${
                i === ativa ? 'border-marca opacity-100' : 'border-transparent opacity-45 hover:opacity-80'
              }`}
              style={{ aspectRatio: '16 / 10' }}
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
      ) : null}

      <p className="sr-only" aria-live="polite">
        Foto {ativa + 1} de {lista.length}: {atual.alt || titulo}
      </p>
    </div>
  )
}
