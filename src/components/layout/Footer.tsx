import { Link } from 'react-router-dom'
import { Lock, MapPin, MessageCircle } from 'lucide-react'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { buildMapsRouteUrl } from '../../lib/maps'
import { InstagramIcon } from '../ui/InstagramIcon'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const ANO_CORRENTE = new Date().getFullYear()

/**
 * Rodapé da vitrine.
 *
 * Duas zonas em vez de uma pilha centralizada: à esquerda a marca e a
 * frase institucional (o "quem somos"), à direita a navegação e o
 * contato (o "para onde ir"). A barra inferior fecha com o dado legal,
 * cinza e pequeno — encerramento discreto, sem virar grade de cards.
 */
export function Footer() {
  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())
  const ano = ANO_CORRENTE

  return (
    <footer className="bg-night-950">
      {/* Linha de chegada: o xadrez separa o conteúdo do rodapé em toda
          rota da vitrine — é o motivo da marca no ponto de descida. */}
      <div className="xadrez" aria-hidden="true" />
      <div className="container-site grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
        {/* Marca + descrição institucional */}
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/logo.webp"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="size-9 shrink-0 object-contain"
            />
            <span className="font-display text-xl font-semibold tracking-[0.14em] text-paper uppercase">
              DG Motos
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-steel-400">
            Motocicletas seminovas em Belo Horizonte. Atendimento direto pelo
            WhatsApp e negociação sem complicação.
          </p>
        </div>

        {/* Navegação */}
        <nav aria-label="Links do rodapé" className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-steel-500 uppercase">
            Navegação
          </p>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="w-fit text-sm text-steel-300 transition-colors hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Contato e localização */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-steel-500 uppercase">
            Contato
          </p>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-steel-300">
            <MapPin className="mt-0.5 size-4 shrink-0 text-steel-500" aria-hidden="true" />
            <span>
              {config.enderecoRua}
              <br />
              {config.enderecoCidadeUf}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={buildMapsRouteUrl(config)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-steel-300 transition-colors hover:text-paper"
            >
              Como chegar
            </a>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-steel-300 transition-colors hover:text-paper"
              >
                <MessageCircle className="size-3.5" aria-hidden="true" />
                WhatsApp
              </a>
            ) : null}
            {config.instagramUrl ? (
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-steel-300 transition-colors hover:text-paper"
              >
                <InstagramIcon className="size-3.5" aria-hidden="true" />
                Instagram
              </a>
            ) : null}
          </div>
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
