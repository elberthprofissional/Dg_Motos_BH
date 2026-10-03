import { Link } from 'react-router-dom'
import { Lock, MapPin, MessageCircle } from 'lucide-react'
import { InstagramIcon } from '../ui/InstagramIcon'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage, useWhatsappLink } from '../../lib/format'

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
    <footer className="border-t border-white/10 bg-night-900">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded bg-brand-500 font-display text-base font-bold text-white"
            >
              DG
            </span>
            <span className="font-display text-lg font-semibold uppercase">DG Motos</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-steel-400">
            Motocicletas seminovas selecionadas em Belo Horizonte. Atendimento
            direto, procedência conferida e negociação sem complicação.
          </p>
        </div>

        <nav aria-label="Links do rodapé">
          <h3 className="font-display text-xs font-semibold tracking-[0.22em] text-steel-400 uppercase">
            Navegação
          </h3>
          <ul className="mt-4 space-y-2.5">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-steel-300 transition-colors hover:text-paper"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="font-display text-xs font-semibold tracking-[0.22em] text-steel-400 uppercase">
            Contato
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-steel-300">
            <li>
              <a
                href={config.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-paper"
              >
                {config.enderecoRua} — {config.enderecoCidadeUf}
              </a>
            </li>
            {wa ? (
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-paper"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </li>
            ) : null}
            <li>
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-paper"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                {config.instagramHandle}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-xs font-semibold tracking-[0.22em] text-steel-400 uppercase">
            Localização
          </h3>
          <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-steel-300">
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
            <span>
              {config.enderecoRua}
              <br />
              {config.enderecoCidadeUf}
            </span>
          </p>
          <a
            href={config.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-brand-500 transition-colors hover:text-brand-600"
          >
            Ver rota no Google Maps
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-start justify-between gap-3 py-5 text-xs text-steel-500 sm:flex-row sm:items-center">
          <p>
            © {ano} DG Motos — Realizando Sonhos. Todos os direitos reservados.
          </p>
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
