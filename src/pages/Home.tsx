import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/usePageMeta'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { buildMapsRouteUrl } from '../lib/maps'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { Revelar } from '../components/ui/Revelar'
import { useWhatsappLink } from '../hooks/useWhatsappLink'
import { buildDefaultMessage } from '../lib/format'
import trocaImg from '../../img/troca.png'
import heroImg from '../../img/hero-desktop.png'
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
  const waLink = useWhatsappLink(buildDefaultMessage())

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
    return [...comDestaque, ...semDestaque].slice(0, 6)
  }, [disponiveis])

  const marcasNoPatio = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const moto of disponiveis) {
      mapa.set(moto.marca, (mapa.get(moto.marca) ?? 0) + 1)
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
  }, [disponiveis])

  return (
    <>
      {/* ============================================================
          1. HERO — a entrada do showroom
          Texto à esquerda, a foto da loja à direita. A altura é curta
          de propósito: a vitrine começa logo abaixo.
          ============================================================ */}
      <section data-hero className="relative isolate overflow-hidden bg-fundo pt-cabecalho">
        <div data-hero-media className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden="true">
          <img
            data-hero-image
            src={heroImg}
            alt=""
            className="h-full w-full object-cover object-right min-[2000px]:object-contain"
            fetchPriority="high"
            decoding="sync"
            width={1910}
            height={823}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#080808_0%,rgba(8,8,8,0.96)_30%,rgba(8,8,8,0.72)_52%,rgba(8,8,8,0.22)_78%,transparent_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(0deg,#080808_0%,rgba(8,8,8,0.7)_42%,transparent_100%)]" />
        </div>

        <div data-hero-content className="container-site relative z-10 flex flex-col justify-center pt-10 pb-14 sm:pt-14 sm:pb-16 xl:min-h-[720px] xl:py-24 2xl:min-h-[780px]">
          <div className="max-w-[760px] xl:max-w-[840px]">
            <p className="mb-5 text-[13px] font-semibold tracking-[0.18em] text-texto-2 uppercase">
              Seminovas de alta qualidade
            </p>

            <h1 className="font-display text-[clamp(2.35rem,8.4vw,4.25rem)] leading-[0.9] font-bold tracking-[-0.045em] text-texto uppercase xl:text-[clamp(2.75rem,4.6vw,4.5rem)]">
              <span className="block">Seminovas</span>
              <span className="block text-marca-texto">Inspecionadas</span>
              <span className="block">em BH</span>
            </h1>

            <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-texto-2 sm:text-lg">
              Inspe??o mec?nica e cicl?stica, laudo cautelar e negocia??o direta.
              Escolha a sua no p?tio da DG Motos.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/estoque" className="btn btn-primary h-12 gap-2 px-6 font-bold">
                Ver motos dispon?veis
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary h-12 px-6 font-bold"
                >
                  Falar no WhatsApp
                </a>
              ) : (
                <Link to="/contato" className="btn btn-secondary h-12 px-6 font-bold">
                  Falar no WhatsApp
                </Link>
              )}
            </div>

            <dl className="mt-10 grid max-w-[520px] grid-cols-3 gap-5 sm:gap-8">
              <div>
                <dt className="text-[11px] font-medium tracking-[0.14em] text-texto-3 uppercase">
                  No p?tio
                </dt>
                <dd className="numeros mt-1.5 font-display text-3xl leading-none font-bold text-texto">
                  {disponiveis.length}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium tracking-[0.14em] text-texto-3 uppercase">
                  Marcas
                </dt>
                <dd className="numeros mt-1.5 font-display text-3xl leading-none font-bold text-texto">
                  {marcasNoPatio.length}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium tracking-[0.14em] text-texto-3 uppercase">
                  Inspe??o
                </dt>
                <dd className="mt-1.5 font-display text-sm leading-tight font-bold text-texto">
                  Mec?nica e cicl?stica
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div data-hero-mobile className="relative xl:hidden">
          <img
            data-hero-mobile-image
            src={heroImg}
            alt="Moto em destaque no showroom da DG Motos"
            className="aspect-[4/3] w-full object-cover object-right sm:aspect-[16/9]"
            fetchPriority="high"
            decoding="async"
            width={1910}
            height={823}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,#080808_0%,rgba(8,8,8,0.35)_38%,transparent_100%)]" />
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
              <p className="corpo mt-3 max-w-[52ch] text-texto-2">
                Cada unidade do pátio passa por inspeção mecânica e ciclística
                antes de entrar na vitrine.
              </p>
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
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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
      <section className="section bg-fundo">
        <Revelar>
          <div className="banner-troca relative w-full overflow-hidden">
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,#3b0004_0%,#8f0310_9%,#86020c_48%,#6b0108_86%,#2c0003_100%)]"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-cover bg-[position:88%_center] bg-no-repeat xl:bg-contain xl:bg-right"
              style={{
                backgroundImage: `url(${trocaImg})`,
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(40,0,2,0.45)_0%,rgba(60,0,4,0.34)_35%,rgba(80,0,6,0.1)_70%,transparent_100%)]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(35,0,2,0.5)_0%,rgba(60,0,4,0.38)_55%,rgba(70,0,5,0.22)_100%)] lg:hidden"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(40,0,2,0.38)_0%,rgba(40,0,2,0.08)_55%,transparent_100%)] lg:hidden"
              aria-hidden="true"
            />

            <div className="container-site relative z-10 flex min-h-[500px] flex-col justify-center py-16 sm:min-h-[540px] sm:py-20 lg:min-h-[580px] lg:py-24">
              <div className="max-w-[560px] lg:max-w-[44%]">
                <h2 className="font-display text-[clamp(2.2rem,5.2vw,4.5rem)] leading-[0.93] font-bold tracking-[-0.04em] text-texto">
                  <span className="block">Sua moto usada</span>
                  <span className="block text-marca-texto">entra na troca</span>
                </h2>
                <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-texto-2 sm:text-lg">
                  Aceitamos sua moto usada como parte do pagamento.
                  <br />
                  A avaliação é feita na loja, com a documentação orientada.
                </p>
                <Link to="/contato" className="btn btn-primary mt-8 h-12 px-6 font-bold">
                  Falar com a loja
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Revelar>

        <div className="container-site mt-14 grid gap-10 sm:mt-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="titulo text-texto">Procurando algo específico?</h2>
            <p className="corpo mt-4 max-w-[46ch] text-texto-2">
              Se você não encontrou o modelo que queria, fala com a gente. A gente
              procura e avisa quando chegar.
            </p>
          </div>

          <div>
            <p className="text-sm text-texto-3">Showroom</p>
            <address className="mt-4 not-italic">
              <p className="font-display text-3xl leading-tight font-bold text-texto">
                {config.enderecoRua}
              </p>
              <p className="corpo mt-2 text-texto-2">{config.enderecoCidadeUf}</p>
            </address>
            <a
              href={buildMapsRouteUrl(config)}
              target="_blank"
              rel="noopener noreferrer"
              className="link-acao mt-6"
            >
              <span>Traçar rota no Google Maps</span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <MarcasProcuradas />
    </>
  )
}
