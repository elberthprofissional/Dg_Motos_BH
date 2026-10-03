import { useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { ABAS_BARRA, ABAS_MENU, SECOES } from './tiposAdmin'
import type { AbaAdmin } from './tiposAdmin'
import { MenuConta } from './MenuConta'

/**
 * Barra de navegação inferior do celular.
 *
 * ============================================================
 * POR QUÊ QUATRO ITENS E NÃO SEIS
 * ============================================================
 * A versão anterior mapeava as seis seções num grid de 3x2. Na prática
 * isso dava 88px de altura ocupados por menu antes de o conteúdo
 * aparecer, e os rótulos "Financeiro" e "Relatórios" ficavam ilegíveis
 * em 320px. Aqui são quatro destinos de uso diário — Painel, Estoque,
 * Clientes — mais "Menu", que abre as três seções de consulta.
 *
 * A regra que guia a escolha: o polegar alcança confortavelmente a
 * parte de baixo da tela, então fica ali o que o dono faz o dia inteiro.
 * Financeiro, Relatórios e Configurações são consultados com calma, e
 * é isso que o "Menu" manda para o segundo plano — sem tirar nenhuma
 * rota do painel.
 *
 * ============================================================
 * ACESSIBILIDADE
 * ============================================================
 * - `aria-current="page"` marca o destino ativo.
 * - A barra tem `role` de landmark via <nav aria-label>, e o item Menu
 *   é um <button> porque abre um diálogo, não navega.
 * - Safe area do iPhone é respeitada com `pb-[env(safe-area-inset-bottom)]`
 *   no rodapé da barra — sem isso o item mais baixo fica sob o gesto de
 *   "voltar".
 * - A altura é 3.5rem (56px), acima do mínimo de 44px recomendado.
 */
export function AdminBottomNav({
  aba,
  menuAberto,
  onNavegar,
  onAbrirMenu,
}: {
  aba: AbaAdmin
  /** Estado da planilha: o `aria-expanded` do item Menu precisa dele. */
  menuAberto: boolean
  onNavegar: (aba: AbaAdmin) => void
  onAbrirMenu: () => void
}) {
  const secaoAtual = SECOES[aba]
  const menuAtivo = ABAS_MENU.includes(aba)

  return (
    <nav
      aria-label="Navegação do painel"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-night-900 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex h-nav-painel items-stretch">
        {ABAS_BARRA.map((valor) => {
          const secao = SECOES[valor]
          const Icone = secao.icone
          const ativo = aba === valor
          return (
            <li key={valor} className="flex flex-1">
              <button
                type="button"
                onClick={() => onNavegar(valor)}
                aria-current={ativo ? 'page' : undefined}
                className={`nav-painel-item ${ativo ? 'text-paper' : 'text-steel-500'}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full transition-colors ${
                    ativo ? 'bg-brand-500' : 'bg-transparent'
                  }`}
                />
                <Icone className={ativo ? 'size-5 text-brand-500' : 'size-5'} aria-hidden="true" />
                <span className={ativo ? 'font-semibold' : ''}>{secao.curto}</span>
              </button>
            </li>
          )
        })}

        {/* Menu: abre a planilha com as seções de consulta e as ações
            de conta. É o quarto destino, não um quinto item de navegação. */}
        <li className="flex flex-1">
          <button
            type="button"
            onClick={onAbrirMenu}
            aria-expanded={menuAberto}
            aria-controls="admin-menu-planilha"
            className={`nav-painel-item ${menuAtivo ? 'text-paper' : 'text-steel-500'}`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full transition-colors ${
                menuAtivo ? 'bg-brand-500' : 'bg-transparent'
              }`}
            />
            <Menu className={menuAtivo ? 'size-5 text-brand-500' : 'size-5'} aria-hidden="true" />
            <span className={menuAtivo ? 'font-semibold' : ''}>Menu</span>
          </button>
        </li>
      </ul>

      {/* Rótulo do destino atual em leitor de tela — os quatro botões já
          são nomeados, mas isso amarra a barra à seção visível. */}
      <span className="sr-only" aria-live="polite">
        Seção atual: {secaoAtual.rotulo}
      </span>
    </nav>
  )
}

/**
 * Planilha inferior com as seções de consulta e as ações de conta.
 *
 * Preferida ao drawer lateral no celular por dois motivos práticos:
 * 1. os itens ficam na base da tela, onde o polegar já está;
 * 2. não cobre o conteúdo lateral, então o dono ainda vê em que seção
 *    está enquanto escolhe.
 *
 * O backdrop fecha ao toque e o Esc fecha pelo teclado — a Interaction
 * para teclado é tratada aqui e não no componente pai, para que a
 * Planilha se comporte corretamente mesmo montada isolada.
 */
export function AdminMenuPlanilha({
  aberto,
  aba,
  onFechar,
  onNavegar,
}: {
  aberto: boolean
  /** Seção visível no conteúdo: é o que marca "onde estou" na planilha. */
  aba: AbaAdmin
  onFechar: () => void
  onNavegar: (aba: AbaAdmin) => void
}) {
  const caixa = useRef<HTMLDivElement>(null)
  const primeiroBotao = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberto) return
    // Foco no primeiro item: quem abriu via teclado continua em contexto.
    primeiroBotao.current?.focus()

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onFechar()
        return
      }
      // Tab preso dentro da planilha enquanto ela estiver aberta.
      if (event.key !== 'Tab' || !caixa.current) return
      const focaveis = caixa.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div
      id="admin-menu-planilha"
      className="fixed inset-0 z-50 flex items-end lg:hidden"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onFechar}
        className="animate-fade absolute inset-0 bg-black/70"
      />
      <div
        ref={caixa}
        className="animate-sheet relative flex max-h-[80dvh] w-full flex-col rounded-t-xl border-t border-white/10 bg-night-900 pb-[env(safe-area-inset-bottom)]"
      >
        {/* Alça de arraste: sinal visual de que a planilha sobe. Não
            arrasta de verdade — quem fecha é o backdrop, o X ou o Esc. */}
        <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/15" />

        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="font-display text-base font-semibold tracking-wide text-paper uppercase">
            Menu
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            className="foco-painel -mr-1 rounded p-1.5 text-steel-400 transition-colors hover:text-paper"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Mais seções do painel">
          <ul className="space-y-0.5">
            {ABAS_MENU.map((valor, i) => {
              const secao = SECOES[valor]
              const Icone = secao.icone
              const ativo = aba === valor
              return (
                <li key={valor}>
                  <button
                    ref={i === 0 ? primeiroBotao : undefined}
                    type="button"
                    onClick={() => {
                      onNavegar(valor)
                      onFechar()
                    }}
                    aria-current={ativo ? 'page' : undefined}
                    className={`item-linha foco-painel ${
                      ativo
                        ? 'bg-white/[0.07] text-paper'
                        : 'text-steel-300 hover:bg-white/[0.04] hover:text-paper'
                    }`}
                  >
                    <span className={ativo ? 'text-brand-500' : 'text-steel-500'}>
                      <Icone className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{secao.rotulo}</span>
                      <span className="block truncate text-[11px] text-steel-500">
                        {secao.descricao}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 border-t border-white/10 pt-3">
            <MenuConta />
          </div>
        </nav>
      </div>
    </div>
  )
}