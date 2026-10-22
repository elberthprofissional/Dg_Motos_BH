/**
 * Auditoria de navegador da vitrine — via CDP, sem Playwright.
 *
 * O que ela mede, em 1440 px e 390 px, em cada rota da vitrine:
 * transbordo horizontal, erro de console, contraste real (calculado sobre
 * o fundo de cada elemento), alvo de toque, `id` duplicado, salto de nível
 * de título, imagem quebrada, campo sem rótulo e link sem nome acessível.
 *
 * Depois disso, testa as interações que só existem depois do clique:
 * menu do celular (dialog nativo), folha de filtros, teclado (skip link e
 * foco visível) e os botões flutuantes.
 *
 * Como rodar:
 *   1. terminal 1 — npm run build && npm run preview
 *   2. terminal 2 — chrome --remote-debugging-port=9222
 *      (no Windows: "C:\Program Files\Google\Chrome\Application\chrome.exe"
 *       --remote-debugging-port=9222)
 *   3. npm run auditar
 *
 * Sai com código 1 se alguma checagem falhar — dá para pendurar em CI.
 */
const CDP = process.env.CDP ?? 'http://127.0.0.1:9222'
const BASE = process.env.BASE ?? 'http://localhost:4173'

const ROTAS = ['/', '/estoque', '/contato', '/moto/honda-xre-300-2021', '/admin/login']
const VIEWPORTS = [
  { nome: 'desktop', width: 1440, height: 900, mobile: false },
  { nome: 'mobile', width: 390, height: 844, mobile: true },
]

/* ------------------------------------------------------------------ */
/* Ponte CDP                                                          */
/* ------------------------------------------------------------------ */

const version = await (await fetch(`${CDP}/json/version`)).json()
const ws = new WebSocket(version.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const listeners = []

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
  } else if (msg.method) {
    for (const l of listeners) l(msg)
  }
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

function send(method, params = {}, sessionId) {
  const msgId = ++id
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject })
    ws.send(JSON.stringify({ id: msgId, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}

function waitEvent(method, sessionId, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), timeout)
    const handler = (msg) => {
      if (msg.method === method && (!sessionId || msg.sessionId === sessionId)) {
        clearTimeout(timer)
        listeners.splice(listeners.indexOf(handler), 1)
        resolve(msg.params)
      }
    }
    listeners.push(handler)
  })
}

async function avaliar(sessionId, expression) {
  const { result, exceptionDetails } = await send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true },
    sessionId,
  )
  if (exceptionDetails) {
    throw new Error(exceptionDetails.text + ' :: ' + exceptionDetails.exception?.description)
  }
  return result.value
}

async function abrir(url, width, height, mobile) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)
  await send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile },
    sessionId,
  )
  const loaded = waitEvent('Page.loadEventFired', sessionId)
  await send('Page.navigate', { url }, sessionId)
  await loaded
  // Espera a animação do hero (1,4 s) terminar: medir no meio dela
  // acusaria um transbordo que só existe durante o scale.
  await new Promise((r) => setTimeout(r, 1800))
  return { targetId, sessionId }
}

/* ------------------------------------------------------------------ */
/* Fase 1 — auditoria estática (uma passagem de medição por rota)      */
/* ------------------------------------------------------------------ */

