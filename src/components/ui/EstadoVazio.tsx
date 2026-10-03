import type { ReactNode } from 'react'

/**
 * Estado vazio / sem resultado.
 *
 * O painel tem cinco listas que podem ficar vazias (estoque, leads,
 * atividade do dono, resultados de filtro). Todas respondem a mesma
 * pergunta — "por que estou vendo nada?" — então a resposta tem o mesmo
 * formato: ícone discreto, o que aconteceu em uma linha e, quando faz
 * sentido, a ação que resolve.
 *
 * Nunca há ilustração nem número inventado: se não existe dado, a tela
 * diz isso e oferece o próximo passo.
 *
 * ============================================================
 * `compacto`
 * ============================================================
 * A versão completa (py-12, ícone 44px) serve para uma página inteira
 * sem resultado — Estoque vazio, Clientes sem contato. Mas dentro de um
 * card do painel ela comia a tela: o bloco "últimos leads" do Dashboard
 * tem pouco mais que um terço da altura do celular, e 96px de padding
 * deixava a seção parecendo um buraco.
 *
* `compacto` reduz para py-7 e ícone 36px. O texto continua o mesmo —
 * encurtar a descrição para ganhar espaço esconderia a informação que o
 * dono precisa para decidir o que fazer.
 */
export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acao,
  className = '',
  compacto = false,
}: {
  icone: ReactNode
  titulo: string
  descricao: string
  acao?: ReactNode
  className?: string
  /** Versão reduzida para usar dentro de um card, não como página. */
  compacto?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        compacto ? 'px-4 py-7' : 'px-6 py-12'
      } ${className}`}
      role="note"
    >
      <span
        aria-hidden="true"
        className={`grid place-items-center rounded-lg border border-white/10 bg-white/5 text-steel-500 ${
          compacto ? 'size-9' : 'size-11'
        }`}
      >
        {icone}
      </span>
      <p className="mt-3.5 font-display text-sm font-semibold tracking-wide text-steel-300 uppercase">
        {titulo}
      </p>
      <p
        className={`mt-1.5 leading-relaxed text-steel-500 ${
          compacto ? 'max-w-[36ch] text-xs' : 'max-w-sm text-sm'
        }`}
      >
        {descricao}
      </p>
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}