/**
 * Estilos de campo do painel — variante mobile minimalista.
 *
 * No celular, caixas com borda nos quatro lados viram "grade" visual:
 * muitos retângulos dentro de um cartão. A variante `campo-linha`
 * troca as caixas por um fundo contínuo com underline — a linha é o
 * único elemento gráfico, o texto respira. A partir de `sm` os inputs
 * (.input/.select do index.css) voltam ao normal, que é a densidade
 * certa para teclado e mouse.
 *
 * felt markup: uma classe só, aplicada no campo.
 */

export const campoLinha =
  'w-full border-0 border-b border-white/15 bg-transparent px-0 py-2.5 text-base text-paper ' +
  'placeholder:text-steel-600 transition-colors focus:border-brand-500 focus:outline-none ' +
  'focus:ring-0 rounded-none disabled:opacity-50'

/** Select na variante linha: herda a base sem as caixas. */
export const selectLinha =
  campoLinha +
  ' cursor-pointer appearance-none pr-8 bg-[length:1rem] bg-[right_center] bg-no-repeat ' +
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a7a7a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]"
