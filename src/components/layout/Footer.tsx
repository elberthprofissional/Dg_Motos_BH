import { Link } from 'react-router-dom'
import { ArrowUpRight, Lock } from 'lucide-react'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { buildMapsRouteUrl } from '../../lib/maps'
import { InstagramIcon } from '../ui/InstagramIcon'
import { SITE } from '../../data/site'

const NAV = [
  { to: '/', label: 'Página inicial' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const ANO_ATUAL = new Date().getFullYear()

export function Footer() {
  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())
  const ano = ANO_ATUAL

  return (
    <footer className="border-t border-borda bg-fundo">
      <div className="container-site py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-lg">
            <p className="font-display text-lg font-semibold tracking-[-0.01em] text-texto">{SITE.slogan}</p>
            <p className="mt-2 text-sm leading-relaxed text-texto-2">
              Curadoria de motocicletas seminovas em Belo Horizonte. Cada moto do pátio passa por inspeção mecânica e ciclística e chega com laudo cautelar.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:gap-10">
            <nav aria-label="Navegação do rodapé" className="flex flex-col gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm text-texto-2 transition-colors hover:text-texto"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-2">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-texto"
                >
                  <span>WhatsApp</span>
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
              <a
                href={buildMapsRouteUrl(config)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-texto"
              >
                <span>Traçar rota</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
              {config.instagramUrl ? (
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-texto"
                >
                  <InstagramIcon className="size-4" aria-hidden="true" />
                  <span>{config.instagramHandle}</span>
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>

            <address className="not-italic">
              <p className="text-sm text-texto">{config.enderecoRua}</p>
              <p className="mt-1 text-sm text-texto-2">{config.enderecoCidadeUf}</p>
            </address>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-borda pt-6 text-texto-3 sm:flex-row sm:items-center">
          <p className="text-xs">© {ano} DG Motos — Belo Horizonte, MG.</p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs transition-colors hover:text-texto-2"
          >
            <Lock className="size-3" aria-hidden="true" />
            <span>Acesso restrito</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
