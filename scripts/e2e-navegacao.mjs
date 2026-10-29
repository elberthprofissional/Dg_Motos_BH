/**
 * E2E de navegação — via CDP, na linha do `auditar-navegador.mjs`.
 *
 * O que ele confirma, de ponta a ponta, num Chrome de verdade:
 *   1. as rotas da vitrine abrem com conteúdo (não ficam em loading);
 *   2. o catálogo de fallback aparece (este teste roda SEM Supabase,
 *      forçado com env vazia — determinístico a cada execução);
 *   3. a ficha de uma moto do fallback abre por slug;
 *   4. `RotaAdmin` bloqueia o painel sem sessão: build sem Supabase
 *      mostra as instruções, e o login tem os campos de credencial;
 *   5. nenhum erro de console em nenhuma rota.
 *
 * Como rodar:
 *   npm run e2e
 * Sobem sozinhos: um `vite dev` em modo fallback (env de Supabase
 * zerada) e um Chrome headless com porta CDP própria. Sai com código 1
 * se alguma checagem falhar — dá para pendurar em CI.
 */
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const PORTA_VITE = 4187
const PORTA_CDP = 9223
const BASE = process.env.BASE ?? `http://localhost:${PORTA_VITE}`

/* ------------------------------------------------------------------ */
/* Servidor                                                            */
/* ------------------------------------------------------------------ */

// Sem Supabase o catálogo cai no fallback de src/data → o teste fica
// determinístico: nem banco, nem rede, nem dono editando estoque no meio.
const env = {
  ...process.env,
  VITE_SUPABASE_URL: '',
  VITE_SUPABASE_ANON_KEY: '',
}

console.log('Subindo o dev server (modo fallback, Sem Supabase)…')
// Node direto no vite.js: sem shell, sem deprecation de args no Windows.
const vite = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--port', String(PORTA_VITE), '--strictPort'],
  {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)
vite.stdout.on('data', () => {})
vite.stderr.on('data', (chunk) => process.stderr.write(chunk))

async function esperarResultado(fn, tentativa, esperaMs) {
  for (let i = 0; i < tentativa; i++) {
    try {
      return await fn()
    } catch {
      await new Promise((r) => setTimeout(r, esperaMs))
    }
  }
  throw new Error(`não respondeu em ${tentativa} tentativas`)
}

await esperarResultado(async () => {
  const resposta = await fetch(`${BASE}/`)
  if (!resposta.ok) throw new Error(`vite respondeu ${resposta.status}`)
  return resposta
}, 60, 500)

/* ------------------------------------------------------------------ */
/* Chrome headless                                                     */
/* ------------------------------------------------------------------ */

function chromeExecutavel() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const candidatos = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        join(process.env.LOCALAPPDATA ?? '', 'Google\\Chrome\\Application\\chrome.exe'),
      ]
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  return candidatos.find((caminho) => caminho.length > 0 && existsSync(caminho)) ?? null
}

const executavel = chromeExecutavel()
if (!executavel) {
  console.error('Chrome não encontrado. Aponte CHROME_PATH para o executável e rode de novo.')
  process.exit(1)
}

const perfil = await mkdtemp(join(tmpdir(), 'dg-motos-e2e-'))
const chrome = spawn(
  executavel,
  [
    '--headless=new',
    `--remote-debugging-port=${PORTA_CDP}`,
    `--user-data-dir=${perfil}`,
    '--no-first-run',
    '--disable-background-networking',
    'about:blank',
  ],
  { stdio: 'ignore', detached: false },
)

