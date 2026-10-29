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
 *
 * Modo determinístico: `npm run prerender:estatico` (ou a variável
 * PRERENDER_OFFLINE=1) ignora o Supabase e usa o catálogo de
 * src/data/motorcycles.ts. Serve para gerar sempre o mesmo artefato,
 * mesmo com o banco ao vivo respondendo.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  bikeTitle,
  formatKm,
  formatPrice,
  precoEmConferencia,
  precoPareceIncompleto,
  precoRequerConfirmacao,
  resumoPublico,
} from '../src/lib/format.ts'
import { descricaoDe, gruposDaFicha } from '../src/lib/ficha.ts'
import { fichaDeReferencia } from '../src/data/fichasModelo.ts'

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
 * CSS mínimo da ficha pré-renderizada.
 *
 * O HTML estático fica no `#root` até o React montar. Sem estilo, o
 * visitante via um bloco de texto cru sobre fundo branco por um instante
 * (o fio de luz que a página evita). Este bloco cobre só o artigo do
 * prerender; o CSS completo assume no primeiro paint do React.
 */
const CRITICAL_CSS = `<style>
html,body{margin:0;background:#0f0e0c;color:#ece7de}
.prerender{max-width:42rem;margin:0 auto;padding:2rem 1.25rem;font-family:Lato,system-ui,sans-serif;line-height:1.6}
.prerender h1{margin:0;font-size:1.75rem;line-height:1.2;color:#fff}
.prerender h2{margin:1.75rem 0 .5rem;font-size:1.125rem;color:#fff}
.prerender .ano,.prerender .resumo{color:#a8a198}
.prerender .preco{margin:.75rem 0;font-size:1.5rem;font-weight:700;color:#f26d62}
.prerender .descricao{color:#ece7de}
.prerender .especificacoes{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));margin:0}
.prerender .especificacoes div{padding:.5rem 0;border-bottom:1px solid #2a2825}
.prerender dt{font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#8e887e}
.prerender dd{margin:0;color:#ece7de}
.prerender a{color:#f26d62}
</style>`

/**
 * Lê as motos do Postgres pela API REST.
 *
 * Falha de rede não pode derrubar o build: nesse caso usamos o
 * catálogo estático, que é o mesmo fallback do site em runtime.
 */
async function motosDoBanco(url, key) {
  // Colunas explícitas: o build não precisa (nem deve) baixar
  // custo_compra, dado interno do painel. O runtime usa a mesma lista —
  // os grants por coluna da 02 fecham o acesso à coluna para a API.
  const colunas = [
    'id',
    'slug',
    'marca',
    'modelo',
    'ano',
    'preco',
    'preco_antes',
    'em_promocao',
    'quilometragem',
    'cilindrada',
    'descricao',
    'especificacoes',
    'status',
    'created_at',
    'updated_at',
  ]
  const buscar = async (lista) => {
    const resposta = await fetch(
      `${url}/rest/v1/motorcycles?select=${lista.join(',')},motorcycle_images(src,alt,posicao)&status=eq.disponivel`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      },
    )
    if (!resposta.ok) {
      const detalhe = await resposta.text()
      throw new Error(`HTTP ${resposta.status}: ${detalhe.slice(0, 160)}`)
    }
    return resposta.json()
  }

  try {
    // A coluna da lixeira pode não existir em bancos que ainda não
    // rodaram o esquema atual (01); nesse caso a consulta acima
    // recebe 42703 e repetimos sem ela, como o catálogo em runtime.
    return await buscar([...colunas, 'lixeira_em'])
  } catch (erro) {
    if (!/lixeira_em/i.test(erro.message)) throw erro
    console.warn('AVISO: lixeira_em ausente no banco — consultando sem a coluna.')
    return buscar(colunas)
  }
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
  return (lista ?? []).filter(
    (m) => m?.slug && m?.status === 'disponivel' && !m?.lixeira_em,
  )
}

/**
 * Lista de fotos de uma moto, tolerando as duas formas:
 *   banco   → relationships em `motorcycle_images` (com posicao)
 *   estático → `imagens` de src/data/motorcycles.ts
 */
function fotosDe(moto) {
  if (Array.isArray(moto.motorcycle_images)) {
    return moto.motorcycle_images
      .filter((i) => i?.src)
      .sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0))
  }
  return (moto.imagens ?? []).filter((i) => i?.src)
}

/** "2021" ou uma data ISO do banco → "2021-03-15" (o que o Google prefere). */
function dataDePublicacao(moto) {
  if (moto.updated_at) return String(moto.updated_at).slice(0, 10)
  // O PostgREST devolve `created_at` (não `criado_em`).
  if (moto.created_at) return String(moto.created_at).slice(0, 10)
  return `${moto.ano}-03-15`
}

