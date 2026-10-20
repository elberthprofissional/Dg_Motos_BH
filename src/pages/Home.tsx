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

// Sufixo -2026-02 no nome: força o navegador/CDN a baixar a foto nova.
// Trocar só o conteúdo do arquivo mantém a mesma URL, e o cache antigo
// continua sendo servido — por isso o nome é versionado.
const HERO_BG = '/hero/showroom-2026-02.webp'

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
        className="absolute top-1/2 -left-4 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-night-900 text-steel-300 transition-colors duration-200 hover:border-line-forte hover:text-paper lg:-left-5 lg:grid"
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
        className="absolute top-1/2 -right-4 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-night-900 text-steel-300 transition-colors duration-200 hover:border-line-forte hover:text-paper lg:-right-5 lg:grid"
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
      <section className="relative flex min-h-[88svh] items-center overflow-hidden bg-night-950 pt-[71px] lg:min-h-[92svh] lg:pt-[79px]">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt="Motocicleta em destaque no showroom da DG Motos em Belo Horizonte"
            className="absolute inset-0 size-full object-cover object-[center_38%]"
            fetchPriority="high"
            decoding="sync"
          />
        </div>

        {/* Scrim editorial: escurece a metade onde vive o texto e solta a
            foto à direita. Um único gradiente direcional cumpre a leitura
            sem apagar a motocicleta — nada de uma película escura uniforme
            sobre a imagem. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-night-950 via-night-950/85 to-night-950/20 lg:via-night-950/70"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night-950 to-transparent"
        />

        <div className="container-site relative z-10 py-16 lg:py-20">
          <div className="max-w-[36rem]">
            <p className="flex items-center gap-3 font-display text-xs font-semibold tracking-[0.28em] text-brand-500 uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-brand-500" />
              DG Motos • Belo Horizonte
            </p>
            <h1 className="mt-6 font-display text-4xl leading-[1.04] font-semibold tracking-[0.02em] text-paper uppercase sm:text-5xl lg:text-6xl">
              Realizando
              <br className="hidden sm:block" /> sonhos
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-steel-300 sm:text-lg">
              Seminovas em Belo Horizonte, MG. Estoque selecionado, procedência
              verificada e negociação direta com quem entende de moto.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-brand-500 px-7 py-3.5 font-display text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors duration-200 hover:bg-brand-600"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Tenho interesse
                </a>
              ) : (
                <Link
                  to="/contato"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-brand-500 px-7 py-3.5 font-display text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors duration-200 hover:bg-brand-600"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Tenho interesse
                </Link>
              )}
              <Link
                to="/estoque"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-line-forte px-7 py-3.5 font-display text-xs font-semibold tracking-[0.2em] text-paper uppercase transition-colors duration-200 hover:border-white/40 hover:bg-white/5"
              >
                Ver estoque
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="motos-em-destaque" className="border-t border-line bg-night-950">
        <div className="container-site section">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-[0.04em] text-paper uppercase sm:text-4xl lg:text-5xl">
                Motos em destaque
              </h2>
            </div>
            <Link
              to="/estoque"
              className="inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.18em] text-paper uppercase transition-colors duration-200 hover:text-brand-500"
            >
              Ver todos os modelos
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
            <div className="mt-10 flex flex-col items-center border border-line bg-night-900 px-6 py-12 text-center sm:py-16">
              <p className="rotulo">Estoque</p>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[0.04em] text-paper uppercase sm:text-3xl">
                Estoque em atualização
              </h3>
              <p className="mt-3 max-w-md text-steel-400">
                Nenhuma moto em destaque no momento. Confira o catálogo completo.
              </p>
              <Link
                to="/estoque"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-sm bg-brand-500 px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors duration-200 hover:bg-brand-600"
              >
                Ver estoque completo
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-line bg-night-950">
        <div className="container-site section">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="rotulo">Onde estamos</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-[0.04em] text-paper uppercase sm:text-4xl lg:text-5xl">
                Visite a DG Motos
              </h2>
              <p className="mt-3 max-w-xl text-base text-steel-400">
                Conheça nosso showroom em Belo Horizonte, veja as motocicletas de perto e converse com nossa equipe.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch lg:gap-10">
            <div className="flex flex-col border border-line bg-night-900 px-6 py-8 sm:px-8">
              <p className="font-display text-lg font-semibold tracking-[0.14em] text-paper uppercase">
                DG Motos
              </p>
              <address className="mt-5 flex items-start gap-3 not-italic text-steel-400">
                <MapPin className="mt-1 size-5 shrink-0 text-brand-500" aria-hidden="true" />
                <span>
                  {config.enderecoRua}
                  <br />
                  {config.enderecoCidadeUf}
                </span>
              </address>

              {config.horarios.length > 0 && (
                <dl className="mt-6 border-t border-line">
                  {config.horarios.map((h) => (
                    <div
                      key={h.dias}
                      className="flex items-baseline justify-between gap-4 border-b border-line py-3 text-sm"
                    >
                      <dt className="text-steel-400">{h.dias}</dt>
                      <dd className="font-medium text-paper">{h.horas}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-8 flex flex-col gap-3 lg:mt-auto lg:pt-8">
                <Button
                  href={buildMapsRouteUrl(config.mapsUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full justify-center"
                >
                  Como chegar
                </Button>
                <WhatsAppCTA message={buildDefaultMessage()} className="w-full justify-center" />
              </div>
            </div>

            <div className="overflow-hidden border border-line">
              <MapaLoja
                rotulo={`${config.enderecoRua}, ${config.enderecoCidadeUf}`}
                className="h-[300px] sm:h-[380px] lg:h-full lg:min-h-[460px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-line bg-night-900">
        <div className="riscos absolute inset-0" aria-hidden="true" />
        <div className="container-site relative z-10 grid gap-8 py-16 sm:py-18 lg:grid-cols-[1.2fr_auto] lg:items-center lg:py-20">
          <div>
            <p className="rotulo">Negociação direta</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[0.04em] text-paper uppercase sm:text-4xl lg:text-5xl">
              Encontro marcado com sua próxima moto
            </h2>
            <p className="mt-4 max-w-xl text-base text-steel-400">
              Consulte disponibilidade, valores e condições diretamente com a equipe DG Motos pelo WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-brand-500 px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors duration-200 hover:bg-brand-600"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Falar com a DG Motos
              </a>
            ) : (
              <Link
                to="/contato"
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-brand-500 px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors duration-200 hover:bg-brand-600"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Falar com a DG Motos
              </Link>
            )}
            <Link
              to="/estoque"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-line-forte px-8 py-3 font-display text-xs font-semibold tracking-[0.2em] text-paper uppercase transition-colors duration-200 hover:border-white/40 hover:bg-white/5"
            >
              Ver estoque
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
