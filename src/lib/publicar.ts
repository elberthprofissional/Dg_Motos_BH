/**
 * ============================================================
 * PUBLICAÇÃO AUTOMÁTICA — "salvar já publica"
 * ============================================================
 *
 * Toda vez que o dono salva algo no painel (estoque, configurações),
 * além de gravar no Supabase, agendamos um rebuild na Vercel/Netlify
 * via Deploy Hook. O hook reconstrói o site estático — é isso que
 * alimenta o Google, o sitemap e as prévias de compartilhamento.
 *
 * Para o VISITANTE não muda nada: a vitrine lê do banco ao vivo, então
 * o que o dono salva já aparece na hora. O rebuild é só para o Google
 * enxergar a versão nova no HTML estático.
 *
 * Debounce: o dono pode salvar três motos seguidas. Em vez de três
 * builds, um único hook dispara 2 minutos depois do ÚLTIMO save. Deploy
 * hook não aceita payload: é sempre um rebuild completo.
 *
 * O hook é um segurançinha fraco por natureza: a URL VITE_ vai no
 * bundle e o pior que alguém consegue é disparar um rebuild a mais
 * (que reconstrói o mesmo conteúdo do banco). Aceitável para este uso.
 */

/** Intervalo de espera após o último save antes de chamar o hook. */
export const ATRASO_DEBOUNCE_MS = 2 * 60 * 1000

export type EstadoPublicacao =
  | { fase: 'ociosa' }
  | { fase: 'aguardando'; publicarEm: number } // timestamp alvo
  | { fase: 'publicando' }
  | { fase: 'publicado'; em: number } // timestamp da conclusão
  | { fase: 'erro'; mensagem: string }

type Ouvinte = (estado: EstadoPublicacao) => void

let estado: EstadoPublicacao = { fase: 'ociosa' }
const ouvintes = new Set<Ouvinte>()
let timer: ReturnType<typeof setTimeout> | null = null

function setEstado(proximo: EstadoPublicacao) {
  estado = proximo
  for (const o of ouvintes) o(estado)
}

/** Estado atual (para inicializar UI sem esperar o primeiro evento). */
export function estadoPublicacao(): EstadoPublicacao {
  return estado
}

/** Assina mudanças de estado. Devolve a função de cancelamento. */
export function observarPublicacao(o: Ouvinte): () => void {
  ouvintes.add(o)
  return () => ouvintes.delete(o)
}

/**
 * O Vite substitui `import.meta.env.VITE_X` pelo valor literal no build,
 * então mutar o objeto em teste não afeta a leitura. Para os testes
 * controlarem o cenário, a URL pode ser injetada por cima.
 */
let hookUrlOverride: string | null | undefined

/** Somente para testes: força a URL do hook (null = não configurado). */
export function definirHookUrlParaTeste(valor: string | null): void {
  hookUrlOverride = valor
}

/** Volta o módulo ao estado inicial (testes). */
export function resetPublicacao(): void {
  if (timer) clearTimeout(timer)
  timer = null
  hookUrlOverride = undefined
  setEstado({ fase: 'ociosa' })
}

function hookUrl(): string | null {
  const bruto =
    hookUrlOverride !== undefined
      ? hookUrlOverride
      : (import.meta.env as { VITE_DEPLOY_HOOK_URL?: string }).VITE_DEPLOY_HOOK_URL
  const url = bruto?.trim()
  return url ? url : null
}

/** O publish-automático está configurado neste deploy? */
export function publicacaoDisponivel(): boolean {
  return hookUrl() !== null
}

/**
 * Agenda a publicação (chamar após QUALQUER save no painel).
 *
 * - Sem hook configurado: não faz nada (graceful).
 * - Com timer rodando: empurra o alvo para daqui a `ATRASO_DEBOUNCE_MS`.
 * - Último save dispara `POST` no hook e vira estado `publicado`.
 */
export function agendarPublicacao(): void {
  const url = hookUrl()
  if (!url) return

  if (timer) clearTimeout(timer)

  const publicarEm = Date.now() + ATRASO_DEBOUNCE_MS
  setEstado({ fase: 'aguardando', publicarEm })

  timer = setTimeout(() => {
    timer = null
    void disparar(url)
  }, ATRASO_DEBOUNCE_MS)
}

async function disparar(url: string): Promise<void> {
  setEstado({ fase: 'publicando' })
  try {
    // Deploy hooks são POST sem body; `cache: 'no-store'` evita um
    // proxy responder com cache em vez de disparar o build.
    const r = await fetch(url, { method: 'POST', cache: 'no-store' })
    if (!r.ok) {
      setEstado({ fase: 'erro', mensagem: `O host respondeu ${r.status}.` })
      return
    }
    setEstado({ fase: 'publicado', em: Date.now() })
  } catch {
    setEstado({
      fase: 'erro',
      mensagem: 'Sem conexão com o host. A alteração está salva no painel.',
    })
  }
}
