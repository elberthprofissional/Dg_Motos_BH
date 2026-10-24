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
import { MarcasNoPatio } from '../components/home/MarcasProcuradas'
import { entregasRealizadas } from '../data/entregas'
import { SonhosRealizados } from '../components/home/SonhosRealizados'
import { bikeTitle, formatPrice, precoRequerConfirmacao } from '../lib/format'

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
  const fotoDestaque = destaque?.imagens.find((imagem) => /vista lateral/i.test(imagem.alt)) ?? destaque?.imagens[0]
  const marcasNoPatio = useMemo(
    () => [...new Set(disponiveis.map((moto) => moto.marca.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    ),
    [disponiveis],
  )

  return (
    <>
      <section data-hero className="overflow-hidden bg-fundo pt-cabecalho">
        <div className="container-site grid gap-9 py-8 sm:gap-12 sm:py-12 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-14 lg:py-14">
          <div className="relative z-10 max-w-xl lg:py-8">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold tracking-[0.12em] text-texto-2 uppercase">
              <span className="h-px w-8 bg-marca" aria-hidden="true" />
              Seminovas · Belo Horizonte
            </p>
            <h1 className="display text-4xl text-texto sm:text-5xl lg:text-[4.5rem]">
              Motos para seguir em frente.
            </h1>
            <p className="corpo mt-5 max-w-[38ch] text-texto-2">
              Veja o estoque real da DG Motos, compare cada unidade e encontre a próxima moto no seu ritmo.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link to="/estoque" className="btn btn-primary min-h-12 px-6">
                Ver motos no estoque
              </Link>
              <span className="text-sm text-texto-3">
                {disponiveis.length} {disponiveis.length === 1 ? 'moto disponível' : 'motos disponíveis'}
              </span>
            </div>
          </div>

          {destaque ? (
            <article className="group min-w-0 lg:-mr-[max(0px,calc((100vw-1760px)/2))]">
              <Link
                to={`/moto/${destaque.slug}`}
                aria-label={`Ver ${bikeTitle(destaque)}, ${destaque.ano}, por ${formatPrice(destaque.preco)}`}
                className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foco"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-painel-2 sm:aspect-[16/10] lg:aspect-[4/3]">
                  {fotoDestaque ? (
                    <img
                      src={fotoDestaque.src}
                      alt={fotoDestaque.alt || bikeTitle(destaque)}
                      width={1280}
                      height={960}
                      fetchPriority="high"
                      decoding="async"
                      className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.015]"
                    />
                  ) : (
                    <p className="grid size-full place-items-center px-6 text-sm text-texto-2">
                      Foto ainda não disponível
                    </p>
                  )}
                </div>
                <div className="grid gap-3 border-b border-borda-forte py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:py-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-texto sm:text-2xl">
                      {bikeTitle(destaque)}
                    </h2>
                    <span className="numeros text-sm text-texto-3">{destaque.ano}</span>
                  </div>
                  <div className="sm:text-right">
                    <p className="preco text-xl sm:text-2xl">{formatPrice(destaque.preco)}</p>
                    {precoRequerConfirmacao(destaque.preco) ? (
                      <p className="mt-1 text-xs text-texto-2">Valor cadastrado; confirme com a loja.</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </article>
          ) : (
            <div className="flex min-h-64 items-end bg-painel p-6 sm:min-h-80 sm:p-8">
              <p className="corpo max-w-md text-texto-2">
                Não há motos anunciadas no momento. Fale com a equipe para consultar as próximas entradas.
              </p>
            </div>
          )}
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

      <MarcasNoPatio
        marcas={marcasNoPatio}
      />

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

    </>
  )
}