const MEDICAO = `(() => {
  const doc = document.documentElement
  const vw = doc.clientWidth

  /* ---------- transbordo horizontal ----------
     Só o que passa da borda DIREITA transborda: elemento jogado para
     fora à esquerda (o skip link, por exemplo) não cria rolagem. */
  const over = []
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.right <= vw + 1) continue
    const cs = getComputedStyle(el)
    if (cs.position === 'fixed') continue
    if (el.closest('[inert]')) continue
    over.push({
      tag: el.tagName,
      cls: String(el.className || '').slice(0, 70),
      left: Math.round(r.left),
      right: Math.round(r.right),
    })
  }

  /* ---------- contraste ---------- */
  const lum = (rgb) => {
    const f = rgb.map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]
  }
  const parse = (c) => {
    const m = c.match(/rgba?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return { rgb: [p[0], p[1], p[2]], a: p[3] === undefined ? 1 : p[3] }
  }
  const sobrepor = (fg, bg) => {
    const a = fg.a
    return [0, 1, 2].map((i) => fg.rgb[i] * a + bg[i] * (1 - a))
  }
  const fundoDe = (el) => {
    let node = el
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor)
      if (c && c.a > 0.95) return c.rgb
      node = node.parentElement
    }
    return [10, 10, 11]
  }
  const contraste = (fgRaw, bg) => {
    const fg = parse(fgRaw)
    if (!fg) return null
    const f = sobrepor(fg, bg)
    const L1 = lum(f), L2 = lum(bg)
    const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
  }
  const contrasteBaixo = []
  for (const el of document.querySelectorAll('main p, main span, main a, main li, main h1, main h2, main h3, main dt, main dd, main button, header p, header a, header span, header button, footer p, footer a, footer span')) {
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('')
    if (!txt) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const bg = fundoDe(el)
    const cr = contraste(cs.color, bg)
    if (cr === null) continue
    const fs = parseFloat(cs.fontSize)
    const bold = Number(cs.fontWeight) >= 700
    const minimo = fs >= 24 || (fs >= 18.66 && bold) ? 3 : 4.5
    if (cr < minimo) {
      contrasteBaixo.push({
        txt: txt.slice(0, 42),
        cor: cs.color,
        fundo: 'rgb(' + bg.join(', ') + ')',
        cr,
        minimo,
        fs: Math.round(fs),
      })
    }
  }

  /* ---------- alvos de toque ---------- */
  const pequenos = []
  for (const el of document.querySelectorAll('a, button, [role="button"], input, select, summary')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const texto = (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)
    if (!texto) continue
    if (r.height < 24 || r.width < 24) {
      pequenos.push({
        tag: el.tagName,
        txt: texto,
        w: Math.round(r.width),
        h: Math.round(r.height),
        cls: String(el.className || '').slice(0, 50),
      })
    }
  }

  /* ---------- estrutura ---------- */
  const ids = {}
  for (const el of document.querySelectorAll('[id]')) ids[el.id] = (ids[el.id] || 0) + 1
  const idsRepetidos = Object.entries(ids).filter(([, n]) => n > 1).map(([k]) => k)

  const titulos = [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map((h) => Number(h.tagName[1]))
  const salto = []
  for (let i = 1; i < titulos.length; i++) {
    if (titulos[i] - titulos[i - 1] > 1) salto.push(titulos.slice(i - 1, i + 1).join('->'))
  }

  const imgSemAlt = [...document.querySelectorAll('img')]
    .filter((i) => i.getAttribute('alt') === null)
    .map((i) => i.currentSrc || i.src)

  const inputsSemLabel = []
  for (const el of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
    const id = el.id
    const rotulado =
      (id && document.querySelector('label[for="' + CSS.escape(id) + '"]')) ||
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.closest('label')
    if (!rotulado) inputsSemLabel.push({ tag: el.tagName, id: id || '(sem id)', type: el.type || '' })
  }

  const linksSemNome = [...document.querySelectorAll('a')].filter(
    (a) => !(a.innerText || '').trim() && !a.getAttribute('aria-label') && !a.getAttribute('title'),
  ).length

  const quebrados = [...document.images]
    .filter((i) => i.complete && i.naturalWidth === 0)
    .map((i) => i.currentSrc || i.src)

  const h1 = document.querySelector('main h1')
  const rotulo = document.querySelector('.rotulo')
  const preco = document.querySelector('.preco')

  return {
    title: document.title,
    scrollW: doc.scrollWidth,
    clientW: vw,
    overflowCount: over.length,
    overflow: over.slice(0, 6),
    contrasteCount: contrasteBaixo.length,
    contrasteBaixo: contrasteBaixo.slice(0, 12),
    pequenosCount: pequenos.length,
    pequenos: pequenos.slice(0, 12),
    idsRepetidos,
    saltoTitulos: salto,
    imgSemAlt: imgSemAlt.slice(0, 6),
    inputsSemLabel,
    linksSemNome,
    quebrados,
    imgs: document.images.length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    h1: h1
      ? {
          txt: h1.innerText.replace(/\\s+/g, ' ').slice(0, 60),
          cor: getComputedStyle(h1).color,
          fam: getComputedStyle(h1).fontFamily.slice(0, 30),
        }
      : null,
    rotuloCor: rotulo ? getComputedStyle(rotulo).color : null,
    precoCor: preco ? getComputedStyle(preco).color : null,
    headerH: (() => {
      const h = document.querySelector('header')
      return h ? Math.round(h.getBoundingClientRect().height) : null
    })(),
  }
})()`

