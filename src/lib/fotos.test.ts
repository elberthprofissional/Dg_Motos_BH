import { describe, expect, it } from 'vitest'
import { caminhoDeBucket, caminhoUnico, nomeSeguro } from './fotos'

const BASE = 'https://abc.supabase.co/storage/v1/object/public'
const bucket = (p: string) => `${BASE}/motos/${p}`

describe('nomeSeguro', () => {
  it('normaliza nome de celular para URL', () => {
    expect(nomeSeguro('IMG_0001.JPG')).toBe('img-0001')
    expect(nomeSeguro('Foto da Moto (1).png')).toBe('foto-da-moto-1')
  })

  it('nunca devolve string vazia', () => {
    expect(nomeSeguro('---')).toBe('foto')
    expect(nomeSeguro('')).toBe('foto')
  })
})

describe('caminhoDeBucket', () => {
  it('extrai o caminho da URL pública do Supabase', () => {
    expect(caminhoDeBucket(bucket('honda-xre-300-2021/01.webp'))).toBe(
      'honda-xre-300-2021/01.webp',
    )
  })

  it('devolve null para foto local do seed', () => {
    // Se devolvesse um caminho, o admin chamaria delete no Storage para um
    // arquivo que nunca foi upado.
    expect(caminhoDeBucket('/motos/honda-xre-300-2021/01.webp')).toBeNull()
  })

  it('devolve null para URL fora do padrão do bucket', () => {
    expect(caminhoDeBucket('https://exemplo.com/foto.webp')).toBeNull()
  })
})

describe('caminhoUnico', () => {
  const jaSubidas = [{ src: bucket('moto/img-0001.webp'), alt: '' }]

  it('mantém o caminho quando o nome está livre', () => {
    expect(caminhoUnico('moto/img-0002.webp', jaSubidas)).toBe('moto/img-0002.webp')
  })

  it('acrescenta sufixo quando duas fotos têm o mesmo nome', () => {
    // É o caso do donut de fotos do Android: nomes iguais, fotos distintas.
    expect(caminhoUnico('moto/img-0001.webp', jaSubidas)).toBe('moto/img-0001-2.webp')
  })

  it('pula o sufixo já usado', () => {
    const duas = [
      { src: bucket('moto/img-0001.webp'), alt: '' },
      { src: bucket('moto/img-0001-2.webp'), alt: '' },
    ]
    expect(caminhoUnico('moto/img-0001.webp', duas)).toBe('moto/img-0001-3.webp')
  })

  it('ignora fotos locais ao checar colisão', () => {
    // A foto do seed tem o mesmo nome, mas não ocupa espaço no Storage:
    // a nova upload pode usar o caminho sem medo de sobrescrever nada.
    const locais = [{ src: '/motos/moto/img-0001.webp', alt: '' }]
    expect(caminhoUnico('moto/img-0001.webp', locais)).toBe('moto/img-0001.webp')
  })
})