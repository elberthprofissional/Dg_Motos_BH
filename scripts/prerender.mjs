/**
 * ============================================================
 * PRERENDER DO CATÁLOGO
 * ============================================================
 *
 * Por que existe: com o catálogo vindo do Supabase, as páginas /moto/*
 * são renderizadas no navegador. O Google executa JavaScript, mas com
 * atraso e às vezes não executa — a ficha chegaria ao buscador vazia.
 *
 * Este script reage: antes do build, ele gera um HTML estático de cada
 * moto com preço, descrição e ficha técnica no conteúdo inicial. O
 * buscador (e o WhatsApp, que mostra a preview do link) leem o texto
 * completo sem rodar nada.
 *
 * Para o site funcionar sem Supabase configurado, ele cai no catálogo
 * de src/data/motorcycles.ts.
 *
 * Uso: npm run prerender   (roda sozinho depois do vite build)
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// O Vite carrega o .env sozinho, mas este script é executado pelo Node
// puro. Sem isto, o build local nunca veria as chaves do Supabase e cairia
// no catálogo estático sem avisar.
try {
  process.loadEnvFile()
} catch {
  // Sem arquivo .env: build com o fallback estático, como antes.
}

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const INDEX_HTML = path.join(DIST, 'index.html')
const SITE_TS = path.join(ROOT, 'src', 'data', 'site.ts')

/**
 * Lê as motos do Postgres pela API REST.
 *
 * Falha de rede não pode derrubar o build: nesse caso usamos o
 * catálogo estático, que é o mesmo fallback do site em runtime.
 */
