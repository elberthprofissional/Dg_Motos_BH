import { useEffect, useMemo, useState } from 'react'
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

/** Tempo de cada foto antes de a próxima entrar. */
const INTERVALO_SLIDE_MS = 3000

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
        <span className="text-marca">realizados</span>
      </h2>
      <p className="mt-6 max-w-[34ch] text-[length:var(--step-body)] leading-relaxed text-texto-2">
        Mais do que uma compra: um sonho realizado.
      </p>
    </div>
  )
}

/**
 * Vitrine editorial das entregas no desktop: texto à esquerda e um card
 * 16:9 à direita. As fotos se revezam sozinhas, sem controles sobre a
 * imagem. No sistema com menos movimento, a troca é seca.
 */
export function GaleriaEntregasDesktop({ entregas }: GaleriaEntregasDesktopProps) {
  const fotos = useMemo(() => fotosDaGaleria(entregas), [entregas])
  const [ativo, setAtivo] = useState(0)
  const [reduzMovimento, setReduzMovimento] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const total = fotos.length

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
    const aoMudar = (evento: MediaQueryListEvent) => setReduzMovimento(evento.matches)
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  useEffect(() => {
    if (total <= 1) return
    const temporizador = window.setTimeout(() => {
      setAtivo((indice) => (indice + 1) % total)
    }, INTERVALO_SLIDE_MS)
    return () => window.clearTimeout(temporizador)
  }, [ativo, total])

  if (total === 0) return null

  const indiceAtivo = ativo % total

  const legenda = (foto: FotoEntrega) =>
    foto.mes
      ? `Foto de entrega realizada pela DG Motos em ${foto.mes}`
      : 'Foto de entrega realizada pela DG Motos'

  return (
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
              className="relative h-[400px] w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl"
            >
              {fotos.map((foto, indice) => {
                const visivel = indice === indiceAtivo
                return (
                  <img
                    key={foto.src}
                    src={foto.src}
                    alt={visivel ? legenda(foto) : ''}
                    aria-hidden={!visivel}
                    width={1080}
                    height={1350}
                    loading={indice === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className={`absolute inset-0 size-full bg-neutral-950 object-contain ${
                      reduzMovimento ? '' : 'transition-opacity duration-500 ease-out'
                    } ${visivel ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
