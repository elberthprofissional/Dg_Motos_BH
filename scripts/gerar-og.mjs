/**
 * Imagem de preview de link (Open Graph / WhatsApp) — 1200×630.
 *
 * Por que existe: o `og:image` antigo era a foto do showroom, que o
 * WhatsApp corta em 1.91:1 e mostrava um recorte sem sentido da moto.
 * Aqui a logo da marca vai centralizada sobre o preto da casa, no
 * formato que o WhatsApp exibe sem cortar nada.
 *
 * Rode com `npm run og` depois de trocar `public/logo.webp`.
 * Saída: `public/og-dgmotos.jpg` (JPEG, o formato que o rastreador do
 * WhatsApp/Facebook lê sem susto — WebP no og:image é instável).
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const LOGO = path.join(ROOT, 'public', 'logo.webp')
const SAIDA = path.join(ROOT, 'public', 'og-dgmotos.jpg')

/** Cores da marca (src/styles/tokens.css). */
const FUNDO = '#0e0f11'
const MARCA = '#d3240e'
const TEXTO_FRACO = '#8a8a96'

const LARGURA = 1200
const ALTURA = 630
/** Largura da arte já sem as bordas vazias da logo. */
const LARGURA_LOGO = 470
/** Onde a base da logo encosta — o resto abaixo é régua e cidade. */
const BASE_LOGO = 408

// `trim()` corta o padding transparente da logo, senão o quadrado de
// 512 px empurra a régua lá para baixo e sobra um vão sem sentido.
const logo = await sharp(LOGO).trim().resize({ width: LARGURA_LOGO }).png().toBuffer()
const { width: logoLargura, height: logoAltura } = await sharp(logo).metadata()

const logoX = (LARGURA - logoLargura) / 2
const logoY = BASE_LOGO - logoAltura

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}" viewBox="0 0 ${LARGURA} ${ALTURA}">
  <defs>
    <radialGradient id="brilho" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#202126"/>
      <stop offset="60%" stop-color="#141519"/>
      <stop offset="100%" stop-color="${FUNDO}"/>
    </radialGradient>
  </defs>
  <rect width="${LARGURA}" height="${ALTURA}" fill="url(#brilho)"/>
  <image x="${logoX}" y="${logoY}" width="${logoLargura}" height="${logoAltura}"
         href="data:image/png;base64,${logo.toString('base64')}"/>
  <rect x="${LARGURA / 2 - 44}" y="452" width="88" height="3" fill="${MARCA}"/>
  <text x="50%" y="510" text-anchor="middle" fill="${TEXTO_FRACO}"
        font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="600"
        letter-spacing="7">BELO HORIZONTE · MG</text>
</svg>`

const jpg = await sharp(Buffer.from(svg))
  .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toBuffer()

await writeFile(SAIDA, jpg)
const { size } = await sharp(SAIDA).metadata()
console.log(
  `og-dgmotos.jpg gerado: ${LARGURA}×${ALTURA}, ${(jpg.length / 1024).toFixed(1)} KB (${size ? 'ok' : 'sem metadados'})`,
)
