/*
 * ============================================================
 * SERVICE WORKER — DG Motos
 * ============================================================
 * Um SW de verdade (com estratégia de cache) adicionaria uma camada
 * a mais para o dono depurar quando uma moto não atualiza. Aqui a
 * função é outra: dar ao app instalado a casca offline e o requisito
 * técnico do PWA sem virar fonte de dado velho.
 *
 * Regra de ouro: nada de cachear API (Supabase) nem HTML das fichas —
 * eles mudam e precisam vir sempre do servidor. Só o shell estático
 * (ícones, manifest, fonte do app) entra em cache.
 */

const CACHE = 'dg-motos-shell-v1'

// Apenas a casca: o build injeta os assets com hash no index; o que
// pré-cacheamos aqui é o que não muda de nome.
const CASCA = ['/', '/manifest.webmanifest', '/logo.webp', '/favicon.webp']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CASCA))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Só same-origin; chamadas ao Supabase passam direto.
  if (url.origin !== self.location.origin) return

  // Navegação (HTML) e assets com hash do Vite: rede primeiro, cache
  // como rede de segurança quando offline. Assim um deploy novo nunca
  // fica preso numa versão antiga do painel.
  const ehNavegacao = request.mode === 'navigate'
  const ehAsset = url.pathname.startsWith('/assets/')
  if (!ehNavegacao && !ehAsset) return

  evento.respondWith(
    fetch(request)
      .then((resposta) => {
        const copia = resposta.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copia)).catch(() => undefined)
        return resposta
      })
      .catch(() =>
        caches.match(request).then((cacheado) => cacheado ?? caches.match('/')),
      ),
  )
})
