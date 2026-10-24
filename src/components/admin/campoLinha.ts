/**
 * Estilos de campo do painel — campos discretos sobre a bancada.
 *
 * Caixa escura chapada com fio fino: só a borda acende em `marca` no
 * foco. Sem sombra interna e sem glow — superfície de trabalho é
 * neutra até que algo peça atenção.
 */

export const campoLinha =
  'w-full border border-line bg-night-900/40 px-4 py-3 text-sm text-paper ' +
  'placeholder:text-steel-500 transition-colors outline-none ' +
  'focus:border-marca ' +
  'disabled:opacity-50'

/** Select na mesma família: herda a caixa e troca a seta nativa. */
export const selectLinha =
  campoLinha +
  ' cursor-pointer appearance-none pr-10 ' +
  'bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat ' +
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ada59a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]"
