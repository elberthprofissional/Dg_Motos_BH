import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { ReactNode } from 'react'

export type TipoAviso = 'ok' | 'erro' | 'info'

const ESTILOS: Record<TipoAviso, { caixa: string; icone: typeof Info }> = {
  ok: { caixa: 'border-ok/40 bg-ok/10 text-ok', icone: CheckCircle2 },
  erro: { caixa: 'border-brand-500/40 bg-brand-500/10 text-brand-500', icone: AlertCircle },
  info: { caixa: 'border-white/15 bg-white/5 text-steel-300', icone: Info },
}

/**
 * Aviso inline de resultado de operação.
 *
 * `ok` e `erro` saem com `role="status"`/`role="alert"`: o leitor de tela
 * anuncia a mudança sem o usuário precisar procurar o texto.
 *
 * Antes havia quatro implementações diferentes no painel (MotoForm,
 * ConfiguracoesTab, PhotoUploader e o erro do upload); agora há uma.
 */
export function Aviso({ tipo, children }: { tipo: TipoAviso; children: ReactNode }) {
  const { caixa, icone: Icone } = ESTILOS[tipo]
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-xs leading-relaxed ${caixa}`}
    >
      <Icone className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}