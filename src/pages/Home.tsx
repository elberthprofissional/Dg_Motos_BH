import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Clock, MapPin } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/usePageMeta'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { Revelar } from '../components/ui/Revelar'
import { Marcas } from '../components/home/MarcasProcuradas'
import { LIMITE_MURAL, SonhosRealizados } from '../components/home/SonhosRealizados'
import { useEntregasPublicadas } from '../hooks/useEntregasPublicadas'
// Em public/ para a URL ser a mesma do preload em index.html.
const heroDesktop = '/hero/home-desktop.webp'
// No celular o hero é uma arte única do dono, com o texto dentro da
// própria imagem — nada de texto HTML por cima.
const heroMobile = '/hero/home-mobile-texto.webp'
import trocaNova from '../assets/troca/troca-nova.webp'
// Desktop: a arte sem texto — o título escrito em HTML ocupa o lado
// esquerdo escuro, com a moto limpa à direita.
import bannerDesktop from '../assets/troca/banner-desktop.webp'

/**
 * Página inicial — a bancada da loja.
 *
 * O preto é o chão e a folha de papel é o que pousa sobre ele: a
 * vitrine de motos é uma folha inteira de papel, a vistoria é o
 * registro em texto e o fechamento volta ao preto, onde a logo
 * (traço branco) funciona.
 *
 * A linha de apoio não promete origem nem garantia: fica no que a loja
 * mostra e sustenta — preço no anúncio e pátio aberto para visita.
 */
