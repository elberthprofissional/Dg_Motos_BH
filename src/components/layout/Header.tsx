import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, MessageCircle, X } from 'lucide-react'
import { InstagramIcon } from '../ui/InstagramIcon'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage, useWhatsappLink } from '../../lib/format'
import { useScrolled } from '../../hooks/useNavigation'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/financiamento', label: 'Financiamento' },
  { to: '/troca', label: 'Troca' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/contato', label: 'Contato' },
]

export function Header() {
  const scrolled = useScrolled(20)
  const [open, setOpen] = useState(false)

  // Trava o scroll do body com o menu aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open
          ? 'border-white/10 bg-night-950/90 backdrop-blur'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="DG Motos — início">
          <img
            src="/logo.webp"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="size-10 object-contain"
          />
          <span className="font-display text-lg font-semibold tracking-wide uppercase">
            DG Motos
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-paper'
                    : 'text-steel-400 hover:text-paper'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={config.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram da DG Motos"
            className="hidden size-9 place-items-center rounded text-steel-300 transition-colors hover:text-paper sm:grid"
          >
            <InstagramIcon className="size-4.5" aria-hidden="true" />
          </a>

          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 sm:inline-flex"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : (
            <Link
              to="/contato"
              className="hidden items-center gap-2 rounded bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 sm:inline-flex"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Fale conosco
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="grid size-9 place-items-center rounded text-paper lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav
          id="menu-mobile"
          aria-label="Navegação mobile"
          className="border-t border-white/10 bg-night-950/95 backdrop-blur lg:hidden"
        >
          <ul className="container-site flex flex-col py-3">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded px-3 py-3 text-base font-medium ${
                      isActive ? 'bg-white/5 text-paper' : 'text-steel-300'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 border-t border-white/10 pt-3">
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-steel-300"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                Instagram
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 rounded bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Negociar pelo WhatsApp
                </a>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
