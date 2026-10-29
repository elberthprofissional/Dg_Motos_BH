/**
 * Auditoria de responsivo: abre cada rota em cada largura e reporta
 * overflow horizontal, elementos passando da borda e texto cortado.
 *
 *   node scripts/auditar-responsivo.mjs [largura...]
 */
import { resolverPendente } from '../lib/cdp.mjs'

const CDP = process.env.CDP ?? 'http://127.0.0.1:9222'
const BASE = process.env.BASE ?? 'http://localhost:5173'
const LARGURAS = process.argv.slice(2).map(Number).filter(Boolean)
const TELAS = LARGURAS.length > 0 ? LARGURAS : [390, 768]
const ROTAS = [
  '/',
  '/estoque',
  '/moto/honda-xre-rally-300-2023',
  '/contato',
  '/admin/login',
  '/rota-que-nao-existe',
]

const version = await (await fetch(`${CDP}/json/version`)).json()
const ws = new WebSocket(version.webSocketDebuggerUrl)
let seq = 0
const pend = new Map()
const listeners = []
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (resolverPendente(pend, msg)) return
  if (msg.method) {
    for (const l of listeners) l(msg)
  }
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

function send(method, params = {}, sessionId) {
  const id = ++seq
  return new Promise((resolve, reject) => {
    pend.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)

function esperarCarregar() {
  return new Promise((resolve) => {
    const h = (msg) => {
      if (msg.method === 'Page.loadEventFired' && msg.sessionId === sessionId) {
        listeners.splice(listeners.indexOf(h), 1)
        resolve()
      }
    }
    listeners.push(h)
  })
}

const RELATORIO = `(() => {
  const largura = document.documentElement.clientWidth
  const total = document.documentElement.scrollWidth
  const descrever = (el) => {
    const cls = (typeof el.className === 'string' ? el.className : '').split(/\\s+/).filter(Boolean).slice(0, 4).join('.')
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (el.id ? '#' + el.id : '')
  }
  const retos = []
  const cortados = []
  const ruido = (el) => {
    const cls = typeof el.className === 'string' ? el.className : ''
    return /sr-only|pular-para-conteudo/.test(cls)
  }
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (ruido(el)) continue
    if (r.right > largura + 1 || r.left < -1) {
      // ignora o que está dentro de um antepassado que recorta de propósito
      let pai = el.parentElement, recortado = false
      while (pai && pai !== document.body) {
        const pc = getComputedStyle(pai)
        if (pc.overflowX !== 'visible' || pc.overflow === 'hidden') { recortado = true; break }
        pai = pai.parentElement
      }
      if (!recortado) retos.push({ el: descrever(el), l: Math.round(r.left), r: Math.round(r.right) })
    }
    const cs = getComputedStyle(el)
    if (ruido(el)) continue
    if (cs.overflowX === 'hidden' && el.scrollWidth > el.clientWidth + 2 && el.children.length === 0 && el.textContent.trim()) {
      cortados.push({ el: descrever(el), texto: el.textContent.trim().slice(0, 40), visivel: el.clientWidth, precisa: el.scrollWidth })
    }
  }
  return {
    largura,
    total,
    overflow: total - largura,
    retos: retos.slice(0, 8),
    cortados: cortados.slice(0, 8),
  }
})()`

let problemas = 0
for (const largura of TELAS) {
  for (const rota of ROTAS) {
    await send('Emulation.setDeviceMetricsOverride', { width: largura, height: 900, deviceScaleFactor: 1, mobile: largura < 700 }, sessionId)
    await send('Emulation.setTouchEmulationEnabled', { enabled: largura < 700, maxTouchPoints: 5 }, sessionId)
    const carregou = esperarCarregar()
    await send('Page.navigate', { url: `${BASE}${rota}` }, sessionId)
    await carregou
    await new Promise((r) => setTimeout(r, 1800))
    const { result } = await send('Runtime.evaluate', { expression: RELATORIO, returnByValue: true, awaitPromise: false }, sessionId)
    const v = result.value
    const linhas = []
    if (v.overflow > 0) linhas.push(`  OVERFLOW  +${v.overflow}px`)
    for (const o of v.retos) linhas.push(`  fora      ${o.el} (${o.l}→${o.r})`)
    for (const c of v.cortados) linhas.push(`  cortado   ${c.el} "${c.texto}" (${c.visivel}/${c.precisa})`)
    if (linhas.length > 0) {
      problemas++
      console.log(`\n[${largura}px] ${rota}`)
      console.log(linhas.join('\n'))
    }
  }
}
console.log(problemas === 0 ? '\nNenhum problema de responsivo encontrado.' : `\n${problemas} rota(s)/largura(s) com problema.`)
process.exit(0)
