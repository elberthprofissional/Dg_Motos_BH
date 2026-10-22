import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { InstagramIcon } from '../ui/InstagramIcon'
import { useSiteConfig } from '../../hooks/siteConfigContexto'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const WA_TEXTO: Record<string, string> = {
  '/': 'Olá! Gostaria de consultar o estoque da DG Motos.',
  '/estoque': 'Olá! Vi o catálogo e quero saber mais sobre uma moto.',
  '/contato': 'Olá! Gostaria de falar com a equipe da DG Motos.',
}

/**
 * Cabeçalho — a placa de identificação da loja.
 *
 * Fundo preto porque a logo da casa é um traço branco: ela só
 * funciona sobre preto, então preto é o chão da barra e do rodapé.
 *
 * A barra é uma linha só, sem moldura, sem sombra e sem fio de
 * vermelho: a marca fica à esquerda, três links no meio e uma única
 * ação à direita, no mesmo tamanho de texto do resto. Nada de pílula
 * flutuante nem de barra com fundo.
 *
 * No celular sobra a marca e o botão "Menu", que abre uma folha de
 * tela cheia — o <dialog> nativo entrega foco preso, Esc e retorno de
 * foco sem nenhum aria improvisado.
 */
export function Header() {
  const location = useLocation()
  const [aberto, setAberto] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)

  const { config } = useSiteConfig()
  const wa = useWhatsappLink(WA_TEXTO[location.pathname] ?? buildDefaultMessage())

  // O <dialog> nativo cuida do modal: `showModal()` prende o foco,
  // Esc fecha e o navegador devolve o foco ao botão de origem.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (aberto && !dialog.open) dialog.showModal()
    if (!aberto && dialog.open) dialog.close()
  }, [aberto])

  // Menu aberto trava a rolagem do fundo: a página não pode andar
  // por baixo da folha.
  useEffect(() => {
    if (!aberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [aberto])

  // Fechou pelo Esc (ou pelo botão do próprio diálogo): o estado
  // precisa acompanhar, senão o cabeçalho fica marcado como aberto.
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

  // Trocar de rota fecha o menu: a folha não pode ficar aberta sobre
  // a página nova. Fechar o <dialog> dispara o evento `close`, que
  // sincroniza o estado — sem setState dentro do efeito.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog?.open) dialog.close()
  }, [location.pathname])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-fundo">
        <div className="container-site flex h-[4.25rem] items-center justify-between gap-6">
          <Link
            to="/"
            aria-label="DG Motos — Página inicial"
            className="flex items-center gap-3"
          >
            <img
              src="/logo.webp"
              alt=""
              width={40}
              height={40}
              className="size-9 object-contain sm:size-10"
            />
            <span className="font-display text-xl font-semibold leading-none tracking-[-0.01em] text-texto sm:text-2xl">
              DG Motos
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-9 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `py-2 font-sans text-sm font-medium transition-colors duration-150 ${
                    isActive ? 'text-texto' : 'text-texto-2 hover:text-texto'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary hidden h-10 px-5 text-sm lg:inline-flex"
              >
                Conversar no WhatsApp
              </a>
            ) : (
              <Link to="/contato" className="btn btn-primary hidden h-10 px-5 text-sm lg:inline-flex">
                Conversar no WhatsApp
              </Link>
            )}

            <button
              ref={botaoRef}
              type="button"
              onClick={() => setAberto(true)}
              aria-haspopup="dialog"
              className="flex min-h-11 items-center px-1 font-sans text-sm font-semibold text-texto transition-colors hover:text-marca-texto lg:hidden"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {/* Menu do celular — <dialog> nativo (Esc, foco preso e retorno) */}
      <dialog
        ref={dialogRef}
        aria-label="Menu de navegação"
        className="menu-mobile"
        onClick={(e) => {
          // Clique fora do painel (na área do ::backdrop) fecha.
          if (e.target === dialogRef.current) setAberto(false)
        }}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto overscroll-contain">
          <div>
            <div className="flex h-16 items-center justify-between px-5">
              <span className="display text-xl leading-none text-texto">DG Motos</span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="grid size-11 place-items-center text-texto-3 transition-colors hover:text-texto"
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
                  className={({ isActive }) =>
                    `display py-5 text-4xl transition-colors ${
                      isActive ? 'text-marca-texto' : 'text-texto'
                    }`
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="space-y-4 px-5 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAberto(false)}
                className="btn btn-primary h-12 w-full"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                <span>Chamar no WhatsApp</span>
              </a>
            ) : (
              <Link
                to="/contato"
                onClick={() => setAberto(false)}
                className="btn btn-primary h-12 w-full"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                <span>Falar com a equipe</span>
              </Link>
            )}

            {config.instagramUrl ? (
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAberto(false)}
                className="inline-flex items-center gap-2 py-2 text-sm text-texto-2 transition-colors hover:text-texto"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                <span>Instagram {config.instagramHandle}</span>
              </a>
            ) : null}

            <p className="corpo text-texto-3">
              {config.enderecoRua} — {config.enderecoCidadeUf}
            </p>
          </div>
        </div>
      </dialog>
    </>
  )
}
