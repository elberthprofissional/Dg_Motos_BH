import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { buildMapsRouteUrl } from '../../lib/maps'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const ANO_CORRENTE = new Date().getFullYear()

export function Footer() {
  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())
  const ano = ANO_CORRENTE

  return (
    <footer className="border-t border-white/10 bg-[#0c0c0c]">
      <div className="container-site flex flex-col items-center gap-8 py-12 text-center sm:items-start sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4 lg:px-10">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-sm bg-[#d91f32] font-display text-base font-bold text-white"
          >
            DG
          </span>
          <span className="font-display text-2xl font-bold tracking-[0.18em] text-[#f5f5f5] uppercase">
            DG Motos
          </span>
        </div>

        <p className="max-w-md text-sm leading-relaxed text-steel-400">
          Motocicletas seminovas selecionadas em Belo Horizonte. Atendimento
          direto, procedência conferida e negociação sem complicação.
        </p>

        <nav aria-label="Links do rodapé" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="font-display text-sm tracking-[0.14em] text-steel-300 transition-colors uppercase hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={buildMapsRouteUrl(config.mapsUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-sm tracking-[0.14em] text-steel-300 transition-colors uppercase hover:text-paper"
          >
            Como chegar
          </a>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-sm tracking-[0.14em] text-steel-300 transition-colors uppercase hover:text-paper"
            >
              WhatsApp
            </a>
          ) : null}
          {config.instagramUrl ? (
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-sm tracking-[0.14em] text-steel-300 transition-colors uppercase hover:text-paper"
            >
              Instagram
            </a>
          ) : null}
        </nav>
      </div>

      <div className="border-t border-white/10">
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
