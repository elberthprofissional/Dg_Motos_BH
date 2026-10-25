import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarrosselFotosProps {
  imagens: string[]
  moto: string
  /** Recorte do quadro é do pai: o carrossel preenche a caixa. */
  className?: string
  /** Capa do mural carrega junto com a página; no leitor, pode ser lazy. */
  prioridade?: boolean
}

/**
 * ============================================================
 * CARROSSEL DO POST
 * ============================================================
 * As fotos se trocam por setas, pontos ou arrasto, como num post de
 * Instagram. As setas ficam sempre visíveis: escondidas atrás de
 * `:hover`, elas simplesmente não existem no celular — e um post com
 * seis fotos mostrava só a primeira.
 */
export function CarrosselFotos({
  imagens,
  moto,
  className = '',
  prioridade = false,
}: CarrosselFotosProps) {
  const [atual, setAtual] = useState(0)
  const toqueInicial = useRef<number | null>(null)

  const total = imagens.length
  const andar = (passo: number) => setAtual((valor) => (valor + passo + total) % total)

  function aoTerminarToque(evento: React.TouchEvent) {
    if (toqueInicial.current === null) return
    const deslocamento = evento.changedTouches[0].clientX - toqueInicial.current
    toqueInicial.current = null
    // 40 px separam intenção de navegação de um toque que só queria
    // rolar a página na diagonal.
    if (Math.abs(deslocamento) > 40) andar(deslocamento < 0 ? 1 : -1)
  }

  return (
    <div
      className={`relative size-full overflow-hidden bg-painel-2 ${className}`}
      onTouchStart={(evento) => {
        toqueInicial.current = evento.touches[0].clientX
      }}
      onTouchEnd={aoTerminarToque}
    >
      <img
        src={imagens[atual]}
        alt={`Entrega da ${moto} pela DG Motos — foto ${atual + 1} de ${total}`}
        className="absolute inset-0 size-full object-cover"
        width={1200}
        height={1500}
        fetchPriority={prioridade && atual === 0 ? 'high' : undefined}
        loading={prioridade ? 'eager' : 'lazy'}
        decoding="async"
      />

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={() => andar(-1)}
            aria-label="Foto anterior"
            className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center bg-black/55 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => andar(1)}
            aria-label="Próxima foto"
            className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center bg-black/55 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {imagens.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setAtual(index)}
                aria-label={`Ver foto ${index + 1} de ${total}`}
                aria-current={index === atual ? 'true' : undefined}
                className="grid size-6 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span
                  aria-hidden="true"
                  className={`h-1 rounded-full transition-all ${
                    index === atual ? 'w-5 bg-white' : 'w-2 bg-white/60'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
