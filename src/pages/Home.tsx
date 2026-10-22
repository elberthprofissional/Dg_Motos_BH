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
import trocaDesktopImg from '../assets/troca/banner-desktop.webp'
import trocaMobileImg from '../assets/troca/banner-mobile.webp'
import heroDesktopImg from '../assets/hero/home-desktop.webp'
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

  // A vitrine mostra o patio inteiro: a moto marcada como destaque
  // primeiro, depois as demais. Sem mais que isso — a página mostra
  // o que existe, e o estoque completo tem a lista.
  const patio = useMemo(() => {
    const comDestaque = disponiveis.filter((m) => m.destaque)
    const semDestaque = disponiveis.filter((m) => !m.destaque)
    return [...comDestaque, ...semDestaque].slice(0, 10)
  }, [disponiveis])

  return (
    <>
      {/* ============================================================
          1. HERO — a entrada do showroom
          Duas colunas: o texto à esquerda e a foto da loja à direita,
          cobrindo a metade inteira sem moldura. No celular a foto vem
          abaixo do texto, como um recorte de showroom.
          ============================================================ */}
      <section
        data-hero
        className="relative isolate w-full overflow-hidden bg-fundo pt-cabecalho"
      >
        {/* ---- MOBILE: só o texto, bem espaçado ---- */}
        <div data-hero-mobile className="px-5 py-6 lg:hidden">
          <span className="mb-2 block text-xs font-semibold tracking-wider text-marca-texto uppercase">
            Seminovas em Belo Horizonte
          </span>

          <h2 className="mb-4 text-3xl leading-tight font-bold text-texto">
            Seminovas inspecionadas{' '}
            <span className="text-marca-texto">com garantia</span>
          </h2>

          <p className="mb-6 max-w-md text-sm leading-relaxed text-texto-2">
            Motos revisadas e prontas para rodar. Escolha o seu modelo no pátio
            da DG Motos.
          </p>

          <Link
            to="/estoque"
            className="inline-flex items-center gap-2 rounded-xl bg-marca px-6 py-3.5 font-bold text-white shadow-lg shadow-[#2c0003]/40 transition-all hover:bg-marca-viva"
          >
            Ver estoque
          </Link>
        </div>

        {/* ---- DESKTOP: foto cobrindo tudo + texto sobreposto ---- */}
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
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#080808_0%,rgba(8,8,8,0.92)_26%,rgba(8,8,8,0.45)_52%,transparent_76%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,#080808_0%,transparent_100%)]" />
        </div>

        <div
          data-hero-content
          className="container-site relative z-10 hidden lg:block"
        >
          <div className="max-w-xl py-16 pl-8 lg:py-24 lg:pl-16">
            <span className="mb-2 block text-xs font-semibold tracking-wider text-marca-texto uppercase">
              Seminovas em Belo Horizonte
            </span>

            <h1 className="mb-4 text-4xl leading-tight font-extrabold text-texto lg:text-5xl">
              Seminovas inspecionadas{' '}
              <span className="text-marca-texto">com garantia</span>
            </h1>

            <p className="mb-8 max-w-md text-sm leading-relaxed text-texto-2 lg:text-base">
              Motos revisadas e prontas para rodar. Escolha o seu modelo no pátio
              da DG Motos.
            </p>

            <Link
              to="/estoque"
              className="inline-flex items-center gap-2 rounded-xl bg-marca px-6 py-3.5 font-bold text-white shadow-lg shadow-[#2c0003]/40 transition-all hover:bg-marca-viva"
            >
              Ver estoque
            </Link>
          </div>
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
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {patio.map((bike, i) => (
                  <Revelar key={bike.id} atraso={i * 60}>
                    <BikeCard bike={bike} priority={i < 3} />
                  </Revelar>
                ))}
              </div>

            </>
          ) : (
            <div className="mt-12">
              <p className="titulo text-2xl text-texto">Estoque em atualização</p>
              <p className="corpo mt-3 text-texto-2">
                Estamos preparando as próximas unidades. Enquanto isso, fale com a
                equipe para saber o que está chegando.
              </p>
              <Link to="/contato" className="btn btn-primary mt-6 h-11 px-5">
                Falar com a loja
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          4. FECHAMENTO — troca, showroom e pedido específico
          ============================================================ */}
      <section className="bg-fundo">
        <Revelar>
          {/* No celular o banner é um cartão vertical: texto centralizado,
              botão e a moto isolada embaixo. No desktop vira faixa full-bleed
              com a moto à direita e o texto à esquerda. */}
          <div className="relative mx-4 my-10 flex flex-col items-center overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center lg:mx-0 lg:my-16 lg:min-h-[380px] lg:flex-row lg:justify-between lg:border-x-0 lg:bg-black lg:px-0 lg:text-left">
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
              className="pointer-events-none absolute inset-0 z-0 hidden w-full bg-gradient-to-r from-black via-black/60 to-transparent lg:block"
            />

            <div className="container-site relative z-10 !px-0 lg:!px-[length:var(--margem)] lg:flex lg:items-center">
              <div className="max-w-lg">
                <h2 className="mb-3 text-2xl leading-tight font-extrabold text-white sm:text-3xl lg:text-4xl">
                  Sua moto usada entra na troca
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-neutral-300 lg:max-w-md">
                  Aceitamos sua moto usada como parte do pagamento, com avaliação
                  feita na loja e documentação orientada.
                </p>
                <Link
                  to="/contato"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-marca px-6 py-3 font-bold text-white shadow-lg shadow-[#2c0003]/30 transition-all hover:bg-marca-viva"
                >
                  Falar com a loja
                </Link>
              </div>
            </div>

            {/* Moto isolada, abaixo do botão — só no celular. */}
            <img
              src={trocaMobileImg}
              alt="Moto usada para troca"
              className="mt-4 h-40 w-full object-contain lg:hidden"
            />
          </div>
        </Revelar>

      </section>

      <MarcasProcuradas />
    </>
  )
}
