import { useEffect, useRef, useState } from 'react'
import { Settings, User, LogOut } from 'lucide-react'
import { SeloLixeira } from './NavegacaoPainel'
import type { Aba } from './NavegacaoPainel'

interface MenuContaProps {
  aba: Aba
  totalNaLixeira: number
  /** Só fecha o menu e delega — quem troca a aba é o Admin. */
  onIrParaConfiguracoes: () => void
  onPedirSaida: () => void
}

/**
 * Avatar da conta (só no celular): o caminho para Configurações e Sair,
 * que saíram da barra inferior. Desktop é sidebar.
 *
 * O menu fecha com Esc e clique fora — o painel fica preso ao header;
 * os itens podem trocar de aba sem recarregar.
 */
export function MenuConta({
  aba,
  totalNaLixeira,
  onIrParaConfiguracoes,
  onPedirSaida,
}: MenuContaProps) {
  const [aberto, setAberto] = useState(false)
  const referencia = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    function aoCliqueFora(evento: MouseEvent) {
      if (referencia.current && !referencia.current.contains(evento.target as Node)) {
        setAberto(false)
      }
    }
    function aoEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAberto(false)
    }
    window.addEventListener('mousedown', aoCliqueFora)
    window.addEventListener('keydown', aoEsc)
    return () => {
      window.removeEventListener('mousedown', aoCliqueFora)
      window.removeEventListener('keydown', aoEsc)
    }
  }, [aberto])

  return (
    <div className="ml-auto relative lg:hidden" ref={referencia}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label="Menu da conta"
        className={`foco-painel grid size-10 place-items-center rounded-full border transition-colors ${
          aberto
            ? 'border-brand-500/60 bg-brand-500/10 text-paper'
            : 'border-line-forte bg-painel-2 text-steel-400 hover:border-claro/25 hover:text-paper'
        }`}
      >
        <User className="size-5" strokeWidth={1.8} aria-hidden="true" />
      </button>

      {aberto ? (
        <div
          role="menu"
          aria-label="Conta"
          className="absolute right-0 top-[3.25rem] z-50 w-52 overflow-hidden rounded-lg border border-line bg-sidebar shadow-xl shadow-black/40"
        >
          <p className="border-b border-line px-4 py-3 font-display text-sm font-semibold text-paper">
            DG Motos BH
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAberto(false)
              onIrParaConfiguracoes()
            }}
            className={`foco-painel flex min-h-11 w-full items-center gap-3 px-4 text-sm transition-colors ${
              aba === 'configuracoes'
                ? 'text-paper'
                : 'text-steel-300 hover:bg-claro/[0.04] hover:text-paper'
            }`}
          >
            <Settings className="size-4 shrink-0 text-steel-500" aria-hidden="true" />
            <span className="flex-1 text-left">Configurações</span>
            {totalNaLixeira > 0 ? <SeloLixeira total={totalNaLixeira} /> : null}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAberto(false)
              onPedirSaida()
            }}
            className="foco-painel flex min-h-11 w-full items-center gap-3 border-t border-line px-4 text-sm text-steel-300 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="size-4 shrink-0 text-steel-500" aria-hidden="true" />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  )
}
