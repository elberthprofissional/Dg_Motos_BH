import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react'
import type { EntregaPublicada } from '../../data/entregas'
import { mesDaEntrega } from '../../lib/format'

interface FotoEntrega {
  src: string
  mes: string | null
}

interface GaleriaEntregasDesktopProps {
  entregas: EntregaPublicada[]
}

const ALTURA_CABECALHO = 68

function useReduzirMovimento() {
  return useSyncExternalStore(
    (avisar) => {
      if (typeof window === 'undefined') return () => {}
      const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
      consulta.addEventListener('change', avisar)
      return () => consulta.removeEventListener('change', avisar)
    },
    () => {
      if (typeof window === 'undefined') return false
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },
    () => false,
  )
}

/**
 * Todas as fotos publicadas, na ordem das entregas. O teto existe só
 * para o palco não virar uma rolagem sem fim quando o mural crescer;
 * nenhuma imagem é repetida para preencher espaço.
 */
const MAX_FOTOS = 6

function fotosDaGaleria(entregas: EntregaPublicada[]): FotoEntrega[] {
  return entregas
    .flatMap((entrega) => {
      const mes = mesDaEntrega(entrega.entregueEm)
      return entrega.imagens.map((src) => ({ src, mes }))
    })
    .slice(0, MAX_FOTOS)
}

function AberturaGaleria({ id, className = '' }: { id: string; className?: string }) {
  return (
    <div className={className}>
      <h2 id={id} className="cartaz titulo-galeria text-texto">
        Sonhos{' '}
        <br />
        realizados
      </h2>
      <p className="mt-6 max-w-[34ch] text-[length:var(--step-body)] leading-relaxed text-texto-2">
        Entregas reais com autorização de quem comprou.
      </p>
      <Link to="/sonhos" className="link-acao mt-7 text-[0.9375rem]">
        Ver galeria completa
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

export function GaleriaEntregasDesktop({ entregas }: GaleriaEntregasDesktopProps) {
  const fotos = useMemo(() => fotosDaGaleria(entregas), [entregas])
  const reduzir = useReduzirMovimento()
  const [ativo, setAtivo] = useState(0)
  const [ampliada, setAmpliada] = useState(false)
  const [indiceAmpliado, setIndiceAmpliado] = useState(0)
  const palcoRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement | null>(null)

  const total = fotos.length
  const usaPalcoFixo = total >= 3 && !reduzir

  // O palco fica preso sob o cabeçalho enquanto a seção percorre
  // duas a três telas. A foto ativa é derivada da posição do scroll,
  // nunca de um autoplay: o visitante manda no ritmo.
  useEffect(() => {
    if (!usaPalcoFixo) return
    const palco = palcoRef.current
    if (!palco) return

    let quadro = 0
    const medir = () => {
      quadro = 0
      const caixa = palco.getBoundingClientRect()
      const alturaPalco = window.innerHeight - ALTURA_CABECALHO
      const percurso = palco.offsetHeight - alturaPalco
      const progresso = Math.min(
        1,
        Math.max(0, (ALTURA_CABECALHO - caixa.top) / Math.max(1, percurso)),
      )
      const indice = Math.min(total - 1, Math.floor(progresso * total))
      setAtivo((anterior) => (anterior === indice ? anterior : indice))
    }
    const agendar = () => {
      if (!quadro) quadro = window.requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener('scroll', agendar, { passive: true })
    window.addEventListener('resize', agendar)
    return () => {
      window.cancelAnimationFrame(quadro)
      window.removeEventListener('scroll', agendar)
      window.removeEventListener('resize', agendar)
    }
  }, [total, usaPalcoFixo])

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

  function navegar(delta: number) {
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
        {usaPalcoFixo ? (
          <div
            ref={palcoRef}
            className="relative"
            style={{ height: `calc(100svh - 4.25rem + ${(total - 1) * 60}svh)` }}
          >
            <div className="sticky top-[4.25rem] h-[calc(100svh-4.25rem)] overflow-hidden bg-[#0b0a09]">
              <div className="container-site grid h-full grid-cols-12 gap-x-8">
                <div className="col-span-5 flex flex-col justify-between py-10 xl:py-14">
                  <AberturaGaleria id="sonhos-titulo-desktop" />

                  <div className="flex items-end justify-between gap-8">
                    <div>
                      <p className="numeros text-sm text-texto-3">
                        {String(ativo + 1).padStart(2, '0')} /{' '}
                        {String(total).padStart(2, '0')}
                      </p>
                      <p className="mt-2 font-display text-lg leading-snug text-texto">
                        {fotoAtiva.mes ?? 'Entrega realizada'}
                      </p>
                    </div>
                    <p className="max-w-[20ch] pb-1 text-sm leading-relaxed text-texto-3">
                      Clique na foto para ampliar.
                    </p>
                  </div>
                </div>

                <div className="relative col-span-7 flex h-full items-center py-10 xl:py-14">
                  <div className="relative ml-auto h-full max-h-[45rem] w-full max-w-[34rem]">
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
                          className={`absolute inset-0 block overflow-hidden bg-painel-2 text-left transition-opacity duration-700 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca-texto ${
                            visivel
                              ? 'z-10 opacity-100'
                              : 'pointer-events-none z-0 opacity-0'
                          }`}
                        >
                          <img
                            src={foto.src}
                            alt={visivel ? legenda(foto) : ''}
                            width={1080}
                            height={1350}
                            loading={indice === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            className="size-full object-cover"
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0b0a09] py-20">
            <div className="container-site grid grid-cols-12 gap-x-8 gap-y-12">
              <AberturaGaleria
                id="sonhos-titulo-desktop"
                className="col-span-4 self-start"
              />
              <div
                className={`col-span-8 grid gap-4 ${
                  total === 1 ? 'grid-cols-1' : total === 2 ? 'grid-cols-2' : 'grid-cols-3'
                }`}
              >
                {fotos.map((foto, indice) => (
                  <button
                    key={foto.src}
                    type="button"
                    onClick={(evento) => abrirFoto(indice, evento.currentTarget)}
                    aria-label={rotuloAmpliar(foto)}
                    className={`relative aspect-[4/5] overflow-hidden bg-painel-2 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca-texto ${
                      total === 1 ? 'w-full max-w-[30rem] justify-self-end' : ''
                    }`}
                  >
                    <img
                      src={foto.src}
                      alt={legenda(foto)}
                      width={720}
                      height={900}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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
            navegar(-1)
          }
          if (evento.key === 'ArrowRight') {
            evento.preventDefault()
            navegar(1)
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
                onClick={() => navegar(-1)}
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
                onClick={() => navegar(1)}
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
