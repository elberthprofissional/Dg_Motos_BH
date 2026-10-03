import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  // Guarda a rota em que o menu foi aberto em vez de um booleano: assim
  // navegar já fecha o drawer, sem effect e sem um segundo render.
  const [abertoEm, setAbertoEm] = useState<string | null>(null)
  const open = abertoEm === location.pathname
  const setOpen = (v: boolean) => setAbertoEm(v ? location.pathname : null)

  // Trava o scroll do body com o menu aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Esc fecha o drawer. Sem isso, no celular o usuário precisa acertar o
  // botão de fechar depois de escolher uma rota.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbertoEm(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open
          ? 'border-line bg-night-950'
          : 'border-transparent bg-night-950/70'
      }`}
    >
      <div className="container-site flex h-16 items-center justify-between gap-4 pt-[env(safe-area-inset-top)] lg:h-[72px]">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="DG Motos — início"
        >
          <img
            src="/logo.webp"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="size-9 object-contain lg:size-10"
          />
          <span className="font-display text-base leading-none font-semibold tracking-[0.18em] uppercase lg:text-lg">
            DG Motos
          </span>
        </Link>

        {/* Navegação centralizada no desktop: três colunas de igual peso
            mantêm o menu no meio sem depender de `justify-center` com
            larguras assimétricas. */}
        <nav
          aria-label="Navegação principal"
          className="hidden flex-1 items-stretch self-stretch lg:flex"
        >
          <ul className="m-auto flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative flex h-full items-center px-3.5 text-sm font-medium transition-colors ${
                      isActive ? 'text-paper' : 'text-steel-400 hover:text-paper'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {/* Estado ativo marcado por fio vermelho embaixo, não
                          só pela cor do texto. */}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-3 bottom-0 h-0.5 origin-left bg-brand-500 transition-transform duration-300 ${
                          isActive ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {/* Se o dono limpar o Instagram no painel, `instagramUrl` vem vazio: sem
              este guarda o `<a href="">` apontaria para a própria página. */}
          {config.instagramUrl ? (
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da DG Motos"
              className="hidden size-10 place-items-center text-steel-400 transition-colors hover:text-paper lg:grid"
            >
              <InstagramIcon className="size-4.5" aria-hidden="true" />
            </a>
          ) : null}

          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 lg:inline-flex"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : (
            <Link
              to="/contato"
              className="hidden items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 lg:inline-flex"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Fale conosco
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="-mr-2 grid size-11 place-items-center text-paper lg:hidden"
          >
            {open ? (
              <X className="size-6" aria-hidden="true" />
            ) : (
              <Menu className="size-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Drawer do celular. Fica logo abaixo do header, com altura limitada
          ao que sobra da tela e rolagem própria quando a lista não cabe. */}
      <div
        id="menu-mobile"
        inert={!open}
        className={`fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto overscroll-contain bg-night-950 transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <nav
          aria-label="Navegação mobile"
          className="container-site pt-2 pb-[max(2.5rem,env(safe-area-inset-bottom))]"
        >
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.to} className="border-b border-line">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-14 items-center justify-between py-3 text-lg font-medium transition-colors ${
                      isActive ? 'text-brand-500' : 'text-paper'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {config.instagramUrl ? (
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center gap-3 border-b border-line text-paper"
            >
              <InstagramIcon className="size-5 text-steel-400" aria-hidden="true" />
              Instagram
            </a>
          ) : null}

          {/* CTA do celular fica no fim da lista, com o mesmo peso do
              cabeçalho: é a ação principal de quem entra pelo celular. */}
          <div className="pt-6">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded bg-brand-500 px-5 py-3.5 font-display text-sm font-semibold tracking-[0.08em] text-white uppercase"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Falar no WhatsApp
              </a>
            ) : (
              <Link
                to="/contato"
                onClick={() => setOpen(false)}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded bg-brand-500 px-5 py-3.5 font-display text-sm font-semibold tracking-[0.08em] text-white uppercase"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Falar com a loja
              </Link>
            )}
            <p className="mt-4 text-center text-xs text-steel-500">
              {config.enderecoRua} — {config.enderecoCidadeUf}
            </p>
          </div>
        </nav>
      </div>

      {/* Véu do drawer: escurece o conteúdo sem borrar — um painel de vidro
          deixaria o texto de fundo competir com o menu. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 top-16 z-40 bg-black/70 transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
    </header>
  )
}