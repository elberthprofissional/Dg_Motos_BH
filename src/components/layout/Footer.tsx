import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { InstagramIcon } from '../ui/InstagramIcon'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

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
    <footer className="bg-painel">
      <div className="container-site py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-5">
            <Link
              to="/"
              aria-label="DG Motos — Página inicial"
              className="inline-flex items-center gap-3"
            >
              <img
                src="/logo.webp"
                alt=""
                width={36}
                height={36}
                className="size-9 object-contain"
              />
              <span className="font-display text-lg leading-none font-bold tracking-[0.04em] text-texto">
                DG Motos
              </span>
            </Link>

            <address className="mt-5 text-sm leading-relaxed text-texto-2 not-italic">
              <p className="text-texto">{config.enderecoRua}</p>
              <p className="mt-1">{config.enderecoCidadeUf}</p>
            </address>
          </div>

          <nav
            aria-label="Navegação do rodapé"
            className="flex flex-col items-start gap-1 lg:col-span-3"
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex min-h-8 items-center text-sm text-texto-2 transition-colors hover:text-texto"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-start gap-1 lg:col-span-4">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-2 text-sm text-texto-2 transition-colors hover:text-texto"
              >
                <IconeWhatsapp className="size-4 shrink-0" />
                <span>WhatsApp</span>
              </a>
            ) : null}

            {config.instagramUrl ? (
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-2 text-sm text-texto-2 transition-colors hover:text-texto"
              >
                <InstagramIcon className="size-4 shrink-0" aria-hidden="true" />
                <span>{config.instagramHandle}</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-[13px] text-texto-3">
            © {ano} DG Motos — Belo Horizonte, MG.
          </p>
          <Link
            to="/admin"
            className="inline-flex min-h-6 items-center gap-1.5 text-[13px] text-texto-3 transition-colors hover:text-texto-2"
          >
            <Lock className="size-3.5" aria-hidden="true" />
            <span>Acesso restrito</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
