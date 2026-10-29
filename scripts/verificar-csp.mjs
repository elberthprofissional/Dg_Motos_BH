/**
 * Confere o hash do script inline contra o CSP de produção.
 *
 * O `script-src` de vercel.json e public/_headers libera o script inline
 * do index.html por hash sha256. Se o texto do script mudar e o hash não
 * acompanhar, a página quebra só em produção — o dev server não aplica
 * esses cabeçalhos. Este script roda no CI para pegar a divergência
 * antes do deploy.
 *
 * Regra extra: o script inline precisa ficar numa linha só. O hash é
 * calculado sobre os bytes; Windows (CRLF) e Linux (LF) quebram linha
 * de formas diferentes e o mesmo código geraria hashes distintos.
 *
 * Uso: npm run csp
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const RAIZ = process.cwd()

async function ler(caminho) {
  return readFile(path.join(RAIZ, caminho), 'utf8')
}

/** Hash sha256 (base64) de cada <script> inline do HTML. */
function hashesDoHtml(html) {
  const hashes = []
  const semSrc = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi

  for (const [, conteudo] of html.matchAll(semSrc)) {
    if (!conteudo.trim()) continue
    if (/[\r\n]/.test(conteudo)) {
      throw new Error(
        'Script inline com quebra de linha: o hash muda entre CRLF (Windows) e LF (Linux). ' +
          'Coloque o script numa linha só.',
      )
    }
    hashes.push(`sha256-${createHash('sha256').update(conteudo, 'utf8').digest('base64')}`)
  }
  return hashes
}

/** Hashes 'sha256-…' citados numa política CSP. */
function hashesDaCsp(csp) {
  return [...csp.matchAll(/'sha256-[A-Za-z0-9+/=]+'/g)].map(([hash]) => hash.slice(1, -1))
}

function comparar(origem, csp, esperados) {
  const listados = hashesDaCsp(csp)
  const faltando = esperados.filter((hash) => !listados.includes(hash))
  const sobrando = listados.filter((hash) => !esperados.includes(hash))

  if (faltando.length === 0 && sobrando.length === 0) {
    console.log(`✔ ${origem}: ${esperados.length || 'nenhum'} hash(es) em dia.`)
    return true
  }

  console.error(`✖ ${origem} divergiu do index.html.`)
  for (const hash of faltando) console.error(`  falta:   ${hash}`)
  for (const hash of sobrando) console.error(`  sobra:   ${hash}`)
  console.error('  Copie o hash que falta para os dois arquivos e rode de novo.')
  return false
}

const html = await ler('index.html')
const esperados = hashesDoHtml(html)
console.log(`index.html: ${esperados.length} script(s) inline.`)

const vercel = JSON.parse(await ler('vercel.json'))
const cspVercel =
  vercel.headers
    ?.find((regra) => regra.source === '/(.*)')
    ?.headers?.find((header) => header.key === 'Content-Security-Policy')?.value ?? ''

const cabecalhos = await ler(path.join('public', '_headers'))
const cspNetlify =
  cabecalhos.match(/Content-Security-Policy:\s*(.+)/)?.[1]?.trim() ?? ''

let ok = true
if (!cspVercel) {
  console.error('✖ Content-Security-Policy não encontrado em vercel.json.')
  ok = false
} else {
  ok = comparar('vercel.json', cspVercel, esperados) && ok
}

if (!cspNetlify) {
  console.error('✖ Content-Security-Policy não encontrado em public/_headers.')
  ok = false
} else {
  ok = comparar('public/_headers', cspNetlify, esperados) && ok
  if (cspVercel && cspNetlify !== cspVercel) {
    console.error('✖ As duas políticas CSP deveriam ser idênticas (vercel.json e public/_headers).')
    ok = false
  }
}

if (!ok) process.exit(1)
console.log('CSP consistente entre index.html, vercel.json e public/_headers.')
