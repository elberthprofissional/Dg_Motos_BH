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

  return (
    <footer className="bg-painel text-texto">
      <div className="container-site py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-5">
            <Link
              to="/"
              aria-label="DG Motos — Página inicial"
              className="inline-flex min-h-11 items-center gap-3"
            >
              <img
                src="/logo.webp"
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain"
              />
              <span>
                <span className="block font-display text-xl leading-none font-bold tracking-[0.03em]">
                  DG Motos
                </span>
                <span className="mt-1 block text-sm text-texto-2">Realizando sonhos</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-texto-2">
              Motocicletas seminovas em Belo Horizonte.
            </p>
          </div>

          <nav
            aria-label="Páginas públicas"
            className="flex flex-col items-start gap-1 lg:col-span-3"
          >
            <h2 className="mb-2 font-display text-base font-semibold text-texto">Navegue</h2>
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex min-h-11 items-center text-sm text-texto-2 transition-colors hover:text-texto"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="/#sonhos"
              className="inline-flex min-h-11 items-center text-sm text-texto-2 transition-colors hover:text-texto"
            >
              Sonhos realizados
            </a>
          </nav>

          <div className="flex flex-col items-start gap-1 lg:col-span-4">
            <h2 className="mb-2 font-display text-base font-semibold text-texto">Visite e fale com a loja</h2>
            <address className="mb-2 text-sm leading-relaxed text-texto-2 not-italic">
              <p>{config.enderecoRua}</p>
              <p>{config.enderecoCidadeUf}</p>
            </address>
            {config.horarios.length > 0 ? (
              <div className="mb-2 text-sm leading-relaxed text-texto-2">
                {config.horarios.map((horario) => (
                  <p key={`${horario.dias}-${horario.horas}`}>
                    {horario.dias}: {horario.horas}
                  </p>
                ))}
              </div>
            ) : null}
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm text-texto-2 transition-colors hover:text-texto"
              >
                <IconeWhatsapp className="size-4 shrink-0" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            ) : null}
            {config.telefoneExibicao ? (
              <a
                href={`tel:${config.telefoneExibicao.replace(/[^\d+]/g, '')}`}
                className="inline-flex min-h-11 items-center text-sm text-texto-2 transition-colors hover:text-texto"
              >
                {config.telefoneExibicao}
              </a>
            ) : null}
            {config.instagramUrl ? (
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm text-texto-2 transition-colors hover:text-texto"
              >
                <InstagramIcon className="size-4 shrink-0" aria-hidden="true" />
                <span>{config.instagramHandle}</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 text-sm text-texto-3 sm:flex-row sm:items-center">
          <p>© {ANO_ATUAL} DG Motos · Belo Horizonte, MG.</p>
          <Link
            to="/admin"
            className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-texto-2"
          >
            <Lock className="size-3.5" aria-hidden="true" />
            <span>Acesso restrito</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
