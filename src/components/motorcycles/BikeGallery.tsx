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
 * A foto aparece inteira, no proportionamento dela, sobre a bancada:
 * o retrato 4:5, o panorâmico 16:9 e o quadrado 900×900 são três
 * recortes diferentes da mesma moto, e nenhum deles pode ser
 * esticado nem cortado para caber num quadro só. O que fica em volta
 * da foto é a bancada, não uma moldura.
 *
 * Uma imagem por vez: as miniaturas abaixo abrem a foto grande. A
 * miniatura escolhida é a nítida; as outras, apagadas. Sem contador
 * "1 / 3" e sem cantos de registro — a ficha não é um formulário.
 */
export function BikeGallery({ imagens, titulo }: BikeGalleryProps) {
  const [ativa, setAtiva] = useState(0)
  const lista = imagens.length > 0 ? imagens : [{ src: PLACEHOLDER_CARD, alt: titulo }]
  const atual = lista[ativa] ?? lista[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-painel-2">
        <img
          key={atual.src}
          src={atual.src}
          alt={atual.alt || titulo}
          width={1600}
          height={1000}
          className="size-full object-contain"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER_CARD
          }}
        />
      </div>

      {lista.length > 1 && (
        <div
          className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6"
          role="group"
          aria-label="Fotos da motocicleta"
        >
          {lista.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-pressed={i === ativa}
              aria-label={`Ver foto ${i + 1} de ${lista.length}`}
              onClick={() => setAtiva(i)}
              className={`overflow-hidden border transition-colors ${
                i === ativa
                  ? 'border-marca'
                  : 'border-borda hover:border-borda-forte'
              }`}
            >
              <img
                src={img.src}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER_CARD
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
