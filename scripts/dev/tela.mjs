/** Temporário: abre uma rota, tira foto e mede o que interessa. */
import { resolverPendente } from '../lib/cdp.mjs'

const CDP = 'http://127.0.0.1:9222'
const ROTA = process.env.ROTA ?? '/'
const L = Number(process.env.LARGURA ?? 390)
const A = Number(process.env.ALTURA ?? 900)
const NOME = process.env.NOME ?? 'tela'
const ROLAR = Number(process.env.ROLAR ?? 0)
const { writeFileSync, mkdirSync } = await import('node:fs')

const v = await (await fetch(`${CDP}/json/version`)).json()
const ws = new WebSocket(v.webSocketDebuggerUrl)
let id = 0
const pend = new Map()
const ls = []
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (resolverPendente(pend, m)) return
  if (m.method) for (const l of ls) l(m)
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const i = ++id
    pend.set(i, { resolve, reject })
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: L, height: A, deviceScaleFactor: 1, mobile: L < 700 }, sessionId)
await send('Emulation.setTouchEmulationEnabled', { enabled: L < 700, maxTouchPoints: 5 }, sessionId)
const carregou = new Promise((res) => {
  const h = (m) => {
    if (m.method === 'Page.loadEventFired' && m.sessionId === sessionId) {
      ls.splice(ls.indexOf(h), 1)
      res()
    }
  }
  ls.push(h)
})
await send('Page.navigate', { url: `http://localhost:5173${ROTA}` }, sessionId)
await carregou
await new Promise((r) => setTimeout(r, 2200))
if (ROLAR) {
  await send('Runtime.evaluate', { expression: `scrollTo(0, ${ROLAR})` }, sessionId)
  await new Promise((r) => setTimeout(r, 600))
}
mkdirSync('.taste-skill/inspect', { recursive: true })
const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
writeFileSync(`.taste-skill/inspect/${NOME}-${L}.png`, Buffer.from(shot.data, 'base64'))
const med = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, altura: document.documentElement.scrollHeight })`,
}, sessionId)
console.log(NOME, JSON.stringify(med.result.value))
process.exit(0)
