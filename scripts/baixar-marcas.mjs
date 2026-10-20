import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const UA = 'DgMotosLogoFetcher/1.0 (projeto local; contato: dev@local)'
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

// slug segue logoDaMarca() de src/lib/marcas.ts
const ALVOS = [
  { slug: 'honda', candidatos: ['commons.wikimedia.org::File:Honda Logo.svg', 'en.wikipedia.org::File:Honda-logo.svg'] },
  { slug: 'yamaha', candidatos: ['en.wikipedia.org::File:Yamaha Motor logo.svg', 'commons.wikimedia.org::File:Yamaha logo text.svg'] },
  { slug: 'suzuki', candidatos: ['commons.wikimedia.org::File:Suzuki Motor Corporation logo.svg', 'commons.wikimedia.org::File:Suzuki logo 2025.svg'] },
  { slug: 'kawasaki', candidatos: ['commons.wikimedia.org::File:Kawasaki Motors logo.svg', 'commons.wikimedia.org::File:Kawasaki-logo.svg'] },
  { slug: 'dafra', candidatos: ['en.wikipedia.org::File:Dafra Logo.png'] },
  { slug: 'tvs', candidatos: ['commons.wikimedia.org::File:TVS logo (2024).png', 'en.wikipedia.org::File:TVS logo (2024).png'] },
  { slug: 'royal-enfield', candidatos: ['commons.wikimedia.org::File:Royal Enfield logo new.svg'] },
  { slug: 'bmw', candidatos: ['commons.wikimedia.org::File:BMW.svg', 'en.wikipedia.org::File:BMW logo (gray).svg'] },
  { slug: 'ktm', candidatos: ['en.wikipedia.org::File:KTM-Logo.svg'] },
  { slug: 'ducati', candidatos: ['commons.wikimedia.org::File:Ducati red logo.svg', 'en.wikipedia.org::File:Logo Ducati.svg'] },
  // A oficial é preta e some no disco escuro do site — a laranja vem
  // primeiro de propósito. Trocar a ordem troca o resultado.
  { slug: 'harley-davidson', candidatos: ['commons.wikimedia.org::File:Harley Davidson orange logo.svg', 'commons.wikimedia.org::File:Harley-Davidson logo.svg'] },
  { slug: 'motomel', candidatos: ['commons.wikimedia.org::File:Motomel logo azul-fondo blanco.png'] },
  { slug: 'gilera', candidatos: ['commons.wikimedia.org::File:Gilera Logo.svg', 'en.wikipedia.org::File:Gilera logo.svg'] },
  { slug: 'zanella', candidatos: ['en.wikipedia.org::File:Zanella logo.png', 'en.wikipedia.org::File:Zanella2022.png'] },
  // Shineray: sem logo nos wikis. vem do site oficial; a versão "final"
  // é vermelho-escuro (invisível no disco), a outra é clara.
  { slug: 'shineray', candidatos: ['https://www.shineray.com.br/wp-content/uploads/2023/04/logo_shineray.png'] },
]

async function api(host, params) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`
  for (let t = 0; t < 5; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.ok) return r.json()
    if (r.status === 429) { await dormir(8000 * (t + 1)); continue }
    throw new Error(`${host} ${r.status}`)
  }
  throw new Error('429 persistente')
}

async function infoImagem(host, titulo) {
  const { query } = await api(host, {
    action: 'query', titles: titulo, prop: 'imageinfo',
    iiprop: 'url|mime|size', iiurlwidth: '1024',
  })
  const pagina = Object.values(query.pages)[0]
  const info = pagina?.imageinfo?.[0]
  if (!info) return null
  return { url: info.thumburl ?? info.url, mime: info.thumbmime ?? info.mime, original: info.url }
}

async function baixar(url) {
  for (let t = 0; t < 4; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.ok) return Buffer.from(await r.arrayBuffer())
    if (r.status === 429) { await dormir(8000 * (t + 1)); continue }
    throw new Error(`download ${r.status}`)
  }
  throw new Error('download 429')
}

const dirSaida = path.resolve(process.argv[2] ?? 'public/marcas')
await mkdir(dirSaida, { recursive: true })

for (const { slug, candidatos } of ALVOS) {
  let feito = false
  for (const candidato of candidatos) {
    try {
      // Candidato pode ser URL direta (sites oficiais) ou host::File:...
      const direto = candidato.startsWith('http')
      const [host, titulo] = direto ? [null, candidato] : candidato.split('::')

      let urlFonte
      if (direto) {
        urlFonte = candidato
      } else {
        const info = await infoImagem(host, titulo)
        await dormir(3000)
        if (!info) { console.log(`  ${slug}: ${titulo} nao existe`); continue }
        urlFonte = info.url
      }

      const buf = await baixar(urlFonte)
      await dormir(3000)

      const img = sharp(buf, { failOn: 'none' })
      const meta = await img.metadata()
      const largura = Math.min(meta.width ?? 512, 512)

      await img
        .resize({ width: largura, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(path.join(dirSaida, `${slug}.webp`))

      console.log(`  ok ${slug} <- ${host ? titulo : 'url direta'} (${meta.width}x${meta.height} ${meta.format})`)
      feito = true
      break
    } catch (e) {
      console.error(`  falhou ${slug} <- ${candidato}: ${e.message}`)
      await dormir(3000)
    }
  }
  if (!feito) console.log(`  FALTOU ${slug}`)
}

console.log('\npronto:', dirSaida)
