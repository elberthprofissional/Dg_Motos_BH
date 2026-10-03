import { Clock, MapPin, MessageCircle } from 'lucide-react'
import { InstagramIcon } from '../components/ui/InstagramIcon'
import { usePageMeta } from '../hooks/useNavigation'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { buildDefaultMessage, useWhatsappLink } from '../lib/format'
import { buildMapsRouteUrl } from '../lib/maps'
import { MapaLoja } from '../components/ui/MapaLoja'
import { SectionHeading } from '../components/ui/SectionHeading'

export function Contato() {
  usePageMeta(
    'Contato | DG Motos — Belo Horizonte, MG',
    'Fale com a DG Motos: WhatsApp, Instagram e localização da loja em Belo Horizonte, MG.',
  )

  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())

  const canais = [
    {
      icon: MessageCircle,
      titulo: 'WhatsApp',
      descricao: 'Atendimento direto com a equipe da loja.',
      acao: wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
        >
          Abrir conversa
        </a>
      ) : (
        <span className="text-sm text-steel-500">
          Chame pelo Instagram enquanto isso.
        </span>
      ),
    },
    {
      icon: InstagramIcon,
      titulo: 'Instagram',
      descricao: `Novidades e motos chegando: ${config.instagramHandle}.`,
      acao: (
        <a
          href={config.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
        >
          Seguir e mandar mensagem
        </a>
      ),
    },
    {
      icon: MapPin,
      titulo: 'Loja',
      descricao: `${config.enderecoRua} — ${config.enderecoCidadeUf}.`,
      acao: (
        <a
          href={config.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
        >
          Ver rota no Google Maps
        </a>
      ),
    },
  ]

  return (
    <div className="pt-16">
      <section className="border-b border-white/10 bg-night-900">
        <div className="container-site py-12 sm:py-16">
          <p className="eyebrow">Contato</p>
          <h1 className="h-display mt-3 text-4xl sm:text-5xl">Fale com a DG Motos</h1>
          <p className="mt-4 max-w-xl text-steel-400">
            Respondemos rápido no WhatsApp e no Instagram. Para ver as motos de
            perto, é só aparecer na loja.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-site grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div className="reveal space-y-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
            {canais.map(({ icon: Icon, titulo, descricao, acao }) => (
              <div key={titulo} className="flex items-start gap-4 bg-night-950 p-6">
                <Icon className="mt-0.5 size-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-lg font-semibold uppercase">{titulo}</h2>
                  <p className="mt-1 text-sm text-steel-400">{descricao}</p>
                  <div className="mt-2">{acao}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="surface rounded-lg p-6 sm:p-8">
            <SectionHeading eyebrow="Localização" title="Onde estamos" />
            <p className="mt-4 flex items-start gap-2 text-steel-300">
              <MapPin className="mt-1 size-4 shrink-0 text-brand-500" aria-hidden="true" />
              <span>
                {config.enderecoRua}
                <br />
                {config.enderecoCidadeUf}
              </span>
            </p>

            {config.horarios.length > 0 ? (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 font-display text-xs font-semibold tracking-[0.22em] text-steel-400 uppercase">
                  <Clock className="size-4" aria-hidden="true" /> Horários
                </h3>
                <ul className="mt-3 space-y-1.5 text-sm text-steel-300">
                  {config.horarios.map((h) => (
                    <li key={h.dias} className="flex justify-between gap-4">
                      <span>{h.dias}</span>
                      <span className="text-paper">{h.horas}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-6 text-xs leading-relaxed text-steel-500">
                Horários: confirme pelo WhatsApp ou Instagram antes de vir.
              </p>
            )}

            {config.telefoneExibicao ? (
              <p className="mt-6 text-sm text-steel-300">
                Telefone: <span className="text-paper">{config.telefoneExibicao}</span>
              </p>
            ) : null}

            {/* Mapa do Google (não usa cookie de rastreio) */}
            <div className="mt-6 overflow-hidden rounded-md border border-line">
              <MapaLoja
                rotulo={`${config.enderecoRua}, ${config.enderecoCidadeUf}`}
                className="h-64 sm:h-72"
              />
            </div>

            <a
              href={buildMapsRouteUrl(config.mapsUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded border border-line-forte px-5 py-2.5 font-display text-sm font-semibold tracking-[0.08em] uppercase transition-colors hover:border-white/40 hover:bg-white/5"
            >
              <MapPin className="size-4" aria-hidden="true" />
              Abrir no Google Maps
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
