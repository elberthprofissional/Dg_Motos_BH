/**
 * Estilos de campo do painel — inputs modernos estilo SaaS.
 *
 * Caixa escura translúcida com foco vermelho: borda fina que acende
 * em `brand` quando o campo recebe o foco, transição suave e inset
 * discreto. Os campos são a superfície de trabalho do dono — neutros,
 * até que algo peça atenção.
 */

export const campoLinha =
  'w-full rounded-xl border border-neutral-800 bg-black/60 px-4 py-3 text-sm text-white ' +
  'placeholder:text-neutral-500 shadow-inner transition-all outline-none ' +
  'focus:border-red-600 focus:ring-1 focus:ring-red-600/50 ' +
  'disabled:opacity-50'

/** Select na variante SaaS: herda a caixa e troca a seta nativa. */
export const selectLinha =
  campoLinha +
  ' cursor-pointer appearance-none pr-10 ' +
  'bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat ' +
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]"