export function Home() {
  const { motos } = useCatalogo()
  const { config } = useSiteConfig()
  // Um post a mais que o mural exibe: a sobra é o que revela se vale
  // mostrar o link "Ver todas as entregas".
  const { entregas } = useEntregasPublicadas(LIMITE_MURAL)

  usePageMeta(
    'DG Motos — Motos seminovas em Belo Horizonte',
    'Veja as motocicletas seminovas disponíveis no estoque da DG Motos, em Belo Horizonte, MG.',
  )
  useJsonLd(autoDealerSchema(config))

  const disponiveis = useMemo(
    () => motos.filter((m) => m.status === 'disponivel'),
    [motos],
  )

  // A vitrine é comercial: só as 4 primeiras motos do pátio (as EM
  // PROMOÇÃO vêm primeiro, para o selo e o "de → por" abrirem a
  // fileira). O resto do estoque fica na página completa, que não
  // passa por este corte.
  const patio = useMemo(() => {
    const emPromocao = disponiveis.filter((m) => m.emPromocao)
    const foraDaPromo = disponiveis.filter((m) => !m.emPromocao)
    return [...emPromocao, ...foraDaPromo].slice(0, 4)
  }, [disponiveis])
  return (
    <>
      <section data-hero className="overflow-hidden bg-fundo pt-cabecalho">
        {/* No celular a seção ocupa o primeiro ecrã inteiro. */}
        <div className="relative isolate flex flex-col overflow-hidden bg-fundo lg:h-[min(42rem,calc(100svh-4.25rem))] lg:min-h-[34rem]">
          <picture className="absolute inset-0 hidden lg:block" aria-hidden="true">
            <source srcSet={heroDesktop} type="image/webp" />
            <img
              src={heroDesktop}
              alt=""
              width={1920}
              height={640}
              fetchPriority="high"
              decoding="async"
              className="hero-foto size-full object-cover object-right"
            />
          </picture>

          {/* Véu neutro atrás da coluna de texto. A moto, à direita,
              continua sem tratamento. */}
          <div
            className="hero-veu pointer-events-none absolute inset-0 hidden lg:block"
            aria-hidden="true"
          />

          {/* Celular: hero é só a arte do dono — o texto mora dentro
              da imagem e nada por cima reprime. A arte é larga (texto à
              esquerda, moto à direita), então ela aparece inteira, na
              proporção dela, sem recorte. No desktop, a foto é o palco
              e o texto HTML fica. */}
          <div className="relative w-full lg:hidden">
            <picture className="block w-full">
              <source srcSet={heroMobile} type="image/webp" />
              <img
                src={heroMobile}
                alt="Motos seminovas em Belo Horizonte"
                width={1280}
                height={480}
                fetchPriority="high"
                decoding="async"
                className="h-auto w-full"
              />
            </picture>
          </div>
          <div className="container-site relative z-10 hidden flex-1 flex-col pt-6 pb-0 sm:pt-8 sm:pb-0 lg:flex lg:justify-end lg:py-12 xl:py-14">
            <div className="hero-texto max-w-[18rem] sm:max-w-[24rem] lg:max-w-[46rem] xl:max-w-[54rem]">
              {/* A cidade e a loja já estão no título e no cabeçalho:
                  a etiqueta acima só empurrava o texto para baixo. */}
              <h1 className="cartaz display max-w-[17ch] text-balance text-[1.625rem] leading-[1.04] text-texto sm:max-w-none sm:text-4xl md:text-5xl lg:text-[length:clamp(3.4rem,5.9vw,6.9rem)] lg:leading-[0.86]">
                Motos seminovas
                <br className="hidden lg:block" /> em Belo Horizonte.
              </h1>
              <p className="corpo mt-2 max-w-[32ch] text-sm leading-6 text-texto-2 sm:mt-5 sm:max-w-[38ch] sm:text-base sm:leading-[1.55] lg:mt-6 lg:max-w-[36ch] lg:text-[1.25rem] lg:leading-[1.45]">
                Seminovas com preço na etiqueta e a loja aberta para você ver de perto.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-7 lg:mt-8">
                <Link
                  to="/estoque"
                  className="btn btn-primary min-h-11 px-5 sm:min-h-12 sm:px-6 lg:min-h-14 lg:px-8 lg:text-base"
                >
                  Ver estoque
                  <ArrowRight className="hidden size-4 lg:block" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-4 hidden flex-col gap-2 text-xs font-medium text-neutral-400 lg:flex">
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0 text-neutral-500" aria-hidden="true" />
                  <span>
                    {config.enderecoRua} — {config.enderecoCidadeUf}
                  </span>
                </p>
                {config.horarios.length > 0 ? (
                  <p className="flex items-center gap-2">
                    <Clock className="size-3.5 shrink-0 text-neutral-500" aria-hidden="true" />
                    <span>
                      {config.horarios
                        .map((horario) => `${horario.dias}, ${horario.horas}`)
                        .join(' · ')}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>

            {/* No desktop a moto é o próprio palco da faixa. */}
          </div>
        </div>
      </section>

      {/* ============================================================
          2. PATIO — as fichas no pátio
          ============================================================ */}
      <section id="acervo" className="bg-fundo pt-9 pb-14 sm:pt-14 sm:pb-20">
        <div className="container-site">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="titulo text-texto">Motos disponíveis</h2>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <Link to="/estoque" className="btn btn-secondary h-11 gap-2 px-5 text-sm">
                Ver todo o estoque
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {patio.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
              {patio.map((bike, i) => (
                <Revelar key={bike.id} atraso={i * 45}>
                  <BikeCard bike={bike} priority={i < 2} />
                </Revelar>
              ))}
            </div>
          ) : (
            <div className="mt-12">
              <p className="titulo text-2xl text-texto">Motos no caminho</p>
              <p className="corpo mt-3 text-texto-2">
                O pátio está sem motos disponíveis agora. Fale com a loja para
                saber o que está chegando.
              </p>
              <Link to="/contato" className="btn btn-primary mt-6 h-11 px-5">
                Falar com a loja
              </Link>
            </div>
          )}
        </div>
      </section>

      <SonhosRealizados entregas={entregas} />

      {/* ============================================================
          TROCA — a arte do dono vale a seção inteira
          ============================================================
          Celular segue o esquema do hero: o texto mora dentro da
          imagem ("Sua moto vale aqui / usamos na troca") e nada por
          cima reprime. No desktop a arte é a versão limpa (sem texto):
          o título é escrito aqui em código, sobre o lado escuro à
          esquerda, e a moto fica intacta à direita. */}
      {/* Sem respiro embaixo no desktop: o banner encosta na faixa de
          marcas — espaço entre os dois abria uma tarja preta à toa. */}
      <section aria-label="Troca de motos — avaliação da sua moto usada" className="bg-fundo pt-4 pb-0 sm:pt-6 lg:pt-8">
        <div className="relative w-full lg:overflow-hidden lg:rounded-2xl lg:border lg:border-borda">
          {/* Celular: arte única do dono, texto embutido. O alt descreve
              o texto embutido — é o que leitores de tela e o Google leem. */}
          <picture className="block w-full lg:hidden">
            <source srcSet={trocaNova} type="image/webp" />
            <img
              src={trocaNova}
              alt="Sua moto vale aqui, usamos na troca: avaliação justa e transparente"
              width={1280}
              height={554}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </picture>

          {/* Desktop: banner sem texto, com altura contida — na proporção
              nativa ele virava um paralelepípedo na tela larga. O crop
              vertical passa pela base, a moto continua inteira. */}
          <div className="relative hidden lg:block">
            <picture aria-hidden="true" className="block w-full">
              <source srcSet={bannerDesktop} type="image/webp" />
              <img
                src={bannerDesktop}
                alt=""
                width={1760}
                height={648}
                loading="lazy"
                decoding="async"
                className="h-auto w-full lg:h-[clamp(19rem,26vw,27rem)] lg:object-cover"
              />
            </picture>

            <div className="absolute inset-0 z-10 flex items-center">
              <div className="container-site">
                <div className="max-w-[40rem]">
                  <p className="cartaz titulo-troca text-texto">Sua moto vale aqui</p>
                  <p className="cartaz titulo-troca text-marca-viva">Usamos na troca</p>
                  <p className="corpo mt-4 text-texto-2 lg:text-lg">Avaliação justa e transparente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marcas />

    </>
  )
}
