import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/usePageMeta'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { Revelar } from '../components/ui/Revelar'
import { Marcas } from '../components/home/MarcasProcuradas'
import { SonhosRealizados } from '../components/home/SonhosRealizados'
import { useEntregasPublicadas } from '../hooks/useEntregasPublicadas'
import { buildDefaultMessage } from '../lib/format'
import heroDesktop from '../assets/hero/home-desktop.webp'
import heroMobile from '../assets/hero/home-mobile.webp'
import trocaDesktop from '../assets/troca/banner-desktop.webp'
import trocaMobile from '../assets/troca/banner-mobile.webp'

/**
 * Página inicial — a bancada da loja.
 *
 * O preto é o chão e a folha de papel é o que pousa sobre ele: a
 * vitrine de motos é uma folha inteira de papel, a vistoria é o
 * registro em texto e o fechamento volta ao preto, onde a logo
 * (traço branco) funciona.
 *
 * O texto é o mesmo que o dono aprovou: nada de promessa de origem
 * ou garantia que não possa ser comprovada (ver
 * docs/RELATORIO-REDESIGN.md).
 */
export function Home() {
  const { motos } = useCatalogo()
  const { config } = useSiteConfig()
  const entregas = useEntregasPublicadas()

  usePageMeta(
    'DG Motos — Motos seminovas em Belo Horizonte',
    'Veja as motocicletas seminovas disponíveis no estoque da DG Motos, em Belo Horizonte, MG.',
  )
  useJsonLd(autoDealerSchema(config))

  const disponiveis = useMemo(
    () => motos.filter((m) => m.status === 'disponivel'),
    [motos],
  )

  // A vitrine mostra o patio inteiro: as motos EM PROMOCAO primeiro
  // (é a oferta do dia — o selo circular e o "de → por" ficam visíveis),
  // depois as demais. Sem mais que isso — a página mostra o que existe,
  // e o estoque completo tem a lista.
  const patio = useMemo(() => {
    const emPromocao = disponiveis.filter((m) => m.emPromocao)
    const foraDaPromo = disponiveis.filter((m) => !m.emPromocao)
    return [...emPromocao, ...foraDaPromo].slice(0, 10)
  }, [disponiveis])
  return (
    <>
      <section data-hero className="overflow-hidden bg-fundo pt-cabecalho">
        <div className="relative isolate min-h-[22rem] overflow-hidden bg-fundo sm:min-h-[32rem] lg:min-h-[24rem] xl:min-h-[26rem]">
          <picture className="absolute inset-0 hidden lg:block" aria-hidden="true">
            <source srcSet={heroDesktop} type="image/webp" />
            <img
              src={heroDesktop}
              alt=""
              width={1920}
              height={640}
              fetchPriority="high"
              decoding="async"
              className="size-full object-cover object-center"
            />
          </picture>

          <picture className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden" aria-hidden="true">
            <source srcSet={heroMobile} type="image/webp" />
            <img
              src={heroMobile}
              alt=""
              width={1280}
              height={400}
              fetchPriority="high"
              decoding="async"
              className="absolute right-0 bottom-0 h-auto w-[255%] max-w-none object-contain object-right-bottom sm:w-[185%] md:w-[160%]"
            />
          </picture>

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fundo/95 via-fundo/55 to-transparent lg:hidden"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-fundo/50 to-transparent lg:hidden"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent via-fundo/40 to-fundo lg:hidden"
            aria-hidden="true"
          />

          <div className="container-site relative z-10 flex min-h-[22rem] items-start py-4 sm:min-h-[32rem] sm:py-8 lg:min-h-[24rem] lg:items-center lg:py-14 xl:min-h-[26rem]">
            <div className="max-w-[18rem] sm:max-w-[24rem] lg:max-w-xl">
              <p className="mb-2 flex items-center gap-3 text-xs font-semibold tracking-[0.12em] text-texto-2 uppercase sm:mb-5">
                <span className="h-px w-8 bg-marca" aria-hidden="true" />
                DG Motos · Belo Horizonte, MG
              </p>
              <h1 className="display max-w-[17ch] text-balance text-[1.625rem] leading-[1.04] text-texto sm:max-w-none sm:text-4xl md:text-5xl lg:text-[4.5rem]">
                Motos seminovas em Belo Horizonte.
              </h1>
              <p className="corpo mt-2 max-w-[32ch] text-sm leading-6 text-texto-2 sm:mt-5 sm:max-w-[38ch] sm:text-base sm:leading-[1.55] lg:text-[length:var(--step-body)]">
                Realizando sonhos sobre duas rodas.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-7">
                <Link to="/estoque" className="btn btn-primary min-h-11 px-5 sm:min-h-12 sm:px-6">
                  Ver estoque
                </Link>
                <span className="text-sm text-texto-2">
                  {disponiveis.length} {disponiveis.length === 1 ? 'moto no pátio' : 'motos no pátio'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. PATIO — as fichas no pátio
          ============================================================ */}
      <section id="acervo" className="bg-fundo pt-12 pb-14 sm:pt-14 sm:pb-20">
        <div className="container-site">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="titulo text-texto">Motos disponíveis</h2>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <p className="text-sm text-texto-3">
                <span className="numeros font-display text-2xl leading-none font-bold text-texto">
                  {disponiveis.length}
                </span>{' '}
                no pátio
              </p>
              <Link to="/estoque" className="btn btn-secondary h-11 gap-2 px-5 text-sm">
                Ver todo o estoque
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {patio.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {patio.map((bike, i) => (
                <Revelar key={bike.id} atraso={i * 45}>
                  <BikeCard bike={bike} priority={i < 2} />
                </Revelar>
              ))}
            </div>
          ) : patio.length === 0 ? (
            <div className="mt-12">
              <p className="titulo text-2xl text-texto">Motos no caminho</p>
              <p className="corpo mt-3 text-texto-2">
                O pátio está em virada de estoque. Chama a gente que a gente
                conta o que está chegando.
              </p>
              <Link to="/contato" className="btn btn-primary mt-6 h-11 px-5">
                Falar com a loja
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <SonhosRealizados entregas={entregas} />

      <section className="w-full bg-fundo">
        <div className="container-site flex flex-col items-start gap-6 py-10 sm:py-12 lg:flex-row lg:items-center lg:gap-8 lg:py-12">
          <div className="max-w-lg">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-marca-texto">
              DG MOTOS · TROCA
            </p>
            <h2 className="display max-w-[18ch] text-3xl sm:text-4xl lg:text-[2.75rem]">
              Sua próxima moto começa com a sua.
            </h2>
            <p className="corpo mt-4 max-w-[50ch] text-texto-2">
              Avaliamos sua moto usada com transparência para facilitar a realização do seu próximo negócio.
            </p>
            <div className="mt-7">
              <WhatsAppCTA
                message={buildDefaultMessage()}
                label="Avaliar minha moto"
                className="btn btn-primary h-11 px-6 text-sm"
              />
            </div>
          </div>

          <div className="relative hidden lg:block lg:w-[34%]">
            <div className="relative aspect-[4/3] w-full max-w-[520px] overflow-hidden">
              <picture>
                <source srcSet={trocaDesktop} type="image/webp" />
                <img
                  src={trocaDesktop}
                  alt=""
                  width={1760}
                  height={440}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover object-right"
                />
              </picture>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-fundo to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-8 w-full max-w-sm lg:hidden">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
            <picture>
              <source srcSet={trocaMobile} type="image/webp" />
              <img
                src={trocaMobile}
                alt=""
                width={1280}
                height={400}
                loading="lazy"
                decoding="async"
                className="size-full object-cover object-center"
              />
            </picture>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-fundo to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      <Marcas />

    </>
  )
}
