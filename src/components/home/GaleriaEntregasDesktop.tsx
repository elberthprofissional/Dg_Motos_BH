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

/** Tempo de cada foto antes da próxima entrar. */
const INTERVALO_SLIDE_MS = 4000

/**
 * Todas as fotos publicadas, na ordem das entregas — sem teto: se o
 * dono publicar cinquenta entregas, as cinquenta passam. O slide
 * carrega uma imagem por vez, então o mural pode crescer sem pesar.
 */
function fotosDaGaleria(entregas: EntregaPublicada[]): FotoEntrega[] {
  return entregas.flatMap((entrega) => {
    const mes = mesDaEntrega(entrega.entregueEm)
    return entrega.imagens.map((src) => ({ src, mes }))
  })
}

/**
 * ============================================================
 * SONHOS REALIZADOS — desktop
 * ============================================================
 * Galeria de conquista: quadro grande com a foto completa (contain,
 * nada de corte) e a sequência correndo no tempo. Sem datas, nomes,
 * miniaturas ou indicadores: as fotografias falam por si, e o mural
 * cresce com o estoque de entregas sem encher a página de quadradinhos.
 * Uma imagem grande no DOM por vez.
 */
export function GaleriaEntregasDesktop({ entregas }: GaleriaEntregasDesktopProps) {
  const fotos = useMemo(() => fotosDaGaleria(entregas), [entregas])
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)
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
    if (total <= 1 || pausado || reduzMovimento) return
    const temporizador = window.setTimeout(() => {
      setAtivo((indice) => (indice + 1) % total)
    }, INTERVALO_SLIDE_MS)
    return () => window.clearTimeout(temporizador)
  }, [ativo, total, pausado, reduzMovimento])

  if (total === 0) return null

  const indiceAtivo = ativo % total
  const foto = fotos[indiceAtivo]

  return (
    <div className="hidden lg:block">
      {/* Respiro mais curto: a seção respirava demais e o quadro ficava
          boiando num vazio grande em cima e embaixo. */}
      <div className="bg-fundo py-12 text-noite-texto xl:py-16">
        <div className="container-site grid grid-cols-12 items-center gap-x-10">
          {/* Texto: compacto e alinhado ao topo da foto. */}
          <div className="col-span-4">
            <h2 className="cartaz text-[length:clamp(2.25rem,3.5vw,3.5rem)] text-noite-texto">
              Sonhos realizados
            </h2>
            <span aria-hidden="true" className="mt-5 block h-0.5 w-14 bg-marca" />
            <p className="mt-5 max-w-[32ch] text-[length:var(--step-body)] leading-relaxed text-noite-texto-2">
              Quem já passou por aqui — Clientes que escolheram a DG Motos.
            </p>
          </div>

          {/* Galeria: quadro grande com luz de marca discreta e a foto
              completa, passando sozinha. */}
          <div
            className="col-span-8"
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
            onFocusCapture={() => setPausado(true)}
            onBlurCapture={() => setPausado(false)}
          >
            <div
              role="group"
              aria-roledescription="carrossel"
              aria-label="Fotos de entregas realizadas. Pausa ao passar o mouse ou focar."
              className="corte-velocidade relative flex h-[min(64vh,38rem)] w-full items-center justify-center overflow-hidden bg-noite-2 shadow-[0_0_90px_rgb(211_36_14/0.10)]"
            >
              <img
                key={foto.src}
                src={foto.src}
                alt={
                  foto.mes
                    ? `Foto de entrega realizada pela DG Motos em ${foto.mes}`
                    : 'Foto de entrega realizada pela DG Motos'
                }
                width={1600}
                height={1600}
                loading="lazy"
                decoding="async"
                className={`size-full object-contain ${
                  reduzMovimento ? '' : 'galeria-entra'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
