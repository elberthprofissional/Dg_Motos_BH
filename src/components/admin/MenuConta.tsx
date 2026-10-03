import { Link } from 'react-router-dom'
import { ExternalLink, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/authContexto'

/**
 * Ações de conta que ficam no rodapé da sidebar e dentro da planilha do
 * "Menu" no celular.
 *
 * São as mesmas ações nos dois lugares, então vivem aqui: o dono que
 * aprendeu "sair está no rodapé do menu" não precisa descobrir de novo
 * quando estiver no celular.
 *
 * Configurações não entra nesta lista. Ela já é item de primeira classe
 * na navegação — duplicar a mesma tela em dois lugares só faz o dono
 * procurar onde salvou.
 */
export function MenuConta({ className = '' }: { className?: string }) {
  const { sessao, sair } = useAuth()

  return (
    <div className={className}>
      <p className="px-1 pb-2 text-[10px] font-semibold tracking-[0.18em] text-steel-600 uppercase">
        Conta
      </p>
      <Link
        to="/"
        className="item-linha foco-painel text-sm text-steel-300 hover:bg-white/5 hover:text-paper"
      >
        <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
        Ver o site
      </Link>
      <button
        type="button"
        onClick={() => void sair()}
        className="item-linha foco-painel text-sm text-steel-300 hover:bg-white/5 hover:text-paper"
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        Sair
      </button>
      <p
        className="mt-2 truncate px-1 text-[11px] text-steel-600"
        title={sessao?.user.email ?? undefined}
      >
        {sessao?.user.email ?? ''}
      </p>
    </div>
  )
}