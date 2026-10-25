/**
 * Auditoria funcional no celular: menu, filtros, galeria, contato e login.
 * Cada checagem imprime OK ou FALHOU com o motivo.
 */
const CDP = 'http://127.0.0.1:9222'
const BASE = 'http://localhost:5173'
const L = 390

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
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: L, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId)
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId)

async function ir(rota) {
  const carregou = esperarCarregar(sessionId)
  await send('Page.navigate', { url: `${BASE}${rota}` }, sessionId)
  await carregou
  await new Promise((r) => setTimeout(r, 1800))
}
async function avaliar(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
  if (r.exceptionDetails) return { erro: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text }
  return r.result.value
}
function checar(nome, condicao, detalhe = '') {
  console.log(`${condicao ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? ' — ' + detalhe : ''}`)
  if (!condicao) falhas++
}
let falhas = 0
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

// ── 1. Menu do celular ─────────────────────────────────────────────
await ir('/')
const menuTemBotao = await avaliar(`(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /menu/i.test(x.getAttribute('aria-label') || ''))
  if (b) b.click()
  return Boolean(b)
})()`)
await espera(400)
const menuEstado = await avaliar(`(() => {
  const d = document.querySelector('dialog[open]')
  return { abriu: Boolean(d), links: d ? d.querySelectorAll('a').length : 0 }
})()`)
checar('menu: botão existe', menuTemBotao === true)
checar('menu: abre', menuEstado.abriu === true)
checar('menu: tem links', menuEstado.links >= 4, String(menuEstado.links))
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sessionId)
await espera(300)
checar('menu: fecha com Esc', (await avaliar('!document.querySelector(\'dialog[open]\')')) === true)

// ── 2. Galeria da ficha ────────────────────────────────────────────
await ir('/moto/honda-xre-rally-300-2023')
const thumbsAvaliar = await avaliar(`(() => {
  const thumbs = [...document.querySelectorAll('[aria-controls="foto-principal"]')]
  if (thumbs.length < 2) return { thumbs: thumbs.length }
  window.__antes = document.querySelector('#foto-principal img').src
  thumbs[1].click()
  return { thumbs: thumbs.length }
})()`)
await espera(400)
const galeria = await avaliar(`(() => {
  const thumbs = [...document.querySelectorAll('[aria-controls="foto-principal"]')]
  const principal = document.querySelector('#foto-principal img')
  return { thumbs: thumbs.length, trocou: principal.src !== window.__antes, ativa: thumbs[1].getAttribute('aria-pressed') }
})()`)
galeria.thumbs = thumbsAvaliar.thumbs
checar('galeria: miniaturas', galeria.thumbs >= 2, String(galeria.thumbs))
checar('galeria: troca a foto', galeria.trocou === true)
checar('galeria: marca a ativa', galeria.ativa === 'true')

// ── 3. Filtros do estoque no celular ───────────────────────────────
await ir('/estoque')
const filtrosTemBotao = await avaliar(`(() => {
  const abrir = [...document.querySelectorAll('button')].find((b) => /filtr/i.test(b.textContent))
  if (abrir) abrir.click()
  return Boolean(abrir)
})()`)
await espera(400)
const filtros = await avaliar(`(() => {
  const dialogo = document.querySelector('dialog[open]')
  return { abriu: Boolean(dialogo), texto: dialogo ? dialogo.textContent.replace(/\\s+/g, ' ').slice(0, 50) : '' }
})()`)
checar('estoque: botão de filtros', filtrosTemBotao === true)
checar('estoque: folha de filtros abre', filtros.abriu === true, filtros.texto)

const aplicarRotulo = await avaliar(`(() => {
  const d = document.querySelector('dialog[open]')
  if (!d) return null
  const botao = [...d.querySelectorAll('button')].find((b) => /aplicar|ver resultado|ver motos/i.test(b.textContent))
  if (botao) botao.click()
  return botao ? botao.textContent.trim() : null
})()`)
await espera(500)
const aplicou = await avaliar('!document.querySelector(\'dialog[open]\')')
checar('estoque: aplicar fecha a folha', aplicou === true, aplicarRotulo ?? '')

// ── 4. Contato ─────────────────────────────────────────────────────
await ir('/contato')
const contato = await avaliar(`(() => {
  const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
  return {
    whats: links.some((h) => /wa\\.me/.test(h)),
    mapa: links.some((h) => /maps|google/.test(h)),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
})()`)
checar('contato: link do WhatsApp', contato.whats === true)
checar('contato: link do mapa', contato.mapa === true)
checar('contato: sem overflow', contato.overflow === 0, String(contato.overflow))

// ── 5. Login do painel ─────────────────────────────────────────────
await ir('/admin/login')
const login = await avaliar(`(() => {
  const email = document.querySelector('input[type="email"], input[name="email"], #email')
  const senha = document.querySelector('input[type="password"]')
  const enviar = document.querySelector('button[type="submit"]')
  const r = enviar?.getBoundingClientRect()
  return {
    email: Boolean(email), senha: Boolean(senha), enviar: Boolean(enviar),
    enviarVisivel: r ? r.right <= innerWidth + 1 && r.left >= -1 && r.bottom <= innerHeight + 1 : false,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
})()`)
checar('login: campo de e-mail', login.email === true)
checar('login: campo de senha', login.senha === true)
checar('login: botão visível', login.enviarVisivel === true)
checar('login: sem overflow', login.overflow === 0, String(login.overflow))

console.log(falhas === 0 ? '\nTudo certo no celular.' : `\n${falhas} falha(s).`)
process.exit(0)
