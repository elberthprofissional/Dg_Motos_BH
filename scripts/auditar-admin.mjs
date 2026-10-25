/**
 * Auditoria do painel no celular: abas, formulário de moto e editor de post,
 * com sessão e dados simulados (o banco não é tocado).
 */
const CDP = 'http://127.0.0.1:9222'
const BASE = 'http://localhost:5173'
const REF = 'fqnbcrgdhdjvpbxogvyf'
const L = 390
const { writeFileSync, mkdirSync } = await import('node:fs')

const v = await (await fetch(`${CDP}/json/version`)).json()
const ws = new WebSocket(v.webSocketDebuggerUrl)
let id = 0
const pend = new Map()
const ls = []
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) {
    const p = pend.get(m.id)
    pend.delete(m.id)
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
  } else if (m.method) for (const l of ls) l(m)
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const i = ++id
    pend.set(i, { resolve, reject })
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
function esperarCarregar(sessionId) {
  return new Promise((resolve) => {
    const h = (msg) => {
      if (msg.method === 'Page.loadEventFired' && msg.sessionId === sessionId) {
        ls.splice(ls.indexOf(h), 1)
        resolve()
      }
    }
    ls.push(h)
  })
}

const moto = (id, modelo, ano, status, preco, extra = {}) => ({
  id, slug: id, marca: 'Honda', modelo, ano, preco, quilometragem: 52000, cilindrada: 291,
  categoria: 'street', descricao: 'Moto revisada.', especificacoes: [], created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-10-20T10:00:00Z', motorcycle_images: [], status, ...extra,
})
const MOTOS = [
  moto('m1', 'XRE 300 VERDE', 2026, 'vendida', 23900),
  moto('m2', 'XRE Rally 300', 2023, 'disponivel', 30900),
  moto('m3', 'XRE Rally 300', 2019, 'disponivel', 27900),
]
const ENTREGAS = []

ls.push((msg) => {
  if (msg.method !== 'Fetch.requestPaused') return
  const { requestId, request } = msg.params
  const s = msg.sessionId
  const responder = (corpo) =>
    send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [
        { name: 'content-type', value: 'application/json' },
        { name: 'access-control-allow-origin', value: '*' },
      ],
      body: Buffer.from(JSON.stringify(corpo)).toString('base64'),
    }, s)
  if (request.method === 'GET' && request.url.includes('/rest/v1/motorcycles')) return void responder(MOTOS)
  if (request.method === 'GET' && request.url.includes('/rest/v1/entregas')) return void responder(ENTREGAS)
  if (request.method === 'GET' && request.url.includes('/rest/v1/site_config')) return void responder([])
  if (request.method === 'GET' && request.url.includes('/rest/v1/')) return void responder([])
  void send('Fetch.continueRequest', { requestId }, s)
})

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Fetch.enable', {
  patterns: [{ urlPattern: '*rest/v1/*', requestStage: 'Request' }],
}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: L, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId)
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId)
const sessao = {
  access_token: 'fake', token_type: 'bearer', expires_in: 36000,
  expires_at: Math.floor(Date.now() / 1000) + 36000, refresh_token: 'fake',
  user: { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'dono@dgmotos.test', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
}
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { localStorage.setItem('sb-${REF}-auth-token', ${JSON.stringify(JSON.stringify(sessao))}) } catch {}`,
}, sessionId)
const carregou = esperarCarregar(sessionId)
await send('Page.navigate', { url: `${BASE}/admin` }, sessionId)
await carregou
await new Promise((r) => setTimeout(r, 2500))
mkdirSync('.taste-skill/inspect', { recursive: true })

const espera = (ms) => new Promise((r) => setTimeout(r, ms))
async function avaliar(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
  if (r.exceptionDetails) return { erro: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text }
  return r.result.value
}
let falhas = 0
function checar(nome, ok, detalhe = '') {
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? ' — ' + detalhe : ''}`)
  if (!ok) falhas++
}
async function foto(nome) {
  const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
  writeFileSync(`.taste-skill/inspect/admin-${nome}-${L}.png`, Buffer.from(shot.data, 'base64'))
}

const MEDIDA = `(() => {
  const l = document.documentElement.clientWidth
  const fora = []
  for (const el of document.querySelectorAll('body *')) {
    if (typeof el.className === 'string' && /sr-only/.test(el.className)) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.right > l + 1) {
      let p = el.parentElement, cortado = false
      while (p && p !== document.body) {
        const cs = getComputedStyle(p)
        if (cs.overflowX !== 'visible') { cortado = true; break }
        p = p.parentElement
      }
      if (!cortado) fora.push((el.tagName + '.' + (el.className || '').split(/\\s+/).slice(0, 3).join('.')).slice(0, 70) + ' ' + Math.round(r.left) + '→' + Math.round(r.right))
    }
  }
  // texto que não cabe no próprio campo
  const apertados = [...document.querySelectorAll('button, a, h1, h2, p, span')].filter((el) => {
    const cs = getComputedStyle(el)
    return cs.overflow === 'hidden' && el.scrollWidth > el.clientWidth + 2 && el.textContent.trim().length > 0 && el.children.length === 0
  }).map((el) => el.textContent.trim().slice(0, 32))
  return {
    overflow: document.documentElement.scrollWidth - l,
    fora: fora.slice(0, 6),
    apertados: apertados.slice(0, 6),
  }
})()`

