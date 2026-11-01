/**
 * Helpers de marca para a vitrine.
 *
 * Separação proposital: funções puras em `lib`, componente em
 * `components`. Além do fast-refresh satisfeito, os helpers ficam
 * testáveis sem renderizar React.
 */

/** Caminho do arquivo de logo: Yamaha → /marcas/yamaha.webp. */
export function logoDaMarca(marca: string): string {
  const slug = marca
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
  return `/marcas/${slug}.webp`
}