async function motosDoBanco(url, key) {
  const resposta = await fetch(`${url}/rest/v1/motorcycles?select=*&disponibilidade=neq.vendida`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
  return resposta.json()
}

/**
 * Catálogo estático, importando o TypeScript direto.
 *
 * O Node 24 remove os tipos na execução, então não é preciso regex nem
 * um parser: o objeto já vem no formato exato do site.
 */
async function motosDoArquivo() {
  const mod = await import('../src/data/motorcycles.ts')
  return mod.motorcycles
}

/** Lê SITE_URL de src/data/site.ts (arquivo simples, sem tipos). */
async function lerSiteUrl() {
  const site = await readFile(SITE_TS, 'utf8')
  return site.match(/SITE_URL\s*=\s*'([^']+)'/)?.[1]?.replace(/\/+$/, '')
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Gera a URL absoluta de uma foto.
 *
 * Fotos do Supabase já vêm como URL completa (o app monta via
 * getPublicUrl), enquanto as do seed local vêm como caminho "/motos/...".
 * Sem isto, a imagem sairia "https://site.comhttps://supabase.co/...".
 */
function absoluta(base, src) {
  if (!src) return ''
  if (/^https?:\/\//.test(src)) return src
  return `${base}${src}`
}

/** Só fichas que ainda podem aparecer no site. */
function publicaveis(lista) {
  return (lista ?? []).filter((m) => m?.slug && m?.disponibilidade !== 'vendida')
}

/** "2021" ou uma data ISO do banco → "2021-03-15" (o que o Google prefere). */
function dataDePublicacao(moto) {
  if (moto.updated_at) return String(moto.updated_at).slice(0, 10)
  if (moto.criado_em) return String(moto.criado_em).slice(0, 10)
  return `${moto.ano}-03-15`
}

function fichaDe(moto, base) {
  const titulo = `${moto.marca} ${moto.modelo} ${moto.ano}`
  const preco = Number(moto.preco ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
  const url = `${base}/moto/${moto.slug}`
  const descricao = moto.descricao ?? ''
  const fotos = (moto.imagens ?? []).filter((i) => i?.src)

  const specs = (moto.especificacoes ?? [])
    .filter((s) => s?.label && s?.value)
    .map((s) => `<div><dt>${escapar(s.label)}</dt><dd>${escapar(s.value)}</dd></div>`)
    .join('')

  return {
    url,
    titulo,
    preco,
    descricao,
    fotos: fotos.map((i) => absoluta(base, i.src)),
    resumo: `${moto.marca} ${moto.modelo} ${moto.ano} seminova na DG Motos, Belo Horizonte. ${preco}.`,
    conteudo: `<article class="prerender">
  <h1>${escapar(titulo)}</h1>
  <p class="preco">${escapar(preco)}</p>
  <p class="ano">Ano ${escapar(moto.ano)}${moto.cilindrada ? ` · ${escapar(moto.cilindrada)} cc` : ''}${moto.quilometragem ? ` · ${escapar(moto.quilometragem)} km` : ''}</p>
  <p class="descricao">${escapar(descricao)}</p>
  ${specs ? `<dl class="especificacoes">${specs}</dl>` : ''}
  <p><a href="/contato">Falar com a loja</a> · <a href="/financiamento">Financiar</a></p>
</article>`,
  }
}

async function run() {
  let base
  try {
    base = await lerSiteUrl()
    if (!base) throw new Error('SITE_URL ausente em src/data/site.ts')
  } catch (e) {
    console.warn(`AVISO: ${e.message} — usando / como base nas URLs do prerender.`)
    base = ''
  }

  let motos
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      motos = await motosDoBanco(url, key)
      console.log(`Prerender: ${motos.length} motos vindas do Supabase.`)
    } catch (e) {
      console.warn(`AVISO: Supabase indisponível (${e.message}) — usando catálogo estático.`)
      motos = await motosDoArquivo()
    }
  } else {
    console.log('Prerender: sem chaves do Supabase, usando catálogo estático.')
    motos = await motosDoArquivo()
  }

  motos = publicaveis(motos)
  if (motos.length === 0) {
    console.warn('AVISO: nenhuma moto disponível — nada a prerenderizar.')
    return
  }

  const template = await readFile(INDEX_HTML, 'utf8')
  const fichas = []

  for (const moto of motos) {
    const ficha = fichaDe(moto, base)
    const titulo = `${escapar(ficha.titulo)} | DG Motos`
    const resumo = escapar(ficha.resumo)
    const imagem = ficha.fotos[0] ?? absoluta(base, '/hero/showroom.webp')

    // Mesmo formato do JSON-LD emitido em runtime por src/lib/schema.ts,
    // para o buscador ver exatamente a mesma coisa antes e depois do JS.
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Car',
      name: ficha.titulo,
      brand: { '@type': 'Brand', name: moto.marca },
      model: moto.modelo,
      vehicleModelDate: String(moto.ano),
      image: ficha.fotos,
      description: ficha.descricao,
      offers: {
        '@type': 'Offer',
        price: moto.preco,
        priceCurrency: 'BRL',
        availability:
          moto.disponibilidade === 'disponivel'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/PreOrder',
        itemCondition: 'https://schema.org/UsedCondition',
      },
    }

    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${titulo}</title>`)
      // As metas do index.html são multilinha; [\s\S] cobre as duas formas.
      .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${resumo}" />`)
      .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${titulo}" />`)
      .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${resumo}" />`)
      .replace(/<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${ficha.url}" />`)
      .replace(/<meta\s+property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${escapar(imagem)}" />`)
      // Canonical fixo: sem ele o Google pode tratar a ficha como
      // duplicata da listagem de /estoque.
      .replace('</head>', `<link rel="canonical" href="${ficha.url}" /></head>`)
      .replace('</head>', `<script type="application/ld+json">${JSON.stringify(ld)}</script></head>`)
      // O React reescreve #root ao montar; o crawler já leu o conteúdo.
      .replace('<div id="root"></div>', `<div id="root">${ficha.conteudo}</div>`)

    const dir = path.join(DIST, 'moto', moto.slug)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'index.html'), html, 'utf8')
    fichas.push({ loc: ficha.url, lastmod: dataDePublicacao(moto) })
  }

  // --- Sitemap ---
  const fixas = [
    { loc: `${base}/`, lastmod: null, priority: '1.0', freq: 'weekly' },
    { loc: `${base}/estoque`, lastmod: null, priority: '0.9', freq: 'daily' },
    ...fichas.map((f) => ({ ...f, priority: '0.8', freq: 'weekly' })),
    { loc: `${base}/financiamento`, lastmod: null, priority: '0.7', freq: 'monthly' },
    { loc: `${base}/troca`, lastmod: null, priority: '0.7', freq: 'monthly' },
    { loc: `${base}/sobre`, lastmod: null, priority: '0.6', freq: 'monthly' },
    { loc: `${base}/contato`, lastmod: null, priority: '0.6', freq: 'monthly' },
  ]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...fixas.map(
      (p) =>
        `  <url>\n    <loc>${escapar(p.loc)}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')

  await writeFile(path.join(DIST, 'sitemap.xml'), xml, 'utf8')

  // /admin fora do índice: a área restrita não deve ser rastreada.
  const robots = `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${base}/sitemap.xml\n`
  await writeFile(path.join(DIST, 'robots.txt'), robots, 'utf8')

  console.log(`\n✔ Prerender: ${fichas.length} fichas estáticas em dist/moto/`)
  console.log(`✔ sitemap.xml com ${fixas.length} URLs; robots.txt bloqueia /admin`)
}

run().catch((e) => {
  console.error('Falha no prerender:', e.message)
  process.exit(1)
})