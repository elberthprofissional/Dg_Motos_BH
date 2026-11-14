import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/usePageMeta'
import { useJsonLd } from '../hooks/useJsonLd'
import { useWhatsappLink } from '../hooks/useWhatsappLink'
import { autoDealerSchema } from '../lib/schema'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { Revelar } from '../components/ui/Revelar'
import { LIMITE_MURAL, SonhosRealizados } from '../components/home/SonhosRealizados'
import { useEntregasPublicadas } from '../hooks/useEntregasPublicadas'
import { IconeWhatsapp } from '../components/ui/IconeWhatsapp'
import { buildDefaultMessage } from '../lib/format'
import { buildMapsRouteUrl } from '../lib/maps'

/** Em public/ para a URL ser a mesma do preload em index.html. */
const heroFoto = '/hero/moto-hero-inteira.webp'

/**
 * Página inicial — o pátio de dia.
 *
 * Hero editorial: cartaz condensado à esquerda, a moto assentada no
 * chão à direita (no celular ela vem abaixo do texto, grande), e a
 * faixa de dados fechando a seção por baixo — o chão onde a moto
 * pisa e a transição para as ofertas.
 */
export function Home() {
  const { motos } = useCatalogo()
  const { config } = useSiteConfig()
  const { entregas } = useEntregasPublicadas(LIMITE_MURAL)

  usePageMeta(
    'DG Motos BH — Motos revisadas e com garantia',
    'Seminovas revisadas e com garantia em Belo Horizonte. Estoque com fotos e preços, inspeção mecânica e cautelar, e negociação direta com a loja.',
  )
  useJsonLd(autoDealerSchema(config))

  const disponiveis = useMemo(() => motos.filter((m) => m.status === 'disponivel'), [motos])

  const patio = useMemo(() => {
    const emPromocao = disponiveis.filter((m) => m.emPromocao)
    const foraDaPromo = disponiveis.filter((m) => !m.emPromocao)
    return [...emPromocao, ...foraDaPromo].slice(0, 4)
  }, [disponiveis])

  // O hook não pode ser chamado dentro do JSX condicional: a conversa
  // geral da loja é resolvida aqui, uma vez por render.
  const waLoja = useWhatsappLink(buildDefaultMessage())

  // Rota do Google Maps montada a partir do endereço da loja.
  const mapaUrl = buildMapsRouteUrl(config)

  const horario = config.horarios[0]
    ? `${config.horarios[0].dias}: ${config.horarios[0].horas}`
    : null

  return (
    <>
      {/* ============================================================
          ABERTURA — cartaz à esquerda, moto no chão à direita
          ============================================================ */}
      <section className="relative flex flex-col overflow-hidden pt-cabecalho">
        {/* Luz de marca + grafismo de velocidade: degradê sutil e
            diagonais finas — no desktop a luz nasce onde a moto está;
            no celular os grafismos seguram a composição sozinhos. */}
        <div
          aria-hidden="true"
          className="hero-luz pointer-events-none absolute inset-0 z-0"
        />
        <div
          aria-hidden="true"
          className="hero-grafismo pointer-events-none absolute inset-0 z-0 lg:hidden"
        />

        {/* Banca do hero: o texto respira em cima; a moto assenta no
            chão — e a faixa de dados fecha a seção por baixo dela,
            virando a transição para as ofertas. */}
        {/* Mesmo container do cabeçalho e do rodapé: um cap menor aqui
            desalinhava o título do logo e afastava a moto da margem
            direita em telas largas. */}
        <div className="container-site relative z-10">
          <div className="relative flex flex-col justify-center py-8 sm:py-10 lg:min-h-[min(44rem,calc(100svh-12rem))] lg:py-14">
            <div className="hero-texto max-w-[36rem] xl:max-w-[38rem]">              <span aria-hidden="true" className="hero-traco mb-6 block" />
              <h1 className="cartaz text-[length:clamp(2.35rem,11.5vw,3.2rem)] break-words text-texto lg:text-[length:clamp(2.6rem,6.5vw,4.8rem)]">
                <span className="block">
                  Motos <span className="hero-contorno">seminovas</span>
                </span>
                <span className="block">em Belo Horizonte</span>
              </h1>

              <p className="hero-lead mt-6">
                Sua próxima moto pode estar aqui. Confira nosso estoque e
                venha conhecer de perto.
              </p>

              {/* A moto é protagonista no desktop: recorte assentado no
                  chão, sangrando na margem. Agora ela avança para fora do
                  quadro — o overflow da seção come o final do recorte e a
                  moto entra cortada pela direita, como num catálogo. No
                  celular o hero é tipográfico: nada de foto nem de espaço
                  reservado para ela. */}
              <img
                src={heroFoto}
                alt="Motocicleta em exposição na DG Motos"
                width={1096}
                height={856}
                fetchPriority="high"
                decoding="async"
                className="hero-foto hero-glow pointer-events-none hidden object-contain lg:absolute lg:bottom-[calc(14px-1.94vw)] lg:right-[-16vw] lg:z-0 lg:block lg:w-[min(53vw,54rem)] xl:bottom-[calc(14px-1.88vw)] xl:right-[-24vw] xl:w-[min(51.5vw,54rem)]"
              />

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/estoque"
                  className="btn btn-primary h-12 w-full justify-center bg-marca px-6 text-white hover:bg-marca-forte sm:w-auto"
                >
                  Ver o estoque
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                {waLoja ? (
                  <a
                    href={waLoja}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary h-12 w-full justify-center px-6 sm:w-auto"
                  >
                    <IconeWhatsapp className="size-4" aria-hidden="true" />
                    Falar no WhatsApp
                  </a>
                ) : (
                  <Link
                    to="/contato"
                    className="btn btn-secondary h-12 w-full justify-center px-6 sm:w-auto"
                  >
                    <IconeWhatsapp className="size-4" aria-hidden="true" />
                    Falar com a loja
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Faixa de chão: os dados da loja em células separadas por
            régua fina — o hero termina em pé, não abrupto. No celular
            ela não entra: o hero é curto e o rodapé carrega o resto. */}
        <div className="relative z-10 hidden border-t border-borda bg-fundo lg:block">
          <div className="container-site">
            <dl className="grid grid-cols-2 divide-x divide-borda lg:grid-cols-3">
              <div className="flex min-w-0 flex-col justify-center py-5 pr-6 lg:pr-10">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-texto-3">
                  Endereço
                </dt>
                <dd className="mt-1.5 text-sm font-medium leading-snug text-texto">
                  {config.enderecoRua}
                  <br />
                  {config.enderecoCidadeUf}
                </dd>
              </div>
              {horario ? (
                <div className="flex flex-col justify-center py-5 pl-6 lg:pl-10">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-texto-3">
                    Horário
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium text-texto">{horario}</dd>
                </div>
              ) : null}
              {/* Terceira célula: a faixa termina em ação, não em vazio.
                  A rota é montada com o endereço que o dono cadastra. */}
              <div className="col-span-2 flex flex-col justify-center py-5 pl-6 lg:col-span-1 lg:pl-10">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-texto-3">
                  Como chegar
                </dt>
                <dd className="mt-1.5">
                  <a
                    href={mapaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-texto transition-colors hover:text-marca-texto"
                  >
                    Abrir no Google Maps
                    <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ============================================================
          PÁTIO — ofertas em destaque (catálogo)
          ============================================================ */}
      <section id="acervo" className="scroll-mt-32 border-t border-borda">
        <div className="container-site py-12 sm:py-16">
          {disponiveis.length > 0 ? (
            <div className="flex flex-col items-center text-center">
              <h2 className="titulo-ofertas text-texto">OFERTAS EM DESTAQUE</h2>
              <p className="mt-3 max-w-[36ch] text-[15px] leading-relaxed text-texto-2 sm:text-base">
                Motos revisadas com garantia!
              </p>
              <span
                aria-hidden="true"
                className="mt-5 block h-0.5 w-14 bg-marca"
              />
            </div>
          ) : (
            <div className="secao-titulo">
              <h2 className="titulo text-texto">O pátio está vazio</h2>
            </div>
          )}

          {disponiveis.length === 0 ? (
            <div className="mt-10 max-w-xl">
              <p className="corpo text-texto-2">
                Nenhuma moto anunciada neste momento. Chame a loja para saber
                o que está chegando.
              </p>
              <Link to="/contato" className="btn btn-primary mt-6 h-11 px-5">
                Falar com a loja
              </Link>
            </div>
          ) : (
            <>
              {/* Celular: catálogo em dois cards por linha — o mesmo card
                  compacto do estoque, sem uma foto gigante abrindo a
                  lista nem cartões de alturas diferentes. */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:hidden">
                {patio.map((bike, i) => (
                  <Revelar key={bike.id} atraso={i * 45}>
                    <BikeCard bike={bike} priority={i < 2} />
                  </Revelar>
                ))}

                {/* Quem não achou a sua vai direto pro estoque. */}
                <Link
                  to="/estoque"
                  className="col-span-2 mt-2 flex items-center justify-center gap-1.5 border-t border-borda pt-6 text-sm font-semibold text-texto-2 transition-colors hover:text-marca-texto"
                >
                  Ver o estoque completo
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              {/* Tablet e desktop: catálogo em grade — três colunas na
                  mesa, duas no tablet, a mesma lógica e os mesmos dados.
                  Anúncios da variante `vitrine`: sem caixa, a foto é o
                  anúncio e o preço vermelho é o único sinal de cor. */}
              <div className="patio-grade mt-12 hidden gap-x-8 gap-y-14 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {patio.slice(0, 3).map((bike, i) => (
                  <Revelar key={bike.id} atraso={i * 60}>
                    <BikeCard bike={bike} variante="vitrine" />
                  </Revelar>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <SonhosRealizados entregas={entregas} />
    </>
  )
}
