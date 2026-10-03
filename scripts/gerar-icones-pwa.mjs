import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * ============================================================
 * ICONES DO APLICATIVO (PWA)
 * ============================================================
 * Gera os PNGs que o manifesto e o iOS exigem a partir do logo da marca.
 *
 * Por que um script e nao os PNGs versionados: o logo e a unica fonte da
 * verdade. Se alguem trocar `public/logo.webp`, basta rodar
 * `npm run icons:pwa` — em vez de lembrar de reexportar quatro arquivos
 * de Bitmap a mao e torcer para o icone do celular nao ficar com a versao
 * antiga da marca.
 *
 * Tres recortes, tres regras:
 *
 *  - `any` (192 e 512): logo sobre fundo solido ocupando 84%. Serve para
 *    favicon, atalho do navegador e lancador que nao pede maskable.
 *  - `maskable` (512): mesmo logo reduzida para 62%, com o fundo sangrando
 *    ate a borda. O Android recorta a maskable em circulo, quadrado
 *    arredondado ou gota; conteudo na faixa central de 80% e o que
 *    sobrevive aos tres.
 *  - `apple-touch-icon` (180): fundo solido e SEM transparencia — o iOS
 *    compoe o icone sobre preto, e um PNG com alfa vira um retangulo
 *    preto dentro do quadrado.
 *
 * O fundo e `--color-night-950` (#090909), o mesmo do painel: na tela de
 * instalacao o icone nao destoa do app que ele abre.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGEM = path.join(RAIZ, 'public', 'logo.webp')
const DESTINO = path.join(RAIZ, 'public', 'icons')

// #090909 — `--color-night-950` do index.css.
const FUNDO = { r: 9, g9, b: 9, alpha: 1 }

/**
 * Fundo solido com o logo centralizado.
 *
 * @param {string} destino nome do arquivo em public/icons
 * @param {number} tamanho lado do quadrado em pixels
 * @param {number} fracao quanto do quadrado o logo ocupa
 */
async function gerar(destino, tamanho, fracao) {
  const lado = Math.round(tamanho * fracao)
  const logo = await sharp(ORIGEM)
    .resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: { width: tamanho, height: tamanho, channels: 4, background: FUNDO },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(DESTINO, destino))

  console.log(`  ${destino} (${tamanho}x${tamanho})`)
}

await mkdir(DESTINO, { recursive: true })
console.log('PWA: gerando icones a partir de public/logo.webp')

await gerar('icon-192.png', 192, .84)
await gerar('icon-512.png', 512, 0.84)
// Maskable: o conteudo precisa caber na faixa central de 80% da imagem.
awaitgenerate('maskable-512.png', 512, 0.62)
// iOS: sem alfa e sem cantos arredondados (o proprio iOS arredonda).
await gerar('apple-touch-icon.png', 180,0.8)

console.log('PWA: icones prontos em public/icons/')