const relatorio = []

for (const rota of ROTAS) {
  for (const vp of VIEWPORTS) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    await send('Page.enable', {}, sessionId)
    await send('Runtime.enable', {}, sessionId)
    await send('Log.enable', {}, sessionId)
    await send(
      'Emulation.setDeviceMetricsOverride',
      { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile },
      sessionId,
    )

    const consoleMsgs = []
    const onMsg = (msg) => {
      if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
        consoleMsgs.push(
          `${msg.params.type}: ` +
            msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 200),
        )
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleMsgs.push(
          'exception: ' + (msg.params.exceptionDetails?.exception?.description || '').slice(0, 200),
        )
      }
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        consoleMsgs.push('log: ' + String(msg.params.entry.text).slice(0, 200))
      }
    }
    listeners.push(onMsg)

    const loaded = waitEvent('Page.loadEventFired', sessionId)
    await send('Page.navigate', { url: BASE + rota }, sessionId)
    await loaded
    await new Promise((r) => setTimeout(r, 1800))

    const { result, exceptionDetails } = await send(
      'Runtime.evaluate',
      { expression: MEDICAO, returnByValue: true },
      sessionId,
    )

    listeners.splice(listeners.indexOf(onMsg), 1)
    await send('Target.closeTarget', { targetId })

    relatorio.push({
      rota,
      viewport: vp.nome,
      erro: exceptionDetails ? String(exceptionDetails.text).slice(0, 200) : null,
      console: consoleMsgs.slice(0, 8),
      ...(result?.value ?? {}),
    })
  }
}

for (const r of relatorio) {
  console.log('='.repeat(90))
  console.log(`${r.rota}  [${r.viewport}]  ${r.title ?? ''}`)
  if (r.erro) console.log('  ERRO DE AVALIACAO:', r.erro)
  console.log(
    `  scroll=${r.scrollW}/${r.clientW}  overflow=${r.overflowCount}  imgQuebrada=${r.quebrados?.length ?? 0}  imgs=${r.imgs}`,
  )
  console.log(
    `  contrasteBaixo=${r.contrasteCount}  alvosPequenos=${r.pequenosCount}  idsRepetidos=${JSON.stringify(r.idsRepetidos)}  saltoTitulos=${JSON.stringify(r.saltoTitulos)}`,
  )
  console.log(
    `  h1=${JSON.stringify(r.h1)}  preco=${r.precoCor}  rotulo=${r.rotuloCor}  body=${r.bodyBg}/${r.bodyColor}  headerH=${r.headerH}`,
  )
  if (r.console?.length) console.log('  CONSOLE:', JSON.stringify(r.console, null, 1))
  if (r.overflow?.length) console.log('  OVERFLOW:', JSON.stringify(r.overflow, null, 1))
  if (r.contrasteBaixo?.length) console.log('  CONTRASTE:', JSON.stringify(r.contrasteBaixo, null, 1))
  if (r.pequenos?.length) console.log('  PEQUENOS:', JSON.stringify(r.pequenos, null, 1))
  if (r.inputsSemLabel?.length) console.log('  INPUT SEM LABEL:', JSON.stringify(r.inputsSemLabel))
  if (r.imgSemAlt?.length) console.log('  IMG SEM ALT:', JSON.stringify(r.imgSemAlt))
  if (r.quebrados?.length) console.log('  QUEBRADAS:', JSON.stringify(r.quebrados))
  if (r.linksSemNome) console.log('  LINKS SEM NOME:', r.linksSemNome)
}

/* ------------------------------------------------------------------ */
/* Fase 2 — interações (o que só existe depois do clique)              */
/* ------------------------------------------------------------------ */

const checagens = []
const ok = (nome, passou, detalhe = '') => {
  checagens.push({ nome, passou, detalhe })
  return passou
}

