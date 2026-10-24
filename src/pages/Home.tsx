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
import { MarcasProcuradas } from '../components/home/MarcasProcuradas'
import { entregasRealizadas } from '../data/entregas'
import { SonhosRealizados } from '../components/home/SonhosRealizados'
import { bikeTitle, formatPrice } from '../lib/format'

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
  const destaque = patio[0]
  const demaisMotos = patio.slice(1)

  return (
    <>
      <section data-hero className="bg-fundo pt-cabecalho">
        <div className="container-site py-8 sm:py-12 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
            <div className="max-w-xl">
              <h1 className="display text-4xl text-texto sm:text-5xl lg:text-6xl">
                Motos seminovas em Belo Horizonte
              </h1>
              <p className="corpo mt-5 text-texto-2">
                Compare os modelos disponíveis, veja ano e preço e escolha com
                calma a próxima moto para a sua estrada.
              </p>
              <Link to="/estoque" className="btn btn-primary mt-7 min-h-12 px-6">
                Explorar estoque
              </Link>
            </div>

            {destaque ? (
              <Link
                to={`/moto/${destaque.slug}`}
                aria-label={`Ver ${bikeTitle(destaque)}, ${destaque.ano}, por ${formatPrice(destaque.preco)}`}
                className="group block min-w-0 bg-painel focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foco"
              >
                <div className="grid min-h-72 grid-cols-1 sm:min-h-96 sm:grid-cols-[minmax(0,1fr)_13rem]">
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-painel-2 sm:aspect-auto">
                    {destaque.imagens[0] ? (
                      <img
                        src={destaque.imagens[0].src}
                        alt={destaque.imagens[0].alt || bikeTitle(destaque)}
                        width={1200}
                        height={1600}
                        fetchPriority="high"
                        decoding="async"
                        className="size-full object-contain p-4 transition-transform duration-300 motion-safe:group-hover:scale-[1.02] sm:p-7"
                      />
                    ) : (
                      <p className="px-6 text-center text-sm text-texto-2">
                        Foto ainda não disponível
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col justify-between gap-5 p-5 sm:p-7">
                    <div>
                      <p className="text-sm font-medium text-texto-2">No pátio</p>
                      <h2 className="titulo mt-2 text-2xl text-texto sm:text-3xl">
                        {bikeTitle(destaque)}
                      </h2>
                      <p className="mt-2 text-sm text-texto-2">Ano {destaque.ano}</p>
                    </div>
                    <p className="preco text-2xl sm:text-3xl">{formatPrice(destaque.preco)}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex min-h-64 items-end bg-painel p-6 sm:min-h-80 sm:p-8">
                <p className="corpo max-w-md text-texto-2">
                  Não há motos anunciadas no momento. Fale com a equipe para
                  consultar o que está chegando.
                </p>
              </div>
            )}
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

          {demaisMotos.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {demaisMotos.map((bike, i) => (
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

      <SonhosRealizados entregas={entregasRealizadas} />

      <section className="section bg-painel">
        <div className="container-site grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-10">
          <div>
            <h2 className="titulo text-3xl text-texto sm:text-4xl">Vai trocar de moto?</h2>
            <p className="corpo mt-4 max-w-2xl text-texto-2">
              Aceitamos sua moto usada como parte do pagamento. Converse com a
              equipe sobre avaliação e documentação.
            </p>
          </div>
          <Link to="/contato" className="btn btn-primary min-h-12 px-6">
            Falar sobre uma troca
          </Link>
        </div>
      </section>

      <MarcasProcuradas />
    </>
  )
}
