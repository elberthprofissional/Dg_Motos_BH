/**
 * O aparelho consegue fotografar na hora?
 *
 * `pointer: coarse` é o sinal mais próximo de "celular ou tablet": no
 * desktop o `<input capture>` é ignorado e abriria o mesmo seletor de
 * arquivos, então o botão "Tirar foto" só aparece onde ele faz algo de
 * verdade. Roda no navegador — durante o prerender devolve `false`.
 */
export function temCameraNaHora(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(pointer: coarse)').matches
}