/* --- menu do celular (dialog nativo) --- */
{
  const { targetId, sessionId } = await abrir(BASE + '/', 390, 844, true)

  const antes = await avaliar(
    sessionId,
    `(() => {
      const d = document.querySelector('dialog.menu-mobile')
      return { existe: !!d, botao: !!document.querySelector('button[aria-haspopup=dialog]') }
    })()`,
  )
  ok('menu: dialog existe', antes.existe)
  ok('menu: botão de abertura existe', antes.botao)

  await avaliar(sessionId, `document.querySelector('button[aria-haspopup=dialog]').click()`)
  await new Promise((r) => setTimeout(r, 600))

  const aberto = await avaliar(
    sessionId,
    `(() => {
      const d = document.querySelector('dialog.menu-mobile')
      const cs = getComputedStyle(d)
      return {
        aberto: d.open,
        largura: Math.round(d.getBoundingClientRect().width),
        fundo: cs.backgroundColor,
        focoDentro: d.contains(document.activeElement),
        bodyOverflow: document.body.style.overflow,
      }
    })()`,
  )
  ok('menu: abre com showModal', aberto.aberto === true)
  ok('menu: ocupa a tela toda', aberto.largura === 390, 'largura=' + aberto.largura)
  ok('menu: fundo preto', aberto.fundo === 'rgb(10, 10, 11)', aberto.fundo)
  ok('menu: rolagem do fundo travada', aberto.bodyOverflow === 'hidden', aberto.bodyOverflow)
  ok('menu: foco dentro do diálogo', aberto.focoDentro)

  await send(
    'Input.dispatchKeyEvent',
    { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
    sessionId,
  )
  await send(
    'Input.dispatchKeyEvent',
    { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
    sessionId,
  )
  await new Promise((r) => setTimeout(r, 600))

  const fechado = await avaliar(
    sessionId,
    `(() => {
      const d = document.querySelector('dialog.menu-mobile')
      return {
        aberto: d.open,
        bodyOverflow: document.body.style.overflow,
        focoNoBotao: document.activeElement === document.querySelector('button[aria-haspopup=dialog]'),
      }
    })()`,
  )
  ok('menu: Esc fecha', fechado.aberto === false)
  ok('menu: rolagem do fundo liberada', fechado.bodyOverflow === '')
  ok('menu: foco volta ao botão', fechado.focoNoBotao)

  await send('Target.closeTarget', { targetId })
}

/* --- folha de filtros do celular --- */
{
  const { targetId, sessionId } = await abrir(BASE + '/estoque', 390, 844, true)

  const botao = await avaliar(
    sessionId,
    `!!document.querySelector('button[aria-label="Abrir filtros"]')`,
  )
  ok('filtros: botão de abertura existe no celular', botao)

  await avaliar(sessionId, `document.querySelector('button[aria-label="Abrir filtros"]').click()`)
  await new Promise((r) => setTimeout(r, 600))

  const aberto = await avaliar(
    sessionId,
    `(() => {
      const d = document.querySelector('dialog[aria-label="Filtros do estoque"]')
      if (!d) return { aberto: false }
      const campo = d.querySelector('input[type=search]')
      const r = campo?.getBoundingClientRect()
      return {
        aberto: d.open,
        largura: Math.round(d.getBoundingClientRect().width),
        campoVisivel: !!r && r.width > 0 && r.height > 0,
        focoDentro: d.contains(document.activeElement),
      }
    })()`,
  )
  ok('filtros: folha abre como dialog', aberto.aberto === true)
  ok('filtros: folha ocupa a largura da tela', aberto.largura === 390, 'largura=' + aberto.largura)
  ok('filtros: campo de busca visível', aberto.campoVisivel)
  ok('filtros: foco dentro da folha', aberto.focoDentro)

  const ids = await avaliar(
    sessionId,
    `(() => {
      const todos = [...document.querySelectorAll('input,select')].map((e) => e.id).filter(Boolean)
      return { total: todos.length, unicos: new Set(todos).size }
    })()`,
  )
  ok('filtros: ids únicos', ids.total === ids.unicos, `${ids.total} campos / ${ids.unicos} ids`)

  const labelOk = await avaliar(
    sessionId,
    `(() => {
      const d = document.querySelector('dialog[aria-label="Filtros do estoque"]')
      const label = d?.querySelector('label[for="filtro-m-busca"]')
      const input = d?.querySelector('#filtro-m-busca')
      return { ok: !!label && !!input, motivo: 'label/input da folha não se encontram' }
    })()`,
  )
  ok('filtros: label da folha aponta para o campo da folha', labelOk.ok, labelOk.motivo)

  const fechar = await avaliar(
    sessionId,
    `(() => {
      const b = document.querySelector('dialog[aria-label="Filtros do estoque"] button[aria-label="Fechar filtros"]')
      if (!b) return false
      b.click()
      return true
    })()`,
  )
  await new Promise((r) => setTimeout(r, 600))
  const fechou = await avaliar(
    sessionId,
    `document.querySelector('dialog[aria-label="Filtros do estoque"]') === null`,
  )
  ok('filtros: botão de fechar remove a folha', fechar && fechou)

  await send('Target.closeTarget', { targetId })
}

/* --- ficha da moto no celular --- */
{
  const { targetId, sessionId } = await abrir(BASE + '/moto/honda-xre-300-2021', 390, 844, true)

  const ordem = await avaliar(
    sessionId,
    `(() => {
      const h1 = document.querySelector('main h1')
      const galeria = document.querySelector('main img')
      const rH1 = h1.getBoundingClientRect()
      const rImg = galeria.getBoundingClientRect()
      const breadcrumb = document.querySelector('nav[aria-label="Navegação estrutural"]')
      const alvos = [...breadcrumb.querySelectorAll('a')].map((a) => ({
        txt: a.innerText.trim(),
        h: Math.round(a.getBoundingClientRect().height),
      }))
      return {
        tituloAntesDaFoto: rH1.top < rImg.top,
        alvos,
      }
    })()`,
  )
  ok('ficha: título e preço abrem a página antes da galeria', ordem.tituloAntesDaFoto)
  ok(
    'ficha: links do breadcrumb com alvo de toque ≥ 24 px',
    ordem.alvos.every((a) => a.h >= 24),
    JSON.stringify(ordem.alvos),
  )

  await send('Target.closeTarget', { targetId })
}

/* --- teclado --- */
{
  const { targetId, sessionId } = await abrir(BASE + '/', 1440, 900, false)

  const skip = await avaliar(
    sessionId,
    `(() => {
      const a = document.querySelector('.pular-para-conteudo')
      a.focus()
      const r = a.getBoundingClientRect()
      return { visivel: r.left >= 0 && r.top >= 0, foco: document.activeElement === a }
    })()`,
  )
  ok('teclado: skip link aparece ao receber foco', skip.visivel)
  ok('teclado: skip link é o elemento focado', skip.foco)

  await send(
    'Input.dispatchKeyEvent',
    { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
    sessionId,
  )
  await new Promise((r) => setTimeout(r, 200))

  const tab = await avaliar(
    sessionId,
    `(() => {
      const el = document.activeElement
      const cs = getComputedStyle(el)
      return { tag: el.tagName, txt: (el.innerText || '').slice(0, 24), outline: cs.outlineWidth }
    })()`,
  )
  ok(
    'teclado: foco visível no próximo elemento',
    parseFloat(tab.outline) >= 1,
    `${tab.tag} "${tab.txt}" outline=${tab.outline}`,
  )

  const main = await avaliar(
    sessionId,
    `(() => {
      const m = document.getElementById('conteudo')
      return { existe: !!m, tabIndex: m?.getAttribute('tabindex') }
    })()`,
  )
  ok('teclado: <main> tem alvo de foco (skip link funciona)', main.existe && main.tabIndex === '-1')

  await send('Target.closeTarget', { targetId })
}

/* --- botões flutuantes --- */
{
  const { targetId, sessionId } = await abrir(BASE + '/', 390, 844, true)

  const topo = await avaliar(
    sessionId,
    `(() => {
      const seta = document.querySelector('button[aria-label="Voltar ao topo"]')
      const contato = document.querySelector('a[aria-label="Falar com a loja"], a[aria-label="Conversar no WhatsApp"]')
      return {
        setaExiste: !!seta,
        setaInert: seta?.hasAttribute('inert') ?? null,
        setaVisivel: seta ? getComputedStyle(seta).opacity !== '0' : null,
        contatoExiste: !!contato,
        contatoCor: contato ? getComputedStyle(contato).backgroundColor : null,
        contatoRaio: contato ? getComputedStyle(contato).borderRadius : null,
      }
    })()`,
  )
  ok('flutuantes: botão de topo existe', topo.setaExiste)
  ok(
    'flutuantes: seta começa escondida e fora do Tab',
    topo.setaInert === true && topo.setaVisivel === false,
  )
  ok('flutuantes: contato presente na vitrine', topo.contatoExiste)
  ok(
    'flutuantes: contato usa o verde do WhatsApp',
    topo.contatoCor === 'rgb(37, 211, 102)',
    topo.contatoCor,
  )
  ok('flutuantes: canto reto no botão de contato', topo.contatoRaio === '0px', topo.contatoRaio)

  await avaliar(
    sessionId,
    `(async () => {
      const html = document.documentElement
      html.style.scrollBehavior = 'auto'
      window.scrollTo(0, 1200)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return true
    })()`,
  )
  await new Promise((r) => setTimeout(r, 600))

  const depois = await avaliar(
    sessionId,
    `(() => {
      const seta = document.querySelector('button[aria-label="Voltar ao topo"]')
      return { opacity: getComputedStyle(seta).opacity, inert: seta.hasAttribute('inert') }
    })()`,
  )
  ok(
    'flutuantes: seta aparece depois de rolar',
    depois.opacity === '1' && depois.inert === false,
    `opacity=${depois.opacity}`,
  )

  await avaliar(sessionId, `document.querySelector('button[aria-label="Voltar ao topo"]').click()`)
  await new Promise((r) => setTimeout(r, 1200))

  const voltou = await avaliar(sessionId, `Math.round(window.scrollY)`)
  ok('flutuantes: seta leva de volta ao topo', voltou === 0, `scrollY=${voltou}`)

  await send('Target.closeTarget', { targetId })
}

/* --- navegação: o link Início não fica ativo nas outras rotas --- */
{
  const { targetId, sessionId } = await abrir(BASE + '/estoque', 1440, 900, false)

  const nav = await avaliar(
    sessionId,
    `(() => {
      const links = [...document.querySelectorAll('nav[aria-label="Navegação principal"] a')]
      return links.map((a) => ({
        txt: a.innerText.trim(),
        atual: a.getAttribute('aria-current') === 'page',
      }))
    })()`,
  )
  const inicio = nav.find((l) => l.txt === 'Início')
  const estoque = nav.find((l) => l.txt === 'Estoque')
  ok('/estoque: "Início" não está marcado como ativo', inicio?.atual === false, JSON.stringify(nav))
  ok('/estoque: "Estoque" está marcado como ativo', estoque?.atual === true)

  await send('Target.closeTarget', { targetId })
}

/* ------------------------------------------------------------------ */
/* Resumo                                                              */
/* ------------------------------------------------------------------ */

console.log('\n' + '='.repeat(90))
console.log('INTERAÇÕES')
for (const c of checagens) {
  console.log(`${c.passou ? 'OK   ' : 'FALHA'} ${c.nome}${c.detalhe ? ' — ' + c.detalhe : ''}`)
}

const problemas = []
for (const r of relatorio) {
  const alvo = `${r.rota} [${r.viewport}]`
  if (r.erro) problemas.push(`${alvo}: erro de avaliação`)
  if (r.overflowCount) problemas.push(`${alvo}: ${r.overflowCount} com transbordo`)
  if (r.contrasteCount) problemas.push(`${alvo}: ${r.contrasteCount} com contraste baixo`)
  if (r.pequenosCount) problemas.push(`${alvo}: ${r.pequenosCount} alvos de toque pequenos`)
  if (r.idsRepetidos?.length) problemas.push(`${alvo}: ids repetidos ${r.idsRepetidos.join(', ')}`)
  if (r.saltoTitulos?.length) problemas.push(`${alvo}: salto de títulos ${r.saltoTitulos.join(', ')}`)
  if (r.quebrados?.length) problemas.push(`${alvo}: imagens quebradas`)
  if (r.imgSemAlt?.length) problemas.push(`${alvo}: imagem sem alt`)
  if (r.inputsSemLabel?.length) problemas.push(`${alvo}: campo sem rótulo`)
  if (r.linksSemNome) problemas.push(`${alvo}: ${r.linksSemNome} link(s) sem nome acessível`)
  if (r.console?.length) problemas.push(`${alvo}: erro de console`)
}
const falhasInteracao = checagens.filter((c) => !c.passou)

console.log(
  `\n${checagens.length - falhasInteracao.length} interações ok / ${falhasInteracao.length} falhas`,
)
if (problemas.length) {
  console.log('\nPROBLEMAS:')
  for (const p of problemas) console.log('  - ' + p)
} else {
  console.log('Nenhum problema estático encontrado.')
}

ws.close()
process.exit(problemas.length || falhasInteracao.length ? 1 : 0)
