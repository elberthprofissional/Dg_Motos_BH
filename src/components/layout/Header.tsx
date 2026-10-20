import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, MessageCircle, X } from 'lucide-react'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { useScrolled } from '../../hooks/useScroll'
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
      className={`fixed inset-x-0 top-0 z-50 border-b border-line bg-night-950/95 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'shadow-lg shadow-black/40' : ''
      }`}
    >
      {/* Faixa vermelha fina no topo — assinatura visual da barra.
          Vermelho sólido da marca (sem gradiente): é um fio de identidade,
          não um efeito. */}
      <div aria-hidden="true" className="h-[3px] w-full bg-brand-500" />

      {/* Composição em 3 colunas: menu | marca | ações.
          As laterais são `minmax(0,1fr)` — iguais e livres para encolher —
          então a coluna central (auto, do tamanho da marca) fica com o
          centro sempre no centro da barra. O logo não depende da largura
          dos links para se centralizar: centralização geométrica de verdade,
          mesmo que o menu e as ações cresçam de forma diferente. */}
      <div className="container-site grid h-[68px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 lg:h-[76px]">
        {/* ---------------- Zona esquerda: navegação ---------------- */}
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="-ml-2 grid size-11 place-items-center text-paper transition-colors hover:text-brand-500 lg:hidden"
          >
            {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>

          <nav aria-label="Navegação principal" className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative py-1 text-[13px] font-medium tracking-[0.02em] transition-colors duration-200 ${
                    isActive ? 'text-paper' : 'text-steel-400 hover:text-paper'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {/* Indicador ativo: um fio curto e fino, centrado sob o
                        rótulo — não uma faixa que ocupa a altura toda. */}
                    <span
                      aria-hidden="true"
                      className={`absolute -bottom-1.5 left-1/2 h-px -translate-x-1/2 bg-brand-500 transition-all duration-200 ${
                        isActive ? 'w-5 opacity-100' : 'w-0 opacity-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ---------------- Zona central: marca DG Motos ----------------
            Lockup horizontal (símbolo + nome): ocupa menos altura que a
            versão empilhada, libera a barra para ficar mais baixa e dá
            mais presença ao nome, que é o que a marca precisa comunicar. */}
        <Link
          to="/"
          aria-label="DG Motos — Página inicial"
          className="group flex items-center gap-2.5 justify-self-center transition-opacity duration-200 hover:opacity-90"
        >
          <img
            src="/logo.webp"
            alt=""
            aria-hidden="true"
            width={44}
            height={44}
            className="h-10 w-10 object-contain"
          />
          <span className="font-display text-lg leading-none font-semibold tracking-[0.04em] text-paper uppercase sm:text-[22px]">
            DG Motos
          </span>
        </Link>

        {/* ---------------- Zona direita: ações ---------------- */}
        <div className="flex items-center justify-end gap-2.5">
          {config.instagramUrl ? (
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${config.instagramHandle ?? 'da DG Motos'}`}
              className="hidden size-10 place-items-center rounded-md border border-line-forte text-steel-400 transition-colors hover:border-ok/50 hover:text-ok md:grid"
            >
              <InstagramIcon className="size-4" aria-hidden="true" />
            </a>
          ) : null}

          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-500 px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-brand-600 active:bg-brand-700 sm:px-5"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Contato</span>
            </a>
          ) : (
            <Link
              to="/contato"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-500 px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-brand-600 active:bg-brand-700 sm:px-5"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Contato</span>
            </Link>
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      <div
        id="menu-mobile"
        inert={!open}
        className={`fixed inset-x-0 bottom-0 top-[71px] z-50 overflow-y-auto overscroll-contain bg-night-950 transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <nav aria-label="Navegação mobile" className="container-site flex flex-col pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          <ul className="flex flex-col divide-y divide-line">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-16 items-center font-display text-2xl font-semibold tracking-[0.08em] uppercase transition-colors duration-200 ${
                      isActive ? 'text-brand-500' : 'text-paper hover:text-brand-500'
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
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-brand-500 px-5 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-brand-600"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Falar com a loja
              </a>
            ) : (
              <Link
                to="/contato"
                onClick={() => setOpen(false)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-brand-500 px-5 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-brand-600"
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
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-line-forte px-5 font-display text-sm font-semibold tracking-[0.18em] text-paper uppercase transition-colors hover:border-brand-500/60 hover:text-brand-500"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                {config.instagramHandle ?? 'Instagram'}
              </a>
            ) : null}
          </div>

          <p className="mt-10 text-center font-display text-xs tracking-[0.14em] text-steel-600 uppercase">
            {config.enderecoRua} — {config.enderecoCidadeUf}
          </p>
        </nav>
      </div>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 top-[71px] z-40 bg-black/80 transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
    </header>
  )
}
