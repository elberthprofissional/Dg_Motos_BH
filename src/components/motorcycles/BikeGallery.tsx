import { useState } from 'react'
import type { MotorcycleImage } from '../../types'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#191919"/>
  <rect x="1" y="1" width="1198" height="798" fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M620 570 a130 130 0 1 0 0.1 0 M495 490 h56" stroke="#3a3a3a" stroke-width="18" fill="none" stroke-linecap="round"/>
  <path d="M650 445 h112 a14 14 0 0 1 14 14 v38 h-126 z" fill="#3a3a3a"/>
  <text x="600" y="225" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#4a4a4a" text-anchor="middle" letter-spacing="10">DG MOTOS</text>
  <text x="600" y="278" font-family="Arial, sans-serif" font-size="24" fill="#4a4a4a" text-anchor="middle" letter-spacing="5">FOTO EM BREVE</text>
</svg>`)

interface BikeGalleryProps {
  imagens: MotorcycleImage[]
  titulo: string
}

export function BikeGallery({ imagens, titulo }: BikeGalleryProps) {
  const [ativa, setAtiva] = useState(0)
  const atual = imagens[ativa]
  const lista = imagens.length > 0 ? imagens : [{ src: PLACEHOLDER, alt: titulo }]

  return (
    <div>
      <div className="surface relative aspect-[16/10] overflow-hidden rounded-lg bg-night-800">
        <img
          key={atual?.src ?? lista[0].src}
          src={lista[ativa]?.src ?? lista[0].src}
          alt={lista[ativa]?.alt ?? titulo}
          className="size-full animate-reveal object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER
          }}
        />
      </div>

      {lista.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3" role="listbox" aria-label="Fotos da motocicleta">
          {lista.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="option"
              aria-selected={i === ativa}
              aria-label={`Ver foto ${i + 1} de ${lista.length}`}
              onClick={() => setAtiva(i)}
              className={`aspect-[4/3] overflow-hidden rounded border transition-colors ${
                i === ativa
                  ? 'border-brand-500'
                  : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.src}
                alt=""
                loading="lazy"
                className="size-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
