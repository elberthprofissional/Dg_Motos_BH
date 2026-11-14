import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { InstagramIcon } from '../ui/InstagramIcon'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const ANO_ATUAL = new Date().getFullYear()

/**
 * ============================================================
 * RODAPÉ — a faixa preta do fim do pátio
 * ============================================================
 * Mesmo preto da moldura das fotos, texto claro e quatro colunas
 * separadas por régua. Rótulo em caixa normal: aqui nada precisa
 * gritar.
 */
export function Footer() {
  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())

  const titulo = 'text-xs font-medium text-noite-texto-2'
  const link =
    'inline-flex min-h-11 items-center text-sm text-noite-texto-2 transition-colors hover:text-noite-texto sm:min-h-9'

  return (
    <footer className="border-t border-noite-borda bg-rodape text-noite-texto">
      <div className="container-site py-12 md:pb-16">
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              aria-label="DG Motos — Página inicial"
              className="inline-flex min-h-11 items-center gap-2.5"
            >
              <img
                src="/logo.webp"
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain"
              />
              <span className="font-display text-xl leading-none font-extrabold tracking-[-0.01em] uppercase">
                DG Motos
              </span>
            </Link>
            <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-noite-texto-2">
              Motos seminovas em Belo Horizonte, com inspeção mecânica e cautelar
              em cada unidade do pátio.
            </p>
          </div>

          <nav aria-label="Páginas do site" className="flex flex-col items-start">
            <h2 className={titulo}>Páginas</h2>
            <div className="mt-2 flex flex-col items-start">
              {NAV.map((item) => (
                <Link key={item.to} to={item.to} className={link}>
                  {item.label}
                </Link>
              ))}
              <a href="/#sonhos" className={link}>
                Sonhos realizados
              </a>
            </div>
          </nav>

          <div className="flex flex-col items-start">
            <h2 className={titulo}>Contato</h2>
            <div className="mt-2 flex flex-col items-start">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${link} gap-2`}
                >
                  <IconeWhatsapp className="size-4 shrink-0" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              ) : null}
              {config.instagramUrl ? (
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${link} gap-2`}
                >
                  <InstagramIcon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{config.instagramHandle}</span>
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-start sm:col-span-2 lg:col-span-1">
            <h2 className={titulo}>Onde estamos</h2>
            <address className="mt-2 text-sm leading-relaxed text-noite-texto-2 not-italic">
              <p>{config.enderecoRua}</p>
              <p>{config.enderecoCidadeUf}</p>
            </address>
            {config.horarios.length > 0 ? (
              <div className="mt-3 space-y-0.5 text-sm leading-relaxed text-noite-texto-2">
                {config.horarios.map((horario) => (
                  <p key={`${horario.dias}-${horario.horas}`}>
                    {horario.dias}: {horario.horas}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 border-t border-noite-borda pt-4">
          <div className="flex flex-col items-start gap-4 text-sm text-noite-texto-2 lg:flex-row lg:items-center lg:justify-between">
            {/* Esquerda: a ficha da casa. */}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
              <p>© {ANO_ATUAL} DG Motos · Belo Horizonte, MG</p>
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/ibama.webp"
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  className="size-7 shrink-0 object-contain"
                />
                <p className="whitespace-nowrap">Desacelere. Seu bem maior é a vida.</p>
              </div>
            </div>

            {/* Direita: o crédito do responsável e a porta do dono.
                No celular a ordem inverte — o acesso do dono vem
                primeiro e com área de toque maior; na mesa mantém o
                crédito em primeiro e o acesso discreto no fim. */}
            <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:gap-6">
              <a
                href="https://wa.me/5531980159559?text=Fala%2C%20Elberth!%20Vim%20pelo%20cr%C3%A9dito%20no%20rodap%C3%A9%20do%20site%20da%20DG%20Motos%20%F0%9F%91%8B"
                target="_blank"
                rel="noopener noreferrer"
                className="order-2 inline-flex items-center gap-1.5 text-noite-texto-2 transition-colors hover:text-noite-texto lg:order-1"
              >
                <span>
                  Criado por{' '}
                  <span className="font-semibold text-noite-texto">Elberth</span>
                </span>
                <IconeWhatsapp className="size-3.5" aria-hidden="true" />
              </a>
              <Link
                to="/admin/login"
                aria-label="Área administrativa"
                className="order-1 inline-flex min-h-11 items-center gap-2 text-sm text-noite-texto-2/70 transition-colors hover:text-noite-texto lg:order-2 lg:min-h-0 lg:gap-1.5 lg:text-xs lg:text-noite-texto-2/50 lg:transition-colors lg:hover:text-noite-texto"
              >
                <LockKeyhole className="size-4 shrink-0 lg:size-3.5" aria-hidden="true" />
                <span>Área administrativa</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
