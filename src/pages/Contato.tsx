import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock, MapPin } from 'lucide-react'
import { InstagramIcon } from '../components/ui/InstagramIcon'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { useCatalogo } from '../hooks/useCatalogo'
import {
  bikeTitle,
  buildDefaultMessage,
  formatKm,
  formatPrice,
  precoRequerConfirmacao,
} from '../lib/format'
import { buildMapsRouteUrl } from '../lib/maps'
import { MapaLoja } from '../components/ui/MapaLoja'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { Revelar } from '../components/ui/Revelar'

/**
 * Contato — a folha de contatos.
 *
 * Três blocos à esquerda (os canais e a ficha da casa) e o mapa à
 * direita, sobre a bancada. O que organiza a leitura é o espaço
 * entre os blocos; o que dá o peso é o tamanho do texto. Uma única
 * superfície preenchida na página — a ficha do endereço — porque é
 * o dado que o cliente quer guardar.
 *
 * A foto da garagem com a porta aberta atravessa a página de ponta
 * a ponta entre o título e o conteúdo: é o convite da página, e
 * ocupa o lugar onde antes ficava o vazio.
 */
export function Contato() {
  usePageMeta(
    'Contato | DG Motos — Belo Horizonte, MG',
    'Fale com a DG Motos: WhatsApp, Instagram e localização da loja em Belo Horizonte, MG.',
  )

  const { config } = useSiteConfig()
  const { motos } = useCatalogo()

  // As quatro primeiras disponíveis. É a resposta visual do
  // "Gostou de alguma moto?" do bloco de WhatsApp: o cliente lê a
  // frase e logo abaixo encontra as motos de verdade.
  const patio = useMemo(
    () => motos.filter((m) => m.status === 'disponivel').slice(0, 4),
    [motos],
  )

  return (
    <div className="pt-cabecalho">
      {/* Título e a porta aberta */}
      <section className="bg-fundo">
        <div className="container-site pt-10 pb-7 sm:pt-14 sm:pb-9">
          <Revelar>
            <h1 className="display">Contato</h1>
            <p className="lead mt-4 text-texto sm:mt-5">
              WhatsApp, Instagram e a loja em Belo Horizonte — escolha por onde
              falar com a gente.
            </p>
          </Revelar>
        </div>

        {/* A casa com a porta aberta: sangra de ponta a ponta, sem
            moldura. No celular vira uma faixa; no desktop, a faixa
            que separa o título do conteúdo. A foto respira devagar
            (classe foto-respira), para quem não pediu redução de
            movimento fica parada. */}
        <Revelar className="overflow-hidden" atraso={80}>
          <img
            src="/hero/entrada-painel.webp"
            alt="Entrada da garagem da DG Motos com a porta aberta à noite"
            className="foto-respira h-48 w-full object-cover object-center sm:h-56"
          />
        </Revelar>
      </section>

      {/* Contato e localização. O topo curto mantém o botão do
          WhatsApp à vista já na primeira dobra do notebook. */}
      <section className="section bg-painel pt-10 sm:pt-14">
        <div className="container-site grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* Canais */}
          <div>
            <Revelar>
              <h2 className="titulo text-2xl text-texto sm:text-3xl">
                Vamos conversar
              </h2>
            </Revelar>

            <div className="mt-8 space-y-10 sm:mt-10 sm:space-y-12">
              <Revelar atraso={60}>
                <h3 className="font-display text-lg font-semibold text-texto sm:text-xl">
                  WhatsApp
                </h3>
                <p className="corpo mt-3 text-texto">
                  Gostou de alguma moto? Chama a gente. Podemos conversar sobre
                  valores, vídeos e sua moto na troca.
                </p>
                {config.whatsapp ? (
                  <WhatsAppCTA
                    message={buildDefaultMessage()}
                    label="Conversar no WhatsApp"
                    glifoWhatsapp
                    className="mt-5 h-12 w-full px-6 sm:w-auto"
                  />
                ) : (
                  <p className="mt-4 text-sm text-texto-3">
                    Número sendo configurado pela loja.
                  </p>
                )}
              </Revelar>

              {config.instagramUrl ? (
                <Revelar atraso={120}>
                  <h3 className="font-display text-lg font-semibold text-texto sm:text-xl">
                    Instagram
                  </h3>
                  <p className="corpo mt-3 text-texto">
                    Veja as novidades e acompanhe nosso estoque pelo Instagram.
                  </p>
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-acao mt-4"
                  >
                    <InstagramIcon className="size-4" aria-hidden="true" />
                    <span>{config.instagramHandle}</span>
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </Revelar>
              ) : null}

              <Revelar atraso={180}>
                <h3 className="font-display text-lg font-semibold text-texto sm:text-xl">
                  Onde estamos
                </h3>
                {/* A ficha da casa: a única superfície preenchida da
                    página. Endereço e horário são o dado que se lê de
                    uma vez, então moram juntos, sem borda e sem
                    filete — o degrau de tom já separa. */}
                <div className="mt-4 bg-painel-2 p-5 sm:p-6">
                  <address className="not-italic">
                    <p className="font-display text-2xl font-semibold text-texto sm:text-3xl">
                      {config.enderecoRua}
                    </p>
                    <p className="corpo mt-1 text-texto-2">
                      {config.enderecoCidadeUf}
                    </p>
                  </address>

                  {config.horarios.length > 0 ? (
                    <Revelar className="mt-6" atraso={240}>
                      <p className="flex items-center gap-2 text-sm font-medium text-texto-2">
                        <Clock
                          className="size-4 text-texto-3"
                          aria-hidden="true"
                        />
                        Horário de funcionamento
                      </p>
                      <dl className="mt-3 space-y-2.5">
                        {config.horarios.map((h) => (
                          <div
                            key={h.dias}
                            className="flex justify-between gap-4"
                          >
                            <dt className="text-base text-texto-2">
                              {h.dias}
                            </dt>
                            <dd className="text-base font-medium text-texto numeros">
                              {h.horas}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </Revelar>
                  ) : null}
                </div>
              </Revelar>
            </div>
          </div>

          {/* Mapa */}
          <div className="flex min-w-0 flex-col">
            <Revelar atraso={120}>
              <div className="overflow-hidden bg-painel-2">
                <MapaLoja
                  rotulo={`${config.enderecoRua}, ${config.enderecoCidadeUf}`}
                  className="h-[28rem] w-full sm:h-[36rem] lg:h-full lg:min-h-[42rem]"
                />
              </div>
            </Revelar>

            <Revelar atraso={200}>
              <a
                href={buildMapsRouteUrl(config)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary mt-4 h-11 w-full justify-center sm:w-auto"
              >
                <MapPin className="size-4" aria-hidden="true" />
                <span>Como chegar à DG Motos</span>
              </a>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ============================================================
          PÁTIO — o que já está aqui, para responder ao "gostou de
          alguma moto?" do bloco de cima. Fundo volta à bancada
          antes do rodapé; a grade de quatro é a mesma da home.
          ============================================================ */}
      <section className="bg-fundo pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="container-site">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <Revelar>
              <div>
                <h2 className="titulo text-2xl text-texto sm:text-3xl">
                  Motos no pátio
                </h2>
                <p className="corpo mt-3 text-texto-2">
                  Vem ver de perto ou chama no WhatsApp: a gente manda vídeo.
                </p>
              </div>
            </Revelar>

            <Revelar atraso={100}>
              <Link
                to="/estoque"
                className="btn btn-secondary h-11 shrink-0 justify-center gap-1.5 px-4 sm:justify-start sm:px-5"
              >
                <span>Ver estoque completo</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </Revelar>
          </div>

          {patio.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
              {patio.map((bike, i) => {
                const titulo = bikeTitle(bike)
                const lateral = bike.imagens.find((imagem) =>
                  /vista lateral/i.test(imagem.alt),
                )
                const capa = lateral ?? bike.imagens[0]
                return (
                  <Revelar key={bike.id} atraso={i * 60}>
                    <Link
                      to={`/moto/${bike.slug}`}
                      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca"
                    >
                      {/* Sem moldura e sem arredondado: aqui é foto de
                          vitrine sobre a bancada, não a ficha de
                          catálogo (que mora na home e no estoque). */}
                      <div className="aspect-[16/10] overflow-hidden bg-painel-2">
                        {capa ? (
                          <img
                            src={capa.src}
                            alt={capa.alt || titulo}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                          />
                        ) : null}
                      </div>

                      <h3 className="mt-3 font-display text-base leading-tight font-bold text-texto">
                        {titulo}
                      </h3>
                      <p className="numeros mt-1 text-sm text-texto-2">
                        {[
                          bike.ano,
                          bike.quilometragem != null
                            ? formatKm(bike.quilometragem)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {precoRequerConfirmacao(bike.preco) ? (
                        <p className="mt-1.5 text-sm text-texto-2">
                          Confirme o preço com a loja
                        </p>
                      ) : (
                        <p className="numeros mt-1.5 font-display text-lg leading-none font-black tracking-[-0.01em] text-marca-viva">
                          {formatPrice(bike.preco)}
                        </p>
                      )}
                    </Link>
                  </Revelar>
                )
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