function fichaDe(moto, base) {
  const titulo = `${bikeTitle(moto)} ${moto.ano}`
  const precoNumero = Number(moto.preco ?? 0)
  const precoIncompleto = precoPareceIncompleto(precoNumero)
  const precoParaConferir = precoEmConferencia(precoNumero)
  const precoTexto = precoIncompleto
    ? 'Preço sob consulta'
    : formatPrice(precoNumero)
  const precoNota = precoIncompleto
    ? 'O valor desta unidade está em conferência na loja. Fale com a equipe para confirmar.'
    : precoRequerConfirmacao(precoNumero)
      ? 'Valor cadastrado. Confirme o preço com a loja antes de negociar.'
      : ''
  const url = `${base}/moto/${moto.slug}`
  const paragrafos = descricaoDe(moto)
  const descricao = paragrafos.join(' ')
  const fotos = fotosDe(moto)
  const referencia = fichaDeReferencia(moto)
  const lead =
    referencia?.resumo ??
    `${bikeTitle(moto)} ${moto.ano}${
      moto.quilometragem != null ? ` com ${formatKm(moto.quilometragem)}` : ''
    } no pátio da DG Motos, em Belo Horizonte.`
  const anoCilindrada = [
    String(moto.ano),
    moto.cilindrada ? `${moto.cilindrada} cc` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const gruposHtml = gruposDaFicha(moto)
    .map((grupo) => {
      const itens = grupo.itens.filter(
        (item) => item?.label?.trim() && item?.value?.trim(),
      )
      if (itens.length === 0) return ''
      const linhas = itens
        .map(
          (item) =>
            `<div><dt>${escapar(item.label)}</dt><dd>${escapar(item.value)}</dd></div>`,
        )
        .join('')
      return `<section><h2>${escapar(grupo.titulo)}</h2><dl class="especificacoes">${linhas}</dl></section>`
    })
    .filter(Boolean)
    .join('\n  ')

  return {
    url,
    titulo,
    preco: precoTexto,
    precoNumero,
    precoPublicavel: !precoParaConferir,
    descricao,
    fotos: fotos.map((i) => absoluta(base, i.src)),
    resumo: `${resumoPublico(moto)} ${precoTexto}.`,
    conteudo: `<article class="prerender">
  <h1>${escapar(titulo)}</h1>
  <p class="ano">${escapar(anoCilindrada)}</p>
  <p class="preco">${escapar(precoTexto)}</p>
  ${precoNota ? `<p>${escapar(precoNota)}</p>` : ''}
  <p class="resumo">${escapar(lead)}</p>
  ${paragrafos.map((paragrafo) => `<p class="descricao">${escapar(paragrafo)}</p>`).join('\n  ')}
  ${gruposHtml}
  <p><a href="/contato">Falar com a loja</a></p>
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
  // Build reproduzível: ignora o banco mesmo com chaves presentes.
  const modoEstatico =
    process.argv.includes('--estatico') ||
    /^(1|true|sim)$/i.test(process.env.PRERENDER_OFFLINE ?? '')

  if (url && key && !modoEstatico) {
    try {
      motos = await motosDoBanco(url, key)
      console.log(`Prerender: ${motos.length} motos vindas do Supabase.`)
    } catch (e) {
      console.warn(`AVISO: Supabase indisponível (${e.message}) — usando catálogo estático.`)
      motos = await motosDoArquivo()
    }
  } else {
    console.log(
      modoEstatico
        ? 'Prerender: modo estático forçado — usando src/data/motorcycles.ts.'
        : 'Prerender: sem chaves do Supabase, usando catálogo estático.',
    )
    motos = await motosDoArquivo()
  }

  motos = publicaveis(motos)
  if (motos.length === 0) {
    // Sem fichas o sitemap ainda precisa existir (robots.txt o anuncia);
    // sair aqui deixaria o site apontando para um sitemap 404.
    console.warn('AVISO: nenhuma moto disponível — gerando sitemap/robots sem fichas.')
  }

  const template = await readFile(INDEX_HTML, 'utf8')
  const fichas = []

  for (const moto of motos) {
    const ficha = fichaDe(moto, base)
    const titulo = `${escapar(ficha.titulo)} | DG Motos`
    const resumo = escapar(ficha.resumo)
    const imagem = ficha.fotos[0] ?? absoluta(base, '/hero/showroom-2026-07-hd.webp')

    // Mesmo formato do JSON-LD emitido em runtime por src/lib/schema.ts,
    // para o buscador ver exatamente a mesma coisa antes e depois do JS.
    // O `id` é o mesmo de useJsonLd: o React atualiza este bloco em vez
    // de acrescentar um segundo.
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Car',
      '@id': `${base}/moto/${moto.slug}#veiculo`,
      name: ficha.titulo,
      brand: { '@type': 'Brand', name: moto.marca },
      model: moto.modelo,
      vehicleModelDate: String(moto.ano),
      mileageFromOdometer:
        moto.quilometragem != null
          ? {
              '@type': 'QuantitativeValue',
              value: Number(moto.quilometragem),
              unitCode: 'KMT',
            }
          : undefined,
      vehicleEngine: moto.cilindrada
        ? { '@type': 'EngineSpecification', engineDisplacement: `${moto.cilindrada} cc` }
        : undefined,
      image: ficha.fotos,
      description: ficha.descricao || undefined,
      // Sem preço confiável não há Offer — mesmo critério de schema.ts.
      offers: ficha.precoPublicavel
        ? {
            '@type': 'Offer',
            price: ficha.precoNumero,
            priceCurrency: 'BRL',
            availability:
              moto.status === 'disponivel'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/SoldOut',
            itemCondition: 'https://schema.org/UsedCondition',
            seller: { '@id': `${base}/#loja` },
          }
        : undefined,
    }

    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${titulo}</title>`)
      // As metas do index.html são multilinha; [\s\S] cobre as duas formas.
      .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${resumo}" />`)
      .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${titulo}" />`)
      .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${resumo}" />`)
      .replace(/<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${ficha.url}" />`)
      .replace(/<meta\s+property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${escapar(imagem)}" />`)
      // Sem estilo crítico, o conteúdo pré-renderizado pisca sem
      // formatação entre o HTML e a montagem do React.
      .replace('</head>', `${CRITICAL_CSS}</head>`)
      // Canonical fixo: sem ele o Google pode tratar a ficha como
      // duplicata da listagem de /estoque.
      .replace('</head>', `<link rel="canonical" href="${ficha.url}" /></head>`)
      .replace('</head>', `<script type="application/ld+json" id="dgmotos-jsonld">${JSON.stringify(ld)}</script></head>`)
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