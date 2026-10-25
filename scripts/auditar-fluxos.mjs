/** Auditoria de fluxos: busca do cabeçalho e filtro por marca no estoque. */
const CDP = 'http://127.0.0.1:9222'
const BASE = 'http://localhost:5173'
const L = Number(process.env.LARGURA ?? 390)
const A = 844

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
const esperarCarregar = (sessionId) =>
  new Promise((resolve) => {
    const h = (msg) => {
      if (msg.method === 'Page.loadEventFired' && msg.sessionId === sessionId) {
        ls.splice(ls.indexOf(h), 1)
        resolve()
      }
    }
    ls.push(h)
  })
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: L, height: A, deviceScaleFactor: 1, mobile: L < 700 }, sessionId)
await send('Emulation.setTouchEmulationEnabled', { enabled: L < 700, maxTouchPoints: 5 }, sessionId)
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
async function avaliar(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
  if (r.exceptionDetails) return { erro: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text }
  return r.result.value
}
async function ir(rota) {
  const carregou = esperarCarregar(sessionId)
  await send('Page.navigate', { url: `${BASE}${rota}` }, sessionId)
  await carregou
  await espera(2200)
}
let falhas = 0
const checar = (nome, ok, detalhe = '') => {
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? ' — ' + detalhe : ''}`)
  if (!ok) falhas++
}

// ── Busca do cabeçalho ────────────────────────────────────────────
await ir('/')
const busca = await avaliar(`(() => {
  const b = document.querySelector('[aria-label="Abrir busca"], button[aria-label*="busca" i]')
  if (b) b.click()
  return Boolean(b)
})()`)
await espera(500)
const campoBusca = await avaliar(`(() => {
  // O cabeçalho tem DOIS inputs (desktop e celular): só um está visível.
  const visiveis = [...document.querySelectorAll('input')].filter((i) => {
    const r = i.getBoundingClientRect()
    return r.width > 40 && r.height > 10 && /buscar moto/i.test(i.placeholder || '')
  })
  const input = visiveis[0]
  if (!input) return { achou: false, quantos: 0 }
  input.focus()
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(input, 'XRE')
  input.dispatchEvent(new Event('input', { bubbles: true }))
  return { achou: true, quantos: visiveis.length, focado: document.activeElement === input }
})()`)
checar('busca: campo do cabeçalho existe', campoBusca.achou === true, `${campoBusca.quantos} visível(is)`)
checar('busca: campo recebe foco', campoBusca.focado === true, busca ? '' : 'sem botão de abrir')

await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, sessionId)
await send('Input.dispatchKeyEvent', { type: 'char', key: 'Enter', text: '\r', unmodifiedText: '\r' }, sessionId)
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, sessionId)
await espera(1200)
const resultadoBusca = await avaliar(`({
  url: location.pathname + location.search,
  cards: document.querySelectorAll('article').length,
  vazio: /Nenhum|nenhuma/i.test(document.body.innerText),
})`)
checar('busca: leva para o estoque com o termo', /busca=/i.test(resultadoBusca.url), resultadoBusca.url)
checar('busca: filtra resultados', resultadoBusca.cards > 0 && resultadoBusca.cards <= 3, `${resultadoBusca.cards} cartão(ões)`)

// ── Filtro por marca dentro do estoque ────────────────────────────
await ir('/estoque')
const totalAntes = await avaliar(`document.querySelectorAll('article').length`)
await avaliar(`[...document.querySelectorAll('button')].find((b) => /filtr/i.test(b.textContent))?.click()`)
await espera(500)
const escolheu = await avaliar(`(() => {
  const d = document.querySelector('dialog[open]')
  if (!d) return null
  const select = [...d.querySelectorAll('select')].find((s) => /marca/i.test(s.getAttribute('aria-label') || s.id || ''))
  if (!select) return null
  const opcao = [...select.options].find((o) => o.value && o.value !== '')
  if (!opcao) return null
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
  setter.call(select, opcao.value)
  select.dispatchEvent(new Event('change', { bubbles: true }))
  const aplicar = [...d.querySelectorAll('button')].find((b) => /aplicar/i.test(b.textContent))
  aplicar?.click()
  return opcao.value
})()`)
await espera(900)
const depois = await avaliar(`(() => {
  const nomes = [...document.querySelectorAll('article h3')].map((h) => h.textContent.trim())
  return { cards: nomes.length, nomes }
})()`)
checar('filtro: escolheu uma marca', Boolean(escolheu), escolheu ?? 'nenhuma opção')
checar('filtro: resultados mudaram', depois.cards !== totalAntes, `${totalAntes} → ${depois.cards}`)
checar(
  'filtro: todos os resultados são da marca',
  depois.nomes.length === 0 || depois.nomes.every((n) => n.toLowerCase().includes(String(escolheu).toLowerCase())),
  depois.nomes.join(' | '),
)

console.log(falhas === 0 ? '\nFluxos ok.' : `\n${falhas} falha(s).`)
process.exit(0)
