import { ArrowUpRight, Clock, MapPin } from 'lucide-react'
import { InstagramIcon } from '../components/ui/InstagramIcon'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../lib/format'
import { buildMapsRouteUrl } from '../lib/maps'
import { MapaLoja } from '../components/ui/MapaLoja'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'

/**
 * Contato — a folha de contatos.
 *
 * Os dados à esquerda e o mapa à direita, sobre a folha de papel.
 * Sem caixinha com sombra e sem ícone em quadrado: o que organiza a
 * leitura é o espaço entre os blocos, e o que dá o peso é o
 * tamanho do texto.
 */
export function Contato() {
  usePageMeta(
    'Contato | DG Motos — Belo Horizonte, MG',
    'Fale com a DG Motos: WhatsApp, Instagram e localização da loja em Belo Horizonte, MG.',
  )

  const { config } = useSiteConfig()

  return (
    <div className="pt-cabecalho">
      <section className="bg-fundo">
        <div className="container-site pt-10 pb-6 sm:pt-12 sm:pb-8">
          <h1 className="display">Contato</h1>
        </div>
      </section>

      {/* Contato e localização */}
      <section className="section bg-painel">
        <div className="container-site grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* Canais */}
          <div>
            <h2 className="titulo text-2xl text-texto sm:text-3xl">Fale com a loja</h2>

            <div className="mt-8 space-y-8">
              <div className="border border-borda bg-painel-2 p-5 sm:p-6">
                <p className="text-sm uppercase tracking-[0.16em] text-texto-3">
                  WhatsApp
                </p>
                <p className="corpo mt-3 text-texto-2">
                  Tire dúvidas, peça vídeos ou fale sobre troca direto com a
                  equipe.
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
              </div>

              {config.instagramUrl ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-texto-3">
                    Instagram
                  </p>
                  <p className="corpo mt-3 text-texto-2">
                    Acompanhe as motos que chegam ao pátio.
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
                </div>
              ) : null}

              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-texto-3">
                  Showroom
                </p>
                <address className="mt-3 not-italic">
                  <p className="font-display text-2xl font-semibold text-texto">
                    {config.enderecoRua}
                  </p>
                  <p className="corpo mt-1 text-texto-2">
                    {config.enderecoCidadeUf}
                  </p>
                </address>

                {config.horarios.length > 0 ? (
                  <div className="mt-5 border-t border-borda pt-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-texto-2">
                      <Clock className="size-4 text-texto-3" aria-hidden="true" />
                      Horário de funcionamento
                    </p>
                    <dl className="mt-3 space-y-1.5">
                      {config.horarios.map((h) => (
                        <div key={h.dias} className="flex justify-between gap-4">
                          <dt className="text-sm text-texto-3">{h.dias}</dt>
                          <dd className="text-sm font-medium text-texto-2 numeros">
                            {h.horas}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                <a
                  href={buildMapsRouteUrl(config)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-acao mt-5"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  <span>Traçar rota no Google Maps</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Showroom */}
          <div className="flex min-w-0 flex-col">
            <div className="overflow-hidden border border-borda bg-painel">
              <MapaLoja
                rotulo={`${config.enderecoRua}, ${config.enderecoCidadeUf}`}
                className="h-[28rem] w-full sm:h-[36rem] lg:h-full lg:min-h-[42rem]"
              />
            </div>

            <a
              href={buildMapsRouteUrl(config)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary mt-4 h-11 w-full justify-center sm:w-auto"
            >
              <MapPin className="size-4" aria-hidden="true" />
              <span>Traçar rota no Google Maps</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
