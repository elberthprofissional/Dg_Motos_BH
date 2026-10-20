import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, MessageCircle } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/usePageMeta'
import { buildDefaultMessage } from '../lib/format'
import { useWhatsappLink } from '../hooks/useWhatsappLink'
import { buildMapsRouteUrl } from '../lib/maps'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { MapaLoja } from '../components/ui/MapaLoja'
import { Button } from '../components/ui/Button'

const HERO_BG = '/hero/showroom.webp'

function Carrossel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  const rolar = (direcao: -1 | 1) => {
    if (!ref.current) return
    const card = ref.current.querySelector<HTMLElement>('[data-carousel-item]')
    const step = card ? card.clientWidth + 24 : Math.round(ref.current.clientWidth * 0.7)
    ref.current.scrollBy({ left: direcao * step, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => rolar(-1)}
        aria-label="Motos em destaque - anterior"
        className="absolute top-1/2 -left-4 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/10 bg-[#101010] text-[#f5f5f5] transition-colors duration-200 hover:border-[#d91f32] hover:text-[#f5f5f5] lg:-left-6 lg:grid"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>

      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolar(1)}
        aria-label="Motos em destaque - próximo"
        className="absolute top-1/2 -right-4 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/10 bg-[#101010] text-[#f5f5f5] transition-colors duration-200 hover:border-[#d91f32] lg:-right-6 lg:grid"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function Home() {
  const { motos } = useCatalogo()
  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())

  usePageMeta(
    'DG Motos — Realizando Sonhos | Motocicletas seminovas em Belo Horizonte',
    'Loja de motocicletas seminovas em Belo Horizonte, MG. Estoque conferido, procedência verificada e negociação direta pelo WhatsApp.',
  )
  useJsonLd(autoDealerSchema(config))

  const destaques = motos
    .filter((m) => m.destaque && m.status === 'disponivel')
    .slice(0, 8)

  return (
    <>
      <section className="relative min-h-[88svh] overflow-hidden bg-[#101010] pt-16 lg:min-h-[92svh]">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt="Motocicleta em destaque no showroom da DG Motos em Belo Horizonte"
            className="absolute inset-0 size-full object-cover object-[center_35%]"
            fetchPriority="high"
            decoding="sync"
          />
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#101010] via-[#101010]/90 to-[#101010]/55"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#101010] to-transparent"
        />

        <div className="container-site relative z-10 flex min-h-[calc(88svh-4rem)] flex-col justify-center lg:min-h-[calc(92svh-4.75rem)]">
          <div className="max-w-3xl">
            <p className="font-display text-xs font-semibold tracking-[0.28em] text-[#d91f32] uppercase">
              DG Motos • Belo Horizonte, MG
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[0.04em] text-[#f5f5f5] uppercase sm:text-5xl lg:text-6xl xl:text-7xl">
              SUA PRÓXIMA MOTO COMEÇA AQUI
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#a3a3a3] sm:text-lg">
              Motos seminovas em Belo Horizonte, MG, com procedência verificada, estoque selecionado e negociação direta.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#d91f32] bg-[#d91f32] px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:bg-[#b71c2b] hover:border-[#b71c2b]"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  TENHO INTERESSE
                </a>
              ) : (
                <Link
                  to="/contato"
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#d91f32] bg-[#d91f32] px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:bg-[#b71c2b] hover:border-[#b71c2b]"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  TENHO INTERESSE
                </Link>
              )}
              <Link
                to="/estoque"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/25 px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:border-white/60 hover:bg-white/5"
              >
                VER ESTOQUE
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="motos-em-destaque" className="bg-[#101010] border-t border-white/5">
        <div className="container-site section">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-xs font-semibold tracking-[0.28em] text-[#d91f32] uppercase">
                Destaques
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-[0.06em] text-[#f5f5f5] uppercase sm:text-4xl lg:text-5xl">
                Motos em destaque
              </h2>
              <p className="mt-3 max-w-xl text-base text-[#a3a3a3]">
                Uma parte do que está disponível no nosso estoque.
              </p>
            </div>
            <Link
              to="/estoque"
              className="inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.18em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:text-[#d91f32]"
            >
              Ver todo o estoque
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {destaques.length > 0 ? (
            <div className="mt-10 lg:mt-14">
              <Carrossel>
                {destaques.map((bike) => (
                  <div
                    key={bike.id}
                    data-carousel-item
                    className="w-[88vw] shrink-0 snap-start sm:w-[380px] lg:w-[calc((100%-2rem)/3)]"
                  >
                    <BikeCard bike={bike} priority />
                  </div>
                ))}
              </Carrossel>
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center border border-white/8 bg-[#181818] px-6 py-12 text-center sm:py-16">
              <p className="font-display text-xs font-semibold tracking-[0.28em] text-[#d91f32] uppercase">
                Estoque
              </p>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[0.06em] text-[#f5f5f5] uppercase sm:text-3xl">
                Estoque em atualização
              </h3>
              <p className="mt-3 max-w-md text-[#a3a3a3]">
                Nenhuma moto em destaque no momento. Confira o catálogo completo.
              </p>
              <Link
                to="/estoque"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-sm border border-[#d91f32] bg-[#d91f32] px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:bg-[#b71c2b] hover:border-[#b71c2b]"
              >
                Ver estoque completo
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#101010] border-t border-white/5">
        <div className="container-site section">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-xs font-semibold tracking-[0.28em] text-[#d91f32] uppercase">
                Onde estamos
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-[0.06em] text-[#f5f5f5] uppercase sm:text-4xl lg:text-5xl">
                Visite a DG Motos
              </h2>
              <p className="mt-3 max-w-xl text-base text-[#a3a3a3]">
                Conheça nosso showroom em Belo Horizonte, veja as motocicletas de perto e converse com nossa equipe.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
            <div className="border border-white/8 bg-[#181818] px-6 py-8 sm:px-8">
              <p className="font-display text-lg font-semibold tracking-[0.16em] text-[#f5f5f5] uppercase">
                DG Motos
              </p>
              <address className="mt-5 flex items-start gap-3 not-italic text-[#a3a3a3]">
                <MapPin className="mt-1 size-5 shrink-0 text-[#d91f32]" aria-hidden="true" />
                <span>
                  {config.enderecoRua}
                  <br />
                  {config.enderecoCidadeUf}
                </span>
              </address>

              {config.horarios.length > 0 && (
                <dl className="mt-8 border-t border-white/6">
                  {config.horarios.map((h) => (
                    <div
                      key={h.dias}
                      className="flex items-baseline justify-between gap-4 border-b border-white/6 py-3 text-sm"
                    >
                      <dt className="text-[#a3a3a3]">{h.dias}</dt>
                      <dd className="font-medium text-[#f5f5f5]">{h.horas}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  href={buildMapsRouteUrl(config.mapsUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full justify-center"
                >
                  COMO CHEGAR
                </Button>
                <WhatsAppCTA message={buildDefaultMessage()} className="w-full justify-center" />
              </div>
            </div>

            <div className="overflow-hidden border border-white/8">
              <MapaLoja
                rotulo={`${config.enderecoRua}, ${config.enderecoCidadeUf}`}
                className="h-[300px] sm:h-[380px] lg:h-[460px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#181818] border-t border-white/5">
        <div className="container-site grid gap-8 py-16 sm:py-18 lg:grid-cols-[1.2fr_auto] lg:items-center lg:py-20">
          <div>
            <p className="font-display text-xs font-semibold tracking-[0.28em] text-[#d91f32] uppercase">
              Negociação direta
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[0.06em] text-[#f5f5f5] uppercase sm:text-4xl lg:text-5xl">
              ENCONTRO MARCADO COM SUA PRÓXIMA MOTO
            </h2>
            <p className="mt-4 max-w-xl text-base text-[#a3a3a3]">
              Consulte disponibilidade, valores e condições diretamente com a equipe DG Motos pelo WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#d91f32] bg-[#d91f32] px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:bg-[#b71c2b] hover:border-[#b71c2b]"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                FALAR COM A DG MOTOS
              </a>
            ) : (
              <Link
                to="/contato"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#d91f32] bg-[#d91f32] px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:bg-[#b71c2b] hover:border-[#b71c2b]"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                FALAR COM A DG MOTOS
              </Link>
            )}
            <Link
              to="/estoque"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/25 px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:border-white/60 hover:bg-white/5"
            >
              VER ESTOQUE
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