// ── Estoque ────────────────────────────────────────────────────────
const estoque = await avaliar(MEDIDA)
checar('estoque: sem overflow', estoque.overflow === 0, String(estoque.overflow))
checar('estoque: nada passando da borda', estoque.fora.length === 0, estoque.fora.join(' | '))
checar('estoque: nenhum texto cortado', estoque.apertados.length === 0, estoque.apertados.join(' | '))
await foto('estoque')

// ── Formulário de moto ─────────────────────────────────────────────
await avaliar(`[...document.querySelectorAll('button')].find((b) => /Cadastrar moto/.test(b.textContent))?.click()`)
await espera(800)
const form = await avaliar(MEDIDA)
checar('form: sem overflow', form.overflow === 0, String(form.overflow))
checar('form: nada passando da borda', form.fora.length === 0, form.fora.join(' | '))
const formCampos = await avaliar(`(() => {
  const ids = ['f-modelo','f-ano','f-preco','f-km','f-status','f-cc','f-desc']
  const faltando = ids.filter((x) => !document.getElementById(x))
  const enviar = [...document.querySelectorAll('button[type="submit"]')].find((b) => /Moto/.test(b.textContent))
  const r = enviar?.getBoundingClientRect()
  return { faltando, enviar: Boolean(enviar), enviarVisivel: r ? Math.round(r.bottom) <= innerHeight + 1 : false }
})()`)
checar('form: campos presentes', formCampos.faltando.length === 0, formCampos.faltando.join(','))
checar('form: botão de salvar na tela', formCampos.enviarVisivel === true)
await foto('form')

// ── Registrar venda (menu ⋯ da linha) ─────────────────────────────
await avaliar(`document.querySelector('[aria-label="Voltar ao estoque"]')?.click()`)
await espera(700)
const abriuMenu = await avaliar(`(() => {
  const kebab = document.querySelector('[data-estoque-menu] button')
  if (kebab) kebab.click()
  return Boolean(kebab)
})()`)
await espera(400)
const abriuVenda = await avaliar(`(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Registrar venda/i.test(x.textContent))
  if (b) b.click()
  return Boolean(b)
})()`)
await espera(800)
if (abriuVenda) {
  const venda = await avaliar(MEDIDA)
  const campos = await avaliar(`(() => {
    const d = document.querySelector('[role="dialog"]')
    if (!d) return { abriu: false }
    const inputs = d.querySelectorAll('input, select, textarea')
    const r = d.getBoundingClientRect()
    return { abriu: true, campos: inputs.length, cabe: r.top >= -1 && r.bottom <= innerHeight + 1, altura: Math.round(r.height) }
  })()`)
  checar('venda: diálogo abre', campos.abriu === true)
  checar('venda: tem campos', campos.campos >= 2, String(campos.campos))
  checar('venda: diálogo cabe na tela', campos.cabe === true || campos.altura <= 844)
  checar('venda: sem overflow', venda.overflow === 0, String(venda.overflow))
  await foto('venda')
} else {
  checar('venda: menu ⋯ abre', abriuMenu === true)
  checar('venda: opção "Registrar venda"', false, 'não encontrada')
}
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sessionId)
await espera(400)

// ── Volta e vai para Vendidas ─────────────────────────────────────
await avaliar(`document.querySelector('[aria-label="Fechar"]')?.click()`)
await espera(600)
await avaliar(`[...document.querySelectorAll('a, button')].find((b) => b.textContent.trim() === 'Vendidas')?.click()`)
await espera(900)
const vendidas = await avaliar(MEDIDA)
checar('vendidas: sem overflow', vendidas.overflow === 0, String(vendidas.overflow))
checar('vendidas: nada passando da borda', vendidas.fora.length === 0, vendidas.fora.join(' | '))
await foto('vendidas')

const abreEditor = await avaliar(`(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Montar o post|Continuar rascunho|Abrir post/.test(x.textContent))
  if (b) b.click()
  return Boolean(b)
})()`)
await espera(900)
checar('post: abre o editor', abreEditor === true)
const post = await avaliar(MEDIDA)
checar('post: sem overflow', post.overflow === 0, String(post.overflow))
checar('post: nada passando da borda', post.fora.length === 0, post.fora.join(' | '))
await foto('post')

// ── Configurações ─────────────────────────────────────────────────
await avaliar(`[...document.querySelectorAll('a, button')].find((b) => /Voltar às vendidas/.test(b.textContent))?.click()`)
await espera(600)
await avaliar(`[...document.querySelectorAll('a, button')].find((b) => b.textContent.trim() === 'Vendidas')?.click()`)
await espera(500)
await avaliar(`[...document.querySelectorAll('a, button')].find((b) => /Configura/.test(b.textContent))?.click()`)
await espera(900)
const config = await avaliar(MEDIDA)
checar('config: sem overflow', config.overflow === 0, String(config.overflow))
checar('config: nada passando da borda', config.fora.length === 0, config.fora.join(' | '))
await foto('config')

console.log(falhas === 0 ? '\nPainel ok no celular.' : `\n${falhas} falha(s) no painel.`)
process.exit(0)