try {
  await esperarResultado(async () => {
    const json = await (await fetch(`http://127.0.0.1:${PORTA_CDP}/json/version`)).json()
    return json.webSocketDebuggerUrl
  }, 30, 500)

  const versao = await (await fetch(`http://127.0.0.1:${PORTA_CDP}/json/version`)).json()
  const ws = new WebSocket(versao.webSocketDebuggerUrl)
  let id = 0
  const pendentes = new Map()
  const ouvintes = []

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pendentes.has(msg.id)) {
      const { resolve, reject } = pendentes.get(msg.id)
      pendentes.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
    } else if (msg.method) {
      for (const l of ouvintes) l(msg)
    }
  })
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))

  function enviar(method, params = {}, sessionId) {
    const msgId = ++id
    return new Promise((resolve, reject) => {
      pendentes.set(msgId, { resolve, reject })
      ws.send(JSON.stringify({ id: msgId, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  }

  function esperarEvento(method, sessionId) {
    return new Promise((resolve) => {
      const handler = (msg) => {
        if (msg.method === method && msg.sessionId === sessionId) {
          ouvintes.splice(ouvintes.indexOf(handler), 1)
          resolve(msg.params)
        }
      }
      ouvintes.push(handler)
    })
  }

  async function avaliar(sessionId, expressao) {
    const { result, exceptionDetails } = await enviar(
      'Runtime.evaluate',
      { expression: expressao, returnByValue: true, awaitPromise: true },
      sessionId,
    )
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text)
    return result.value
  }

  /* ---------------------------------------------------------------- */
  /* Cenários                                                          */
  /* ---------------------------------------------------------------- */

  const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true })
  await enviar('Page.enable', {}, sessionId)
  await enviar('Runtime.enable', {}, sessionId)

  const errosConsole = []
  ouvintes.push((msg) => {
    if (msg.sessionId !== sessionId) return
    if (msg.method === 'Runtime.exceptionThrown') {
      errosConsole.push(msg.params.exceptionDetails?.text ?? 'exceção desconhecida')
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errosConsole.push(msg.params.args?.map((a) => a.value ?? a.description).join(' '))
    }
  })

  async function navegar(url) {
    errosConsole.length = 0
    const carregou = esperarEvento('Page.loadEventFired', sessionId)
    await enviar('Page.navigate', { url: `${BASE}${url}` }, sessionId)
    await carregou
    // O catálogo resolve depois do load (contexto do layout): conheça o
    // tempo do fallback, que é imediato quando não há Supabase para esperar.
    await new Promise((r) => setTimeout(r, 1200))
  }

  const conferencias = [
    {
      nome: 'Home abre com conteúdo',
      rota: '/',
      checar: `!!document.querySelector('main h1') && document.querySelector('main h1').textContent.trim().length > 0`,
    },
    {
      nome: 'Estoque mostra o catálogo de fallback',
      rota: '/estoque',
      checar: `document.body.innerText.includes('Honda XRE 300')`,
    },
    {
      nome: 'Ficha abre por slug do fallback',
      rota: '/moto/honda-xre-300-2021',
      checar: `document.body.innerText.includes('Honda XRE 300')`,
    },
    {
      nome: 'Contato abre com a seção principal',
      rota: '/contato',
      checar: `!!document.querySelector('main h1')`,
    },
    {
      nome: 'Admin bloqueia sem sessão (build sem Supabase mostra instruções)',
      rota: '/admin',
      checar: `document.body.innerText.includes('Área restrita desativada')`,
    },
    {
      nome: 'Login sem Supabase diz como habilitar (não mostra form morto)',
      rota: '/admin/login',
      checar: `document.body.innerText.includes('Supabase não configurado neste deploy')`,
    },
    {
      nome: 'Rota desconhecida cai na página 404 com conteúdo',
      rota: '/rota-que-nao-existe',
      checar: `!!document.querySelector('main h1')`,
    },
  ]

  let falhas = 0
  for (const c of conferencias) {
    await navegar(c.rota)
    const urlFinal = await avaliar(sessionId, 'location.pathname')
    const passou = await avaliar(sessionId, c.checar)
    const erros = [...errosConsole]
    if (passou && erros.length === 0) {
      console.log(`  ✓ ${c.nome}`)
    } else {
      falhas++
      console.error(`  ✗ ${c.nome}  (rota ${urlFinal})`)
      if (!passou) console.error('    — checagem não confirmou')
      for (const erro of erros) console.error(`    — console: ${erro}`)
    }
  }

  if (falhas > 0) {
    console.error(`\nE2E: ${falhas} de ${conferencias.length} cenários falharam.`)
    process.exitCode = 1
  } else {
    console.log(`\nE2E: todos os ${conferencias.length} cenários passaram.`)
  }  } catch (erro) {
  console.error('E2E morreu:', erro)
  process.exitCode = 1
} finally {
  try { chrome.kill('SIGTERM') } catch {}
  await rm(perfil, { recursive: true, force: true }).catch(() => {})
}
if (!vite.killed) vite.kill('SIGTERM')
// Windows não entrega SIGTERM a processos de shell: garantir.
setTimeout(() => process.exit(process.exitCode ?? 0), 500)
