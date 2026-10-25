import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Clock, MapPin } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/usePageMeta'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { Revelar } from '../components/ui/Revelar'
import { Marcas } from '../components/home/MarcasProcuradas'
import { LIMITE_MURAL, SonhosRealizados } from '../components/home/SonhosRealizados'
import { useEntregasPublicadas } from '../hooks/useEntregasPublicadas'
import { buildDefaultMessage } from '../lib/format'
import heroDesktop from '../assets/hero/home-desktop.webp'
import heroMobile from '../assets/hero/home-mobile.webp'
import trocaDesktop from '../assets/troca/banner-desktop.webp'

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

          <div className="container-site relative z-10 flex flex-1 flex-col pt-5 pb-6 sm:pt-8 sm:pb-8 lg:justify-end lg:py-12 xl:py-14">
            <div className="hero-texto max-w-[18rem] sm:max-w-[24rem] lg:max-w-[46rem] xl:max-w-[54rem]">
              {/* A cidade e a loja já estão no título e no cabeçalho:
                  a etiqueta acima só empurrava o texto para baixo. */}
              <h1 className="cartaz display max-w-[17ch] text-balance text-[1.625rem] leading-[1.04] text-texto sm:max-w-none sm:text-4xl md:text-5xl lg:text-[length:clamp(3.4rem,5.9vw,6.9rem)] lg:leading-[0.86]">
                Motos seminovas
                <br className="hidden lg:block" /> em Belo Horizonte.
              </h1>
              <p className="corpo mt-2 max-w-[32ch] text-sm leading-6 text-texto-2 sm:mt-5 sm:max-w-[38ch] sm:text-base sm:leading-[1.55] lg:mt-6 lg:max-w-[36ch] lg:text-[1.25rem] lg:leading-[1.45]">
                Realizando sonhos sobre duas rodas.
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

            {/* No celular a moto sobe para logo depois do botão: um
                cartão próprio, sem véu por cima, para a imagem aparecer
                inteira no primeiro ecrã. No desktop ela é o próprio
                palco da faixa. */}
            <div className="relative mt-5 h-60 w-full overflow-hidden rounded-2xl border border-borda bg-painel-2 sm:mt-6 sm:h-64 lg:hidden">
              <img
                src={heroMobile}
                alt=""
                width={1280}
                height={428}
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover object-right"
              />
            </div>

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
            <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* ============================================================
          TROCA — um card escuro com a conversa e a moto
          ============================================================
          O bloco inteiro vive na mesma chapa: texto à esquerda, foto à
          direita com vinheta e brilho vermelho suave. No celular os
          campos empilham — primeiro a conversa, depois a imagem. */}
      <section
        aria-labelledby="troca-titulo"
        className="bg-fundo py-8 sm:py-10 lg:bg-[#0b0a09] lg:py-20 xl:py-24"
      >
        <div className="container-site">
          <div className="overflow-hidden rounded-2xl border border-borda bg-painel lg:grid lg:grid-cols-12 lg:items-center lg:gap-10 lg:rounded-3xl lg:border-neutral-800 lg:bg-neutral-900/40 lg:p-8 lg:backdrop-blur-md xl:p-12">
            <div className="px-6 py-8 sm:px-9 sm:py-10 lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:px-0 lg:py-4">
              <h2
                id="troca-titulo"
                className="cartaz display titulo-troca max-w-[18ch] text-3xl text-balance text-texto sm:text-4xl lg:max-w-none lg:text-[length:clamp(2.9rem,4.7vw,4.75rem)] lg:leading-[0.86]"
              >
                Sua próxima moto
                <br className="hidden lg:block" /> começa com a sua.
              </h2>
              <p className="corpo mt-4 max-w-[46ch] text-texto-2 lg:mt-6 lg:max-w-[38ch] lg:text-neutral-300">
                Avaliamos sua moto usada com transparência para facilitar a realização do seu próximo negócio.
              </p>
              <div className="mt-7 lg:mt-9">
                <WhatsAppCTA
                  message={buildDefaultMessage()}
                  label="Avaliar minha moto"
                  className="h-12 w-full rounded-xl px-6 text-sm font-bold shadow-lg shadow-marca/25 sm:w-auto lg:h-14 lg:px-8 lg:text-base"
                />
              </div>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden border-t border-borda bg-neutral-950 lg:col-span-7 lg:aspect-[4/3] lg:min-h-[26rem] lg:rounded-2xl lg:border-0 xl:min-h-[30rem]">
              <img
                src={trocaDesktop}
                alt=""
                width={1760}
                height={648}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover object-center lg:object-[68%_50%]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden shadow-[inset_0_0_120px_40px_rgba(10,9,8,0.6)] lg:block"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_68%_50%,rgba(217,31,38,0.18),transparent_60%)] mix-blend-screen lg:block"
              />
            </div>
          </div>
        </div>
      </section>

      <Marcas />

    </>
  )
}
