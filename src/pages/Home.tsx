import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/usePageMeta'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { Revelar } from '../components/ui/Revelar'
import heroDesktopImg from '../assets/hero/home-desktop.webp'
import trocaDesktopImg from '../assets/troca/banner-desktop.webp'
import trocaMobileImg from '../assets/troca/banner-mobile.webp'
import { MarcasProcuradas } from '../components/home/MarcasProcuradas'

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

  usePageMeta(
    'DG Motos — Seminovas inspecionadas em Belo Horizonte',
    'Loja de motocicletas seminovas em Belo Horizonte, MG. Inspeção mecânica e ciclística, laudo cautelar aprovado e negociação direta pelo WhatsApp.',
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
      {/* ==========================================================      {/* ============================================================
          1. HERO — a entrada do showroom
          No celular fica só o texto, bem espaçado sobre o fundo.
          Do tablet pra cima a foto da loja cobre a metade inteira
          sem moldura e o texto pousa sobre ela, à esquerda.
          ============================================================ */}
      <section
        data-hero
        className="relative isolate w-full overflow-hidden bg-fundo pt-cabecalho"
      >
        {/* Texto único, escrito mobile-first: no celular ele mora
            sozinho sobre o fundo; do tablet pra cima a foto entra
            como camada ao fundo e o texto pousa sobre ela. */}
        <div
          data-hero-content
          className="relative z-10 lg:mx-auto lg:w-full lg:max-w-[1760px] lg:px-[length:var(--margem)]"
        >
          <div className="max-w-xl px-5 py-6 lg:py-24 lg:pl-16 lg:pr-0">
            <span className="mb-2 block text-xs font-semibold tracking-wider text-marca-texto uppercase">
              Seminovas em Belo Horizonte
            </span>

            <h1 className="mb-4 text-3xl leading-tight font-bold text-texto lg:text-5xl lg:font-extrabold">
              Seminovas inspecionadas{' '}
              <span className="text-marca-texto">com garantia</span>
            </h1>

            <p className="mb-6 max-w-md text-sm leading-relaxed text-texto-2 lg:mb-8 lg:text-base">
              Motos revisadas e prontas para rodar. Escolha o seu modelo no pátio
              da DG Motos.
            </p>

            <Link
              to="/estoque"
              className="inline-flex items-center gap-2 rounded-xl bg-marca px-6 py-3.5 font-bold text-white transition-colors hover:bg-marca-viva"
            >
              Ver estoque
            </Link>
          </div>
        </div>

        <img
          data-hero-image
          src={heroDesktopImg}
          alt=""
          className="absolute inset-0 z-0 hidden h-full w-full object-cover object-right lg:block"
          fetchPriority="high"
          decoding="sync"
          width={1920}
          height={642}
        />

        <div
          data-hero-media
          className="pointer-events-none absolute inset-0 z-[1] hidden lg:block"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0f0e0c_0%,rgba(15,14,12,0.92)_26%,rgba(15,14,12,0.45)_52%,transparent_76%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,#0f0e0c_0%,transparent_100%)]" />
        </div>
      </section>

      {/* ============================================================
          2. PATIO — as fichas no pátio
          ============================================================ */}
      <section id="acervo" className="bg-fundo pt-12 pb-16 sm:pt-16 sm:pb-24">
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
            <>
              {/* Celular: lista emfileirada, uma moto atrás da outra — o
                  pátio inteiro cabe no scroll do polegar. */}
              <ul className="mt-4 divide-y divide-borda border-y border-borda sm:hidden">
                {patio.map((bike) => (
                  <BikeCard key={bike.id} bike={bike} variante="lista" />
                ))}
              </ul>

              {/* Do tablet em diante: grade de vitrines. */}
              <div className="mt-8 hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {patio.map((bike, i) => (
                  <Revelar key={bike.id} atraso={i * 60}>
                    <BikeCard bike={bike} priority={i < 3} />
                  </Revelar>
                ))}
              </div>
            </>
          ) : (
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
          )}
        </div>
      </section>

      {/* ============================================================
          3. FECHAMENTO — troca: a oferta fica no fim da página,
          como o beija-mão da bancada. No celular é a foto protagonista,
          sem moldura; no desktop o texto pousa por cima da moto.
          ============================================================ */}
      <section className="bg-fundo">
        <Revelar>
          <div className="relative my-6 flex flex-col overflow-hidden lg:mx-0 lg:my-16 lg:min-h-[380px] lg:flex-row lg:items-center lg:justify-between lg:border-x-0 lg:bg-fundo">
            {/* Fundo (só no desktop): a moto inteira, contida à direita. */}
            <img
              src={trocaDesktopImg}
              alt=""
              aria-hidden="true"
              className="absolute inset-y-0 right-0 z-0 hidden w-1/2 object-contain object-right lg:block"
            />

            {/* Máscara (só no desktop): funde a fumaça com o preto. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 hidden w-full bg-gradient-to-r from-fundo via-fundo/60 to-transparent lg:block"
            />

            <div className="container-site relative z-10 hidden w-full !px-0 lg:!px-[length:var(--margem)] lg:flex lg:items-center">
              <div className="mx-4 max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center lg:mx-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:text-left">
                <h2 className="mb-3 text-2xl leading-tight font-extrabold text-white sm:text-3xl lg:text-4xl">
                  Sua moto usada entra na troca
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-neutral-300 lg:max-w-md">
                  Aceitamos sua moto usada como parte do pagamento, com avaliação
                  feita na loja e documentação orientada.
                </p>
                <Link
                  to="/contato"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-marca px-6 py-3 font-bold text-white transition-colors hover:bg-marca-viva"
                >
                  Falar com a loja
                </Link>
              </div>
            </div>

            {/* Mobile: a foto na proporção real, sem esticar. */}
            <img
              src={trocaMobileImg}
              alt="Moto usada avaliada para troca na DG Motos"
              className="block h-auto w-full object-cover lg:hidden"
              loading="lazy"
            />
          </div>
        </Revelar>
      </section>

      <MarcasProcuradas />
    </>
  )
}
