import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { InstagramIcon } from '../ui/InstagramIcon'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'
import { useSiteConfig } from '../../hooks/siteConfigContexto'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const WA_TEXTO: Record<string, string> = {
  '/': 'Olá! Quero ver as motos do estoque da DG Motos.',
  '/estoque': 'Olá! Vi o catálogo e quero saber mais sobre uma moto.',
  '/contato': 'Olá! Vim pelo site e quero falar com a equipe da DG Motos.',
}

/**
 * Cabeçalho — faixa sólida de grafite sobre o fundo preto da loja.
 *
 * Sem borda, sombra ou vidro: a separação vem do tom. A marca fica à
 * esquerda, três links no centro e uma única ação à direita.
 *
 * No celular sobra a marca e o botão "Menu", que abre uma folha de
 * tela cheia — o <dialog> nativo entrega foco preso, Esc e retorno de
 * foco sem nenhum aria improvisado.
 */
export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const buscaInputRef = useRef<HTMLInputElement>(null)

  const { config } = useSiteConfig()
  const wa = useWhatsappLink(WA_TEXTO[location.pathname] ?? buildDefaultMessage())

  /** Navega para o estoque com o termo na URL. O campo do estoque
      lê o parâmetro na inicialização (veja Estoque.tsx). */
  function executarBusca(event?: React.FormEvent) {
    event?.preventDefault()
    const termo = busca.trim()
    const query = termo ? `?busca=${encodeURIComponent(termo)}` : ''
    setBuscaAberta(false)
    setBusca('')
    navigate(`/estoque${query}`)
  }

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

  // A busca fecha com Esc ou clique fora. O clique fora é capturado
  // na janela: se o alvo não estiver dentro do wrapper da busca, fecha.
  useEffect(() => {
    if (!buscaAberta) return
    function aoCliqueFora(event: MouseEvent) {
      const wrapper = buscaInputRef.current?.closest('[data-busca]')
      if (wrapper && !wrapper.contains(event.target as Node)) {
        setBuscaAberta(false)
      }
    }
    function aoEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setBuscaAberta(false)
    }
    window.addEventListener('mousedown', aoCliqueFora)
    window.addEventListener('keydown', aoEsc)
    return () => {
      window.removeEventListener('mousedown', aoCliqueFora)
      window.removeEventListener('keydown', aoEsc)
    }
  }, [buscaAberta])

  // Trocar de rota fecha o menu: a folha não pode ficar aberta sobre
  // a página nova. Fechar o <dialog> dispara o evento `close`, que
  // sincroniza o estado — sem setState dentro do efeito.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog?.open) dialog.close()
  }, [location.pathname])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full bg-painel lg:bg-[#0b0a09]">
        {/* Ordem da barra = quem fala primeiro: a marca, depois os
            caminhos, e as ferramentas na porta da direita. A busca é
            secundária — apertada, sem roubar o meio da barra. */}
        <div className="container-site flex h-20 items-center gap-4 sm:h-[4.25rem]">
          <Link
            to="/"
            aria-label="DG Motos — Página inicial"
            className="flex min-h-11 items-center gap-3"
          >
            <img
              src="/logo.webp"
              alt=""
              width={40}
              height={40}
              className="size-9 object-contain sm:size-10"
            />
            <span className="flex flex-col gap-1">
              <span className="font-display text-base leading-none font-bold tracking-[0.04em] text-white sm:text-lg">
                DG Motos
              </span>
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `inline-flex items-center py-3 font-sans text-sm font-medium transition-colors ${
                    isActive ? 'font-semibold text-marca-texto' : 'text-texto-2 hover:text-texto'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Busca desktop — encolheu e foi pra borda: ferramenta,
                não destaque */}
            <form
              data-busca
              onSubmit={executarBusca}
              className="relative hidden lg:block"
              role="search"
              aria-label="Busca de motos"
            >
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-3"
                aria-hidden="true"
              />
              <input
                ref={buscaInputRef}
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar moto…"
                aria-label="Buscar moto por marca, modelo ou ano"
                enterKeyHint="search"
                className="font-sans h-10 w-48 rounded-none border-0 bg-painel py-1.5 pr-3 pl-9 text-sm text-texto transition-[width,background-color] placeholder:text-texto-3 hover:bg-painel-2 focus:w-60 focus:bg-painel-2 focus:ring-2 focus:ring-marca/60 focus:outline-none xl:w-56 xl:focus:w-72"
              />
            </form>

            <button
              type="button"
              onClick={() => setBuscaAberta((v) => !v)}
              aria-expanded={buscaAberta}
              aria-controls="busca-mobile"
              aria-label="Abrir busca"
              className="grid size-11 place-items-center text-texto transition-colors hover:text-marca-texto lg:hidden"
            >
              <Search className="size-5" aria-hidden="true" />
            </button>

            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary hidden h-11 gap-2 px-5 text-sm lg:inline-flex"
              >
                <IconeWhatsapp className="size-4" />
                Fale conosco
              </a>
            ) : (
              <Link
                to="/contato"
                className="btn btn-primary hidden h-11 gap-2 px-5 text-sm lg:inline-flex"
              >
                <IconeWhatsapp className="size-4" />
                Fale conosco
              </Link>
            )}

            <button
              ref={botaoRef}
              type="button"
              onClick={() => setAberto(true)}
              aria-haspopup="dialog"
              aria-label="Abrir menu"
              className="grid size-11 place-items-center text-texto transition-colors hover:text-marca-texto lg:hidden"
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Busca mobile expansível — abaixo do header, não sobreposição */}
        {buscaAberta && (
          <div
            id="busca-mobile"
            className="container-site pb-4 lg:hidden"
          >
            <form
              data-busca
              onSubmit={executarBusca}
              className="flex items-center gap-2"
              role="search"
              aria-label="Busca de motos"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-3"
                  aria-hidden="true"
                />
                <input
                  ref={buscaInputRef}
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar moto por marca ou modelo…"
                  aria-label="Buscar moto por marca, modelo ou ano"
                  enterKeyHint="search"
                  className="h-11 w-full rounded border border-borda-forte bg-fundo px-3 py-1.5 pl-9 text-base text-texto transition-colors placeholder:text-texto-3 focus:border-marca focus:outline-none focus:ring-1 focus:ring-marca/30"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <button
                type="button"
                onClick={() => setBuscaAberta(false)}
                aria-label="Fechar busca"
                className="grid size-11 shrink-0 place-items-center text-texto-3 transition-colors hover:text-texto"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </form>
          </div>
        )}
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
                <IconeWhatsapp className="size-4" />
                <span>Chamar no WhatsApp</span>
              </a>
            ) : (
              <Link
                to="/contato"
                onClick={() => setAberto(false)}
                className="btn btn-primary h-12 w-full"
              >
                <IconeWhatsapp className="size-4" />
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
