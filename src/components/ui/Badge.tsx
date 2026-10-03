import type { ReactNode } from 'react'

/**
 * Selo de status.
 *
 * Um só lugar para os estados do painel. As variantes são semânticas:
 * `ok` é verde (positivo), `alerta` é âmbar, `vendido` é cinza apagado e
 * `destaque` é o vermelho da marca. Nenhuma delas depende só da cor —
 * todas trazem texto, e o `Ponto` dá um segundo canal de leitura para
 * quem não distingue verde de vermelho.
 */
export type VarianteBadge = 'ok' | 'neutro' | 'atencao' | 'marca' | 'apagado'

const VARIANTES: Record<VarianteBadge, string> = {
  ok: 'border-ok/40 bg-ok/10 text-ok',
  neutro: 'border-white/15 bg-white/5 text-steel-300',
  atencao: 'border-warn/40 bg-warn/10 text-warn',
  marca: 'border-brand-500/40 bg-brand-500/10 text-brand-500',
  apagado: 'border-white/10 bg-white/5 text-steel-500',
}

export function Badge({
  variante = 'neutro',
  ponto,
  children,
}: {
  variante?: VarianteBadge
  /** Ponto filled à esquerda: redundância proposital com a cor. */
  ponto?: boolean
  children: ReactNode
}) {
  return (
    <span className={`badge ${VARIANTES[variante]}`}>
      {ponto && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}