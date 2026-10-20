import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, MessageCircle, X } from 'lucide-react'
import { buildDefaultMessage, useWhatsappLink } from '../../lib/format'
import { useScrolled } from '../../hooks/useNavigation'
import { InstagramIcon } from '../ui/InstagramIcon'
import { useSiteConfig } from '../../hooks/siteConfigContexto'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const WA_TEXTO: Record<string, string> = {
  '/': 'Olha só a DG Motos',
  '/estoque': 'Vi no estoque e quero saber mais',
  '/contato': 'Quero falar com a DG Motos',
}

export function Header() {
  const scrolled = useScrolled(20)
  const location = useLocation()
  const [abertoEm, setAbertoEm] = useState<string | null>(null)
  const open = abertoEm === location.pathname
  const setOpen = (v: boolean) => setAbertoEm(v ? location.pathname : null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbertoEm(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const { config } = useSiteConfig()
  const wa = useWhatsappLink(WA_TEXTO[location.pathname] ?? buildDefaultMessage())

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0c0c0c]/95 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'shadow-lg shadow-black/40' : ''
      }`}
    >
      {/* Faixa vermelha fina no topo — assinatura visual da barra */}
      <div aria-hidden="true" className="h-[3px] w-full bg-gradient-to-r from-[#d91f32] via-[#d91f32] to-[#8a1220]" />

      <div className="relative flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        {/* ---------------------------------------------------------
            Coluna esquerda: menu. No celular é o hamburger (44px de
            alvo). No desktop entra o nav inline, e o hamburger some.
        --------------------------------------------------------- */}
        <div className="flex flex-1 items-center justify-start">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="grid size-11 place-items-center text-[#f5f5f5] transition-colors hover:text-[#d91f32] lg:hidden"
          >
            {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-7 lg:flex"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative font-display text-[13px] font-medium tracking-[0.18em] uppercase transition-colors duration-200 ${
                    isActive ? 'text-[#d91f32]' : 'text-[#b3b3b3] hover:text-[#f5f5f5]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {/* Sublinha vermelha só no ativo: nada de animação de
                        hover aqui, a cor já comunica. */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 -bottom-2 h-[2px] bg-[#d91f32] transition-opacity duration-200 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Logo centrada absolutamente: 3 zonas (menu | logo | ação) */}
        <Link
          to="/"
          aria-label="DG Motos — Página inicial"
          className="absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 transition-opacity duration-200 hover:opacity-90"
        >
          <img
            src="/logo.webp"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="size-9 object-contain"
          />
          <span className="font-display text-xl leading-none font-bold tracking-[0.18em] text-[#f5f5f5] uppercase">
            DG Motos
          </span>
        </Link>

        {/* Ação: WhatsApp (se configurado) senão Contato */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {config.instagramUrl ? (
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${config.instagramHandle ?? 'da DG Motos'}`}
              className="hidden size-10 place-items-center rounded-sm border border-white/15 text-[#b3b3b3] transition-colors hover:border-[#d91f32] hover:text-[#d91f32] xl:grid"
            >
              <InstagramIcon className="size-4" aria-hidden="true" />
            </a>
          ) : null}

          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-[#d91f32] px-5 font-display text-xs font-semibold tracking-[0.18em] text-white uppercase transition-colors duration-200 hover:bg-[#b71c2b]"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Contato
            </a>
          ) : (
            <Link
              to="/contato"
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-[#d91f32] px-5 font-display text-xs font-semibold tracking-[0.18em] text-white uppercase transition-colors duration-200 hover:bg-[#b71c2b]"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Contato
            </Link>
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      <div
        id="menu-mobile"
        inert={!open}
        className={`fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto overscroll-contain bg-[#0c0c0c] transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <nav aria-label="Navegação mobile" className="container-site flex flex-col pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          <ul className="flex flex-col divide-y divide-white/5">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-16 items-center font-display text-2xl font-semibold tracking-[0.14em] uppercase transition-colors duration-200 ${
                      isActive ? 'text-[#d91f32]' : 'text-[#f5f5f5] hover:text-[#d91f32]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#d91f32] px-5 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Falar com a loja
              </a>
            ) : (
              <Link
                to="/contato"
                onClick={() => setOpen(false)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#d91f32] px-5 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Falar com a loja
              </Link>
            )}

            {config.instagramUrl ? (
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-white/15 px-5 font-display text-sm font-semibold tracking-[0.18em] text-[#f5f5f5] uppercase transition-colors hover:border-[#d91f32] hover:text-[#d91f32]"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                {config.instagramHandle ?? 'Instagram'}
              </a>
            ) : null}
          </div>

          <p className="mt-10 text-center font-display text-xs tracking-[0.18em] text-[#6b6b6b] uppercase">
            Av. Basílio da Gama, 139 — Belo Horizonte, MG
          </p>
        </nav>
      </div>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 top-16 z-40 bg-black/80 transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
    </header>
  )
}
