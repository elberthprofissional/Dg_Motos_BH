import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import type { EntregaPublicada } from '../../data/entregas'
import { mesDaEntrega } from '../../lib/format'

interface FotoEntrega {
  src: string
  mes: string | null
}

interface GaleriaEntregasDesktopProps {
  entregas: EntregaPublicada[]
}

/**
 * Todas as fotos publicadas, na ordem das entregas. O teto existe só
 * para o carrossel não virar uma rolagem sem fim quando o mural crescer;
 * nenhuma imagem é repetida para preencher espaço.
 */
const MAX_FOTOS = 6

/** Tempo de leitura de cada foto antes de a próxima entrar. */
const INTERVALO_SLIDE_MS = 5000

function fotosDaGaleria(entregas: EntregaPublicada[]): FotoEntrega[] {
  return entregas
    .flatMap((entrega) => {
      const mes = mesDaEntrega(entrega.entregueEm)
      return entrega.imagens.map((src) => ({ src, mes }))
    })
    .slice(0, MAX_FOTOS)
}

function AberturaGaleria({ id }: { id: string }) {
  return (
    <div>
      <h2 id={id} className="cartaz titulo-galeria text-texto">
        Sonhos{' '}
        <br />
        realizados
      </h2>
      <p className="mt-6 max-w-[34ch] text-[length:var(--step-body)] leading-relaxed text-texto-2">
        Entregas reais com autorização de quem comprou.
      </p>
    </div>
  )
}

/**
 * Vitrine editorial das entregas no desktop: texto à esquerda e um card
 * 16:9 à direita. O card carrega só a foto inteira, que passa sozinha e
 * abre em tela cheia ao clique; legendas, contagem e navegação manual
 * ficam no lightbox. O avanço pausa ao menor sinal de leitura.
 */
