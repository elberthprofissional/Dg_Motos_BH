/** Diagnóstico temporário: status das chamadas ao Supabase. */
import { resolverPendente } from '../lib/cdp.mjs'

const CDP = 'http://127.0.0.1:9222'
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
await send('Network.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
await send('Page.navigate', { url: 'http://localhost:5173/estoque' }, sessionId)
await new Promise((r) => setTimeout(r, 3500))
const reqs = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const cards = document.querySelectorAll('article').length
    const vazio = document.body.innerText.includes('Nenhuma moto')
    return { cards, vazio }
  })()`,
}, sessionId)
console.log('DOM', JSON.stringify(reqs.result.value))
process.exit(0)
