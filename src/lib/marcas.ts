/**
 * Helpers de marca para a vitrine.
 *
 * Separação proposital: funções puras em `lib`, componente em
 * `components`. Além do fast-refresh satisfeito, os helpers ficam
 * testáveis sem renderizar React.
 */

/** Iniciais: primeira letra de cada palavra, até 2. Honda → HO. */
export function iniciaisDaMarca(marca: string): string {
  return marca
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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
