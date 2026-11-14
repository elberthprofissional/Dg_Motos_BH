import { ArrowUpRight, Clock, MapPin } from 'lucide-react'
import { InstagramIcon } from '../components/ui/InstagramIcon'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../lib/format'
import { buildMapsRouteUrl } from '../lib/maps'
import { MapaLoja } from '../components/ui/MapaLoja'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { Revelar } from '../components/ui/Revelar'
import { IconeWhatsapp } from '../components/ui/IconeWhatsapp'

/**
 * Contato — o balcão da loja.
 *
 * Uma coluna de canais com régua entre eles e o mapa ao lado. O
 * WhatsApp é a primeira ação porque é por onde a loja negocia; o
 * resto é endereço e horário, sem cartão em volta de cada assunto.
 */
const ROTULO = 'text-xs font-medium text-texto-3'

export function Contato() {
  usePageMeta(
    'Contato | DG Motos — Belo Horizonte, MG',
    'Contato da DG Motos: WhatsApp, Instagram, endereço e horários da loja no Tupi, em Belo Horizonte.',
  )

  const { config } = useSiteConfig()

  return (
    <div className="pt-cabecalho">
      <section className="border-b border-borda">
        <div className="container-site py-10 sm:py-14">
          <Revelar>
            <h1 className="titulo text-texto">Contato</h1>
          </Revelar>
        </div>
      </section>

      <section>
        <div className="container-site grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <Revelar>
              <div className="border-t border-borda-forte pt-5">
                <p className={`${ROTULO} flex items-center gap-2`}>
                  <IconeWhatsapp className="size-3.5" aria-hidden="true" />
                  WhatsApp
                </p>
                <p className="mt-3 max-w-[40ch] text-texto">
                  Entre em contato com a gente.
                </p>
                {config.whatsapp ? (
                  <WhatsAppCTA
                    message={buildDefaultMessage()}
                    label="Abrir conversa no WhatsApp"
                    glifoWhatsapp
                    className="mt-5 h-12 w-full px-7 sm:w-auto"
                  />
                ) : (
                  <p className="mt-4 text-sm text-texto-3">
                    O número está sendo configurado pela loja.
                  </p>
                )}
              </div>
            </Revelar>

            {config.instagramUrl ? (
              <Revelar atraso={80}>
                <div className="mt-8 border-t border-borda pt-5">
                  <p className={`${ROTULO} flex items-center gap-2`}>
                    <InstagramIcon className="size-3.5" aria-hidden="true" />
                    Instagram
                  </p>
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-texto transition-colors hover:text-marca-texto"
                  >
                    <span className="font-medium">{config.instagramHandle}</span>
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </Revelar>
            ) : null}

            <Revelar atraso={140}>
              <div className="mt-8 border-t border-borda pt-5">
                <p className={`${ROTULO} flex items-center gap-2`}>
                  <MapPin className="size-3.5" aria-hidden="true" />
                  Endereço
                </p>
                <address className="mt-3 not-italic">
                  <p className="font-display text-xl font-bold tracking-[-0.01em] text-texto">
                    {config.enderecoRua}
                  </p>
                  <p className="mt-1 text-texto-2">{config.enderecoCidadeUf}</p>
                </address>
                <a
                  href={buildMapsRouteUrl(config)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-acao mt-3"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  <span>Abrir rota no mapa</span>
                </a>
              </div>
            </Revelar>

            {config.horarios.length > 0 ? (
              <Revelar atraso={200}>
                <div className="mt-8 border-t border-borda pt-5">
                  <p className={`${ROTULO} flex items-center gap-2`}>
                    <Clock className="size-3.5" aria-hidden="true" />
                    Horários
                  </p>
                  <dl className="mt-3 max-w-sm space-y-2">
                    {config.horarios.map((h) => (
                      <div key={h.dias} className="flex justify-between gap-4">
                        <dt className="text-sm text-texto-2">{h.dias}</dt>
                        <dd className="numeros text-sm font-medium text-texto">{h.horas}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Revelar>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col">
            <Revelar atraso={120}>
              <div className="border border-borda bg-painel">
                <MapaLoja
                  rotulo={`${config.enderecoRua}, ${config.enderecoCidadeUf}`}
                  className="h-80 w-full sm:h-[28rem] lg:h-full lg:min-h-[30rem]"
                />
              </div>
            </Revelar>
            <p className="mt-3 text-sm text-texto-3">
              {config.enderecoRua} · {config.enderecoCidadeUf}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
