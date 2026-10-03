import { useEffect, useState } from 'react'
import { CheckCircle2, CloudUpload, Loader2, TriangleAlert } from 'lucide-react'
import {
  observarPublicacao,
  publicacaoDisponivel,
  ATRASO_DEBOUNCE_MS,
} from '../../lib/publicar'
import type { EstadoPublicacao } from '../../lib/publicar'

/**
 * Pílula de status da publicação automática (topbar do painel).
 *
 * Comunica ao dono o que acontece depois que ele salva:
 *  - aguardando: contagem regressiva até o hook disparar (debounce);
 *  - publicando: build em andamento no host;
 *  - publicado: site reconstruído (Google/prévias atualizados);
 *  - erro: o save está seguro no banco; só o rebuild falhou.
 *
 * Sem VITE_DEPLOY_HOOK_URL a pílula nem aparece — o painel continua
 * funcionando como hoje (vitrine ao vivo; Google atualiza no próximo
 * deploy manual).
 *
 * ============================================================
 * `compacto`: a versão do celular
 * ============================================================
 * No celular a topbar tem 48px e precisa caber "Estoque" + sino. O texto
 * "Publica em 42s" empurraria o título para truncate. Então a versão
 * compacta mostra só o ícone, mantendo:
 *  - o mesmo `role="status"` e o mesmo texto no `aria-label`, para o
 *    leitor de tela não perder a informação;
 *  - o `title`, que dá o texto no hover do desktop estreito.
 */
export function PublicacaoStatus({ compacto = false }: { compacto?: boolean }) {
  const [estado, setEstado] = useState<EstadoPublicacao>(() => {
    if (!publicacaoDisponivel()) return { fase: 'ociosa' }
    return { fase: 'aguardando', publicarEm: 0 }
  })
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    if (!publicacaoDisponivel()) return
    return observarPublicacao(setEstado)
  }, [])

  // Contagem regressiva da pílula "publicando em Xs".
  useEffect(() => {
    if (estado.fase !== 'aguardando' || estado.publicarEm === 0) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [estado])

  if (!publicacaoDisponivel()) return null
  if (estado.fase === 'ociosa' || (estado.fase === 'aguardando' && estado.publicarEm === 0)) {
    return null
  }

  // --------------------------------------------------------------
  // Ícone + cor por fase. O texto da fase vai para aria-label/title.
  // --------------------------------------------------------------
  let texto: string
  let classes: string
  let Icone = CloudUpload

  if (estado.fase === 'aguardando') {
    const restante = Math.max(0, Math.ceil((estado.publicarEm - agora) / 1000))
    const total = Math.ceil(ATRASO_DEBOUNCE_MS / 1000)
    if (restante >= total - 2) return null // save acabou de acontecer: ainda silenciosa
    texto = `Publica em ${restante}s`
    classes = 'border-white/15 bg-white/5 text-steel-300'
    Icone = CloudUpload
  } else if (estado.fase === 'publicando') {
    texto = 'Publicando site…'
    classes = 'border-white/15 bg-white/5 text-steel-300'
    Icone = Loader2
  } else if (estado.fase === 'publicado') {
    texto = 'Site publicado'
    classes = 'border-ok/40 bg-ok/10 text-ok'
    Icone = CheckCircle2
  } else {
    texto = 'Site salvo — falhou publicar'
    classes = 'border-warn/40 bg-warn/10 text-warn'
    Icone = TriangleAlert
  }

  if (compacto) {
    return (
      <span
        role="status"
        aria-label={texto}
        title={estado.fase === 'erro' ? (estado.mensagem ?? texto) : texto}
        className={`grid size-8 shrink-0 place-items-center rounded-full border sm:hidden ${classes}`}
      >
        <Icone
          className={`size-3.5 ${estado.fase === 'publicando' ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex max-w-56 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${classes}`}
      role="status"
      title={estado.fase === 'erro' ? estado.mensagem : undefined}
    >
      <Icone
        className={`size-3.5 shrink-0 ${estado.fase === 'publicando' ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      {texto}
    </span>
  )
}