import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Bike, House, MapPin, Menu, X } from 'lucide-react'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { InstagramIcon } from '../ui/InstagramIcon'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'
import { useSiteConfig } from '../../hooks/siteConfigContexto'

/**
 * ============================================================
 * CABEÇALHO — a régua do pátio
 * ============================================================
 *
 * Concreto claro, o nome da loja à esquerda e três links sem enfeite.
 * A página atual é marcada por um traço vermelho de 2 px embaixo do
 * texto; o resto do cabeçalho é tinta e régua de 1 px.
 *
 * No celular, a navegação vira uma folha de tela cheia com a mesma
 * tipografia e o mesmo traço. A busca é o único campo do cabeçalho e
 * abre logo abaixo da barra, sem sobrepor o conteúdo.
 */

const NAV = [
  { to: '/', label: 'Início', Icone: House },
  { to: '/estoque', label: 'Estoque', Icone: Bike },
  { to: '/contato', label: 'Contato', Icone: MapPin },
]

const WA_TEXTO: Record<string, string> = {
  '/': 'Olá! Quero ver as motos do estoque da DG Motos.',
  '/estoque': 'Olá! Vi o catálogo e quero saber mais sobre uma moto.',
  '/contato': 'Olá! Vim pelo site e quero falar com a equipe da DG Motos.',
}

export function Header() {
  const location = useLocation()
  const [aberto, setAberto] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)

  const { config } = useSiteConfig()
  const wa = useWhatsappLink(WA_TEXTO[location.pathname] ?? buildDefaultMessage())

  // O cabeçalho fica fixo. Quem sai de cena é a barra de filtros do
  // estoque — dois elementos animando juntos piscavam a tela.

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (aberto && !dialog.open) dialog.showModal()
    if (!aberto && dialog.open) dialog.close()
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [aberto])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onClose = () => {
      setAberto(false)
      botaoRef.current?.focus()
    }
    dialog.addEventListener('close', onClose)
    return () => dialog.removeEventListener('close', onClose)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog?.open) dialog.close()
  }, [location.pathname])

  return (
    <>
      <header
        className="cabecalho fixed inset-x-0 top-0 z-50 w-full"
      >
        <div className="container-site relative flex h-20 items-center gap-6 lg:h-[6.5rem]">
          <Link
            to="/"
            aria-label="DG Motos — Página inicial"
            className="flex shrink-0 items-center"
          >
            <img
              src="/logo.webp"
              alt=""
              width={40}
              height={40}
              className="size-12 object-contain sm:size-14 lg:size-[5.5rem]"
            />
          </Link>

          {/* Centrada na barra: o logo à esquerda e o WhatsApp à
              direita não empurram mais os três links para o canto. */}
          <nav
            aria-label="Navegação principal"
            className="absolute top-0 left-1/2 hidden h-full -translate-x-1/2 lg:flex"
          >
            <ul className="flex h-full items-stretch gap-7">
              {NAV.map((item) => (
                <li key={item.to} className="flex">
                  <NavLink to={item.to} end={item.to === '/'} className="cabecalho-link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto hidden min-w-0 items-center gap-3 lg:flex">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="cabecalho-cta">
                <IconeWhatsapp className="size-4 shrink-0" />
                <span>Falar no WhatsApp</span>
              </a>
            ) : (
              <Link to="/contato" className="cabecalho-cta">
                <IconeWhatsapp className="size-4 shrink-0" />
                <span>Falar com a loja</span>
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <button
              ref={botaoRef}
              type="button"
              onClick={() => setAberto(true)}
              aria-haspopup="dialog"
              aria-label="Abrir menu"
              className="grid size-11 place-items-center bg-texto text-fundo transition-colors hover:bg-marca"
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>

      </header>

      <dialog
        ref={dialogRef}
        aria-label="Menu de navegação"
        className="menu-mobile"
        onClick={(e) => {
          if (e.target === dialogRef.current) setAberto(false)
        }}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto overscroll-contain">
          <div>
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <span className="flex items-center gap-2.5">
                <img
                  src="/logo.webp"
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 object-contain"
                />
                <span className="font-display text-base font-extrabold tracking-[-0.01em] uppercase">
                  DG Motos
                </span>
              </span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="grid size-11 place-items-center text-texto-2 transition-colors hover:text-texto"
              >
                <X className="size-6" aria-hidden="true" />
                <span className="sr-only">Fechar menu</span>
              </button>
            </div>

            <nav aria-label="Navegação mobile" className="flex flex-col px-5">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setAberto(false)}
                  className="menu-folha-item"
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* O fecho do menu: só o Instagram — WhatsApp o site inteiro
              já oferece (hero, balão flutuante, cartões), e endereço
              mora no rodapé. Navegação pura, cara de marca. */}
          <div className="px-5 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {config.instagramUrl ? (
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAberto(false)}
                className="inline-flex items-center gap-2 py-2 text-sm font-medium text-texto-3 transition-colors hover:text-texto"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                <span>{config.instagramHandle}</span>
              </a>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  )
}
