import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { InstagramIcon } from '../ui/InstagramIcon'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

const NAV = [
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const ANO_ATUAL = new Date().getFullYear()

/** Link direto do WhatsApp de quem fez o site (ddi 55 + número). */
const WHATSAPP_CRIADOR = 'https://wa.me/553198015559'

export function Footer() {
  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())

  return (
    <footer className="bg-painel-2 text-texto">
      <div className="container-site py-8 sm:py-10">
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
              <span className="font-display text-xl leading-none font-bold tracking-[0.03em]">
                DG Motos
              </span>
            </Link>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-texto-2">
              Motocicletas seminovas em Belo Horizonte.
            </p>
          </div>

          <nav
            aria-label="Páginas públicas"
            className="flex flex-col items-start lg:col-span-3"
          >
            <h2 className="mb-1 font-display text-sm font-semibold text-texto">Navegue</h2>
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex min-h-11 items-center text-sm text-texto-2 transition-colors hover:text-texto sm:min-h-9"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="/#sonhos"
              className="inline-flex min-h-11 items-center text-sm text-texto-2 transition-colors hover:text-texto sm:min-h-9"
            >
              Sonhos realizados
            </a>
          </nav>

          <div className="flex flex-col items-start lg:col-span-4">
            <h2 className="mb-1 font-display text-sm font-semibold text-texto">Visite e fale com a loja</h2>
            <address className="text-sm leading-relaxed text-texto-2 not-italic">
              <p>{config.enderecoRua}</p>
              <p>{config.enderecoCidadeUf}</p>
            </address>
            {config.horarios.length > 0 ? (
              <div className="text-sm leading-relaxed text-texto-2">
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
                className="inline-flex min-h-11 items-center gap-2 text-sm text-texto-2 transition-colors hover:text-texto sm:min-h-9"
              >
                <IconeWhatsapp className="size-4 shrink-0" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            ) : null}
            {config.instagramUrl ? (
              /* Sem o @ na frente: o handle só interessa a quem já está
                  no perfil. Aqui o convite é a frase, e ela toda é o
                  link — o ícone acompanha o texto. */
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm text-texto-2 transition-colors hover:text-texto sm:min-h-9"
              >
                <InstagramIcon className="size-4 shrink-0" aria-hidden="true" />
                <span className="underline decoration-texto-3/40 underline-offset-4 transition-colors hover:decoration-texto">
                  Siga a gente no Instagram
                </span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-painel-3/60 pt-4 text-sm text-texto-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1">
            <p>© {ANO_ATUAL} DG Motos · Belo Horizonte, MG.</p>
            {/* Porta do painel: discreta de propósito — quem sabe, sabe.
                O ícone de cadeado não anuncia a área, só a deixa ao
                alcance de quem conhece o site por dentro. */}
            <Link
              to="/admin/login"
              aria-label="Área administrativa"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-texto-3 transition-colors hover:text-texto"
            >
              <LockKeyhole className="size-4" aria-hidden="true" />
            </Link>
          </div>
          {/* Crédito do criador com atalho direto pro WhatsApp dele. */}
          <a
            href={WHATSAPP_CRIADOR}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-texto-3 transition-colors hover:text-texto"
          >
            <span>
              Criado por{' '}
              <span className="font-medium text-texto-2 underline decoration-texto-3/40 underline-offset-4 transition-colors hover:decoration-texto">
                Elberth
              </span>
            </span>
          </a>
          {/* Campanha do Ibama, como no site da Honda: o selo acompanha
              a frase. A frase vizinha já descreve o selo, por isso o
              alt vazio — leitor de tela não lê tudo duas vezes. */}
          <div className="flex items-center gap-2.5">
            <img
              src="/icons/ibama.webp"
              alt=""
              width={28}
              height={28}
              loading="lazy"
              className="size-7 shrink-0 object-contain"
            />
            <p className="tracking-wide">
              Desacelere. Seu bem maior é a vida.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
