import { BUCKET_FOTOS } from './supabase'

/**
 * Regras de nome de arquivo e caminho do bucket.
 *
 * Ficam fora do componente porque são funções puras — testáveis sem
 * React e sem DOM, e o PhotoUploader precisa exportá-las para o teste,
 * o que quebraria o Fast Refresh se estivessem no mesmo arquivo.
 */

export interface FotoSaida {
  src: string
  alt: string
}

/** Nome de arquivo seguro, sem acento nem espaço. */
export function nomeSeguro(nome: string): string {
  const base = nome
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'foto'
}

/**
 * Extrai o caminho dentro do bucket a partir da URL pública.
 *
 * A URL do Supabase é ".../object/public/<bucket>/<caminho>", então o nome
 * do bucket é removido e sobra só "slug/foto.webp", que é a chave usada
 * no upload e no delete.
 *
 * Devolve `null` para foto local (`/motos/...` do seed), que não existe no
 * Storage — é o que evita uma chamada de delete inútil.
 */
export function caminhoDeBucket(src: string): string | null {
  if (!src.startsWith('http')) return null
  const marcador = `/object/public/${BUCKET_FOTOS}/`
  const i = src.indexOf(marcador)
  if (i === -1) return null
  return src.slice(i + marcador.length)
}

/**
 * Evita que duas fotos com o mesmo nome se sobrescrevam.
 *
 * Fotos de celular quase sempre vêm como "IMG_0001.jpg", "IMG_0002.jpg",
 * e o seletor de fotos do Android gera o mesmo nome para duas fotos
 * diferentes. Sem o sufixo, a segunda upload calava a primeira sem aviso
 * (o upsert sobrescreve). Aqui a segunda vira "img-0001-2.webp".
 */
export function caminhoUnico(caminho: string, existentes: FotoSaida[]): string {
  const ocupados = new Set(
    existentes.map((f) => caminhoDeBucket(f.src)).filter((c): c is string => c !== null),
  )
  if (!ocupados.has(caminho)) return caminho

  const ponto = caminho.lastIndexOf('.')
  const base = caminho.slice(0, ponto)
  const extensao = caminho.slice(ponto + 1)
  let n = 2
  while (ocupados.has(`${base}-${n}.${extensao}`)) n++
  return `${base}-${n}.${extensao}`
}