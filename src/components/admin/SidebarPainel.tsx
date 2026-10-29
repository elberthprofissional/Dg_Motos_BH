import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { NavegacaoPainel } from './NavegacaoPainel'
import type { Aba } from './NavegacaoPainel'

interface SideBarProps {
  aba: Aba
  totalNaLixeira: number
  onTrocarAba: (aba: Aba) => void
  onPedirSaida: () => void
}

/** Sidebar fixa à esquerda — layout exclusivo do desktop. */
export function SidebarPainel({
  aba,
  totalNaLixeira,
  onTrocarAba,
  onPedirSaida,
}: SideBarProps) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-sidebar lg:flex"
      aria-label="Menu do painel"
    >
      {/* Marca: logo + wordmark, sem ornamento — o vermelho do painel
          fica para os itens ativos e para o que é ação. */}
      <div className="flex h-[4.75rem] shrink-0 items-center gap-3 border-b border-line px-5">
        <Link
          to="/"
          aria-label="DG Motos — ver o site"
          className="foco-painel group flex min-w-0 items-center gap-3 rounded-lg"
        >
          <span className="relative grid size-10 shrink-0 place-items-center">
            <img src="/logo.webp" alt="" width={40} height={40} className="size-10 object-contain" />
          </span>
          <span className="min-w-0 truncate font-display text-sm font-semibold tracking-[0.12em] text-paper uppercase">
            DG Motos BH
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavegacaoPainel
          variante="lateral"
          aba={aba}
          totalNaLixeira={totalNaLixeira}
          onTrocarAba={onTrocarAba}
        />
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <button
          type="button"
          onClick={onPedirSaida}
          className="foco-painel nav-item text-steel-400 hover:bg-claro/[0.03] hover:text-paper"
        >
          <LogOut className="size-[17px] shrink-0 text-steel-500" strokeWidth={1.8} aria-hidden="true" />
          Sair
        </button>
      </div>
    </aside>
  )
}