export function GaleriaEntregasDesktop({ entregas }: GaleriaEntregasDesktopProps) {
  const fotos = useMemo(() => fotosDaGaleria(entregas), [entregas])
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [ampliada, setAmpliada] = useState(false)
  const [indiceAmpliado, setIndiceAmpliado] = useState(0)
  const [reduzMovimento, setReduzMovimento] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const dialogRef = useRef<HTMLDialogElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement | null>(null)

  const total = fotos.length

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
    const aoMudar = (evento: MediaQueryListEvent) => setReduzMovimento(evento.matches)
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  // O carrossel passa sozinho, mas cede a vez para quem está lendo: pausa
  // com o ponteiro ou o teclado dentro do card, com o lightbox aberto e
  // para quem pediu menos movimento no sistema.
  useEffect(() => {
    if (total <= 1 || ampliada || pausado || reduzMovimento) return
    const temporizador = window.setTimeout(() => {
      setAtivo((indice) => (indice + 1) % total)
    }, INTERVALO_SLIDE_MS)
    return () => window.clearTimeout(temporizador)
  }, [ativo, total, ampliada, pausado, reduzMovimento])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (ampliada && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLButtonElement>('[data-fechar]')?.focus()
    }
    if (!ampliada && dialog.open) dialog.close()
  }, [ampliada])

  useEffect(() => {
    if (!ampliada) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [ampliada])

  if (total === 0) return null

  const fotoAtiva = fotos[ativo] ?? fotos[0]
  const fotoAmpliada = fotos[indiceAmpliado] ?? fotoAtiva

  function abrirFoto(indice: number, gatilho: HTMLButtonElement) {
    gatilhoRef.current = gatilho
    setIndiceAmpliado(indice)
    setAmpliada(true)
  }

  function navegarAmpliada(delta: number) {
    setIndiceAmpliado((indice) => (indice + delta + total) % total)
  }

  function fecharFoto() {
    setAmpliada(false)
  }

  const rotuloAmpliar = (foto: FotoEntrega) =>
    foto.mes
      ? `Ampliar foto de entrega realizada em ${foto.mes}`
      : 'Ampliar foto de entrega realizada pela DG Motos'

  const legenda = (foto: FotoEntrega) =>
    foto.mes
      ? `Foto de entrega realizada pela DG Motos em ${foto.mes}`
      : 'Foto de entrega realizada pela DG Motos'

  return (
    <>
      <div className="hidden lg:block">
        <div className="bg-[#0b0a09] py-20 xl:py-24">
          <div className="container-site grid grid-cols-12 items-center gap-x-14">
            <div className="col-span-5">
              <AberturaGaleria id="sonhos-titulo-desktop" />
            </div>

            <div className="col-span-7 flex justify-center">
              <div
                role="group"
                aria-roledescription="carrossel"
                aria-label="Fotos de entregas realizadas"
                onMouseEnter={() => setPausado(true)}
                onMouseLeave={() => setPausado(false)}
                onFocusCapture={() => setPausado(true)}
                onBlurCapture={(evento) => {
                  const alvo = evento.relatedTarget
                  if (!(alvo instanceof Node) || !evento.currentTarget.contains(alvo)) {
                    setPausado(false)
                  }
                }}
                className="relative h-[400px] w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl"
              >
                {fotos.map((foto, indice) => {
                  const visivel = indice === ativo
                  return (
                    <button
                      key={foto.src}
                      type="button"
                      onClick={(evento) => abrirFoto(indice, evento.currentTarget)}
                      aria-label={rotuloAmpliar(foto)}
                      aria-hidden={!visivel}
                      tabIndex={visivel ? 0 : -1}
                      className={`absolute inset-0 block cursor-zoom-in overflow-hidden text-left transition-opacity duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white ${
                        visivel ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'
                      }`}
                    >
                      <img
                        src={foto.src}
                        alt={visivel ? legenda(foto) : ''}
                        width={1080}
                        height={1350}
                        loading={indice === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="size-full bg-neutral-950 object-contain"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="galeria-lightbox"
        aria-label="Foto de entrega ampliada"
        onClick={(evento) => {
          if (evento.target === dialogRef.current) fecharFoto()
        }}
        onClose={() => {
          setAmpliada(false)
          const gatilho = gatilhoRef.current
          window.requestAnimationFrame(() => gatilho?.focus())
        }}
        onKeyDown={(evento) => {
          if (evento.key === 'ArrowLeft') {
            evento.preventDefault()
            navegarAmpliada(-1)
          }
          if (evento.key === 'ArrowRight') {
            evento.preventDefault()
            navegarAmpliada(1)
          }
        }}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <p className="text-sm text-texto-2">
              {fotoAmpliada.mes ?? 'Entrega realizada pela DG Motos'}
              <span className="numeros ml-4 text-texto-3">
                {indiceAmpliado + 1} / {total}
              </span>
            </p>
            <button
              type="button"
              data-fechar
              onClick={fecharFoto}
              aria-label="Fechar foto ampliada"
              className="grid size-11 shrink-0 place-items-center text-texto-2 transition-colors hover:text-texto"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </header>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-5 pb-4 sm:px-8">
            <img
              src={fotoAmpliada.src}
              alt={legenda(fotoAmpliada)}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {total > 1 && (
            <footer className="flex items-center justify-between gap-4 px-5 py-6 sm:px-8">
              <button
                type="button"
                onClick={() => navegarAmpliada(-1)}
                aria-label="Foto anterior"
                className="grid size-12 shrink-0 place-items-center border border-borda-forte text-texto-2 transition-colors hover:border-texto hover:text-texto"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <p className="hidden text-sm text-texto-3 sm:block">
                Use as setas do teclado para navegar.
              </p>
              <button
                type="button"
                onClick={() => navegarAmpliada(1)}
                aria-label="Próxima foto"
                className="grid size-12 shrink-0 place-items-center border border-borda-forte text-texto-2 transition-colors hover:border-texto hover:text-texto"
              >
                <ArrowRight className="size-5" aria-hidden="true" />
              </button>
            </footer>
          )}
        </div>
      </dialog>
    </>
  )
}
