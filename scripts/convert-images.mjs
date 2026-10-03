/**
 * ============================================================
 * CONVERSOR DE IMAGENS — DG MOTOS
 * ============================================================
 * Converte as fotos da pasta `img/` para WebP otimizado e
 * publica em `public/motos/` (catálogo) e `public/` (hero e
 * favicon).
 *
 * Uso:
 *   npm run convert-images
 *
 * Quando o cliente enviar fotos novas, basta colocá-las em
 * img/ (mantendo os nomes) e rodar o comando de novo.
 */
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

// A pasta img/ pode conter tanto originais (.jpg/.png) quanto fotos já
// convertidas para WebP pelo scripts/convert-webp.py — ambas são aceitas.
const FONTE_VALIDA = /\.(jpe?g|png|webp)$/i

const ROOT = process.cwd()
const IMG_DIR = path.join(ROOT, 'img')
const MOTOS_DIR = path.join(ROOT, 'public', 'motos')

/** Fotos do catálogo: nome base em img/ -> pasta public/motos/<pasta>/<arquivo>.webp */
const CATALOGO = [
  { base: 'xre-300-2021', pasta: 'honda-xre-300-2021' },
  { base: 'lander-2024', pasta: 'yamaha-lander-2024' },
  { base: 'titan-2022', pasta: 'honda-titan-2022' },
  { base: 'start-2024', pasta: 'honda-start-2024' },
  { base: 'fazer-150-2020', pasta: 'yamaha-fazer-150-2020' },
]

const LARGURA_CATALOGO = 1280
const LARGURA_HERO = 1920
const QUALIDADE = 78

async function run() {
  const arquivos = await readdir(IMG_DIR)
  let convertidas = 0

  /** Converte um arquivo para WebP com largura máxima. */
  async function toWebp(entrada, saida, largura) {
    await sharp(entrada)
      .rotate() // respeita a orientação do EXIF
      .resize({ width: largura, withoutEnlargement: true })
      .webp({ quality: QUALIDADE })
      .toFile(saida)
  }

  // ---- Catálogo (fotos das motos) ----
  for (const item of CATALOGO) {
    const entrada = arquivos.find((a) => a.startsWith(item.base) && FONTE_VALIDA.test(a))
    if (!entrada) {
      console.warn(`AVISO: foto "${item.base}" não encontrada em img/ — usando placeholder.`)
      continue
    }

    const pastaDestino = path.join(MOTOS_DIR, item.pasta)
    await mkdir(pastaDestino, { recursive: true })

    // Foto principal (capa)
    await toWebp(
      path.join(IMG_DIR, entrada),
      path.join(pastaDestino, '01.webp'),
      LARGURA_CATALOGO,
    )
    convertidas++

    // Variações recortadas da mesma foto para a galeria ter ângulos
    // diferentes (crop automático com foco no assunto principal)
    const buffer = await sharp(path.join(IMG_DIR, entrada)).rotate().toBuffer()
    await sharp(buffer)
      .resize({ width: LARGURA_CATALOGO, height: 720, fit: 'cover', position: 'attention' })
      .webp({ quality: QUALIDADE })
      .toFile(path.join(pastaDestino, '02.webp'))
    await sharp(buffer)
      .resize({ width: 900, height: 900, fit: 'cover', position: 'attention' })
      .webp({ quality: QUALIDADE - 4 })
      .toFile(path.join(pastaDestino, '03.webp'))
    convertidas += 2

    console.log(`✔ ${entrada} -> public/motos/${item.pasta}/01-03.webp`)
  }

  // ---- Hero (showroom) ----
  const heroEntrada = arquivos.find((a) => a.startsWith('hero') && FONTE_VALIDA.test(a))
  if (heroEntrada) {
    await mkdir(path.join(ROOT, 'public', 'hero'), { recursive: true })
    await toWebp(
      path.join(IMG_DIR, heroEntrada),
      path.join(ROOT, 'public', 'hero', 'showroom.webp'),
      LARGURA_HERO,
    )
    convertidas++
    console.log(`✔ ${heroEntrada} -> public/hero/showroom.webp`)
  } else {
    console.warn('AVISO: hero-showroom não encontrado em img/.')
  }

  // ---- Favicon ----
  const faviconEntrada = arquivos.find((a) => a.startsWith('favicon') && /\.png$/i.test(a))
  if (faviconEntrada) {
    await sharp(path.join(IMG_DIR, faviconEntrada))
      .resize(64, 64, { fit: 'cover' })
      .webp({ quality: 90 })
      .toFile(path.join(ROOT, 'public', 'favicon.webp'))
    convertidas++
    console.log('✔ favicon.png -> public/favicon.webp')
  }

  console.log(`\nConcluído: ${convertidas} imagens geradas em public/.`)
}

run().catch((err) => {
  console.error('Falha na conversão:', err)
  process.exit(1)
})
