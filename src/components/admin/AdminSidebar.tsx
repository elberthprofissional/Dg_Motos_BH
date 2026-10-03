import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/authContexto'
import { ABAS, SECOES } from './tiposAdmin'
import type { AbaAdmin } from './tiposAdmin'
import { MenuConta } from './MenuConta'

function ItemMenu({
  valor,
  ativo,
  onNavegar,
  leadsRecentes,
}: {
  valor: AbaAdmin
  ativo: boolean
  onNavegar: (aba: AbaAdmin) => void
  leadsRecentes: number
}) {
  const secao = SECOES[valor]
  const Icone = secao.icone

  return (
    <li>
      <button
        type="button"
        onClick={() => onNavegar(valor)}
        aria-current={ativo ? 'page' : undefined}
        className={`item-linha foco-painel relative pr-3 pl-3.5 text-sm ${
          ativo
            ? 'bg-white/[0.07] font-semibold text-paper before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-brand-500'
            : 'text-steel-300 hover:bg-white/[0.04] hover:text-paper'
        }`}
      >
        <span className={ativo ? 'text-brand-500' : 'text-steel-500'}>
          <Icone aria-hidden="true" />
        </span>
        <span className="flex-1 truncate">{secao.rotulo}</span>
        {valor === 'clientes' && leadsRecentes > 0 && (
          <span className="rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-brand-500 tabular-nums">
            {leadsRecentes > 99 ? '99+' : leadsRecentes}
          </span>
        )}
      </button>
    </li>
  )
}

/**
 * Navegação do painel no desktop: sidebar fixa com as seis seções.
 *
 * Só existe a partir de `lg` (1024px). No celular quem navega é
 * `AdminBottomNav`, com quatro destinos — seis itens em duas linhas
 * ocupavam a tela inteira e não deixava espaço para o conteúdo.
 *
 * A largura de coluna que sobra num monitor largo é o que torna aceitável
 * ler os seis rótulos completos, sem abreviação.
 */
export function AdminSidebar({
  aba,
  onNavegar,
  leadsRecentes,
}: {
  aba: AbaAdmin
  onNavegar: (aba: AbaAdmin) => void
  leadsRecentes: number
}) {
  const { sessao } = useAuth()
  const inicial = (sessao?.user.email?.[0] ?? 'A').toUpperCase()

  return (
    <div className="flex h-full flex-col">
      {/* Identidade — alinhada com o ícone do primeiro item do menu */}
      <Link
        to="/"
        aria-label="DG Motos — ver o site"
        className="foco-painel flex items-center gap-3 rounded-md px-3.5 py-1 transition-colors hover:bg-white/[0.04]"
      >
        <img src="/logo.webp" alt="" width={36} height={36} className="size-9 object-contain" />
        <span className="min-w-0 leading-tight">
          <span className="block font-display text-base font-semibold tracking-[0.12em] text-paper uppercase">
            DG Motos
          </span>
          <span className="block text-[10px] tracking-[0.18em] text-steel-500 uppercase">
            Painel
          </span>
        </span>
      </Link>

      <nav className="mt-7" aria-label="Seções do painel">
        <ul className="space-y-0.5">
          {ABAS.map((valor) => (
            <ItemMenu
              key={valor}
              valor={valor}
              ativo={aba === valor}
              onNavegar={onNavegar}
              leadsRecentes={leadsRecentes}
            />
          ))}
        </ul>
      </nav>

      {/* Identidade + ações de conta no rodapé. No celular este bloco
          migra para dentro da planilha do "Menu" (MenuConta). */}
      <div className="mt-auto pt-6">
        <div className="mb-3 flex items-center gap-3 rounded-md border border-white/10 p-2.5">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-steel-200"
          >
            {inicial}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-semibold text-paper">
              Administrador
            </span>
            <span className="block truncate text-[11px] text-steel-500">
              {sessao?.user.email ?? 'Painel'}
            </span>
          </span>
        </div>
        <MenuConta />
      </div>
    </div>
  )
}