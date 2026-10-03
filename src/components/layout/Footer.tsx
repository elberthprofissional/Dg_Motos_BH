import { Link } from 'react-router-dom'
import { Lock, MapPin, MessageCircle } from 'lucide-react'
import { InstagramIcon } from '../ui/InstagramIcon'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage, useWhatsappLink } from '../../lib/format'
import { buildMapsRouteUrl } from '../../lib/maps'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/financiamento', label: 'Financiamento' },
  { to: '/troca', label: 'Troca' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/contato', label: 'Contato' },
]

const ANO_CORRENTE = new Date().getFullYear()

export function Footer() {
  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())
  const ano = ANO_CORRENTE

  return (
    <footer className="border-t border-line bg-night-900">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        {/* Identidade */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-sm bg-brand-500 font-display text-base font-bold text-white"
            >
              DG
            </span>
            <span className="font-display text-lg font-semibold tracking-wide uppercase">
              DG Motos
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-steel-400">
            Motocicletas seminovas selecionadas em Belo Horizonte. Atendimento
            direto, procedência conferida e negociação sem complicação.
          </p>
          {config.instagramUrl ? (
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm text-steel-300 transition-colors hover:text-paper"
            >
              <InstagramIcon className="size-4" aria-hidden="true" />
              {config.instagramHandle || 'Instagram'}
            </a>
          ) : null}
        </div>

        <nav aria-label="Links do rodapé" className="lg:col-span-2">
          <h2 className="font-display text-[11px] font-semibold tracking-[0.22em] text-steel-500 uppercase">
            Navegação
          </h2>
          <ul className="mt-4 space-y-3">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="link-editorial text-sm text-steel-300 transition-colors hover:text-paper"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Endereço e WhatsApp juntos: são o mesmo caminho de contato, e
            antes eram duas colunas repetindo a mesma rua. */}
        <div className="lg:col-span-3">
          <h2 className="font-display text-[11px] font-semibold tracking-[0.22em] text-steel-500 uppercase">
            Endereço
          </h2>
          <a
            href={buildMapsRouteUrl(config.mapsUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-steel-300 transition-colors hover:text-paper"
          >
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
            <span>
              {config.enderecoRua}
              <br />
              {config.enderecoCidadeUf}
            </span>
          </a>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-steel-300 transition-colors hover:text-paper"
            >
              <MessageCircle className="size-4 text-brand-500" aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}
          {config.telefoneExibicao ? (
            <p className="mt-4 text-sm text-steel-300">{config.telefoneExibicao}</p>
          ) : null}
        </div>

        {/* Horários só aparecem se o dono tiver cadastrado no painel. */}
        <div className="lg:col-span-3">
          <h2 className="font-display text-[11px] font-semibold tracking-[0.22em] text-steel-500 uppercase">
            Horários
          </h2>
          {config.horarios.length > 0 ? (
            <dl className="mt-4 space-y-2 text-sm">
              {config.horarios.map((h) => (
                <div key={h.dias} className="flex items-baseline justify-between gap-4">
                  <dt className="text-steel-400">{h.dias}</dt>
                  <dd className="text-paper">{h.horas}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-steel-500">
              Confirme o horário de funcionamento pelo WhatsApp ou Instagram antes
              de vir.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-site flex flex-col items-start justify-between gap-3 py-5 text-xs text-steel-500 sm:flex-row sm:items-center">
          <p>© {ano} DG Motos — Realizando Sonhos. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>Belo Horizonte, Minas Gerais.</p>
            {/* Aponta para /admin e não /admin/login: quem já está logado cai
                direto no painel, quem não está é levado ao login. */}
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-steel-300"
            >
              <Lock className="size-3.5" aria-hidden="true" />
              Área administrativa
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}