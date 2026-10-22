import type { ReactNode } from 'react'

/**
 * Selo de status.
 *
 * Um só lugar para os estados do painel e da vitrine. As variantes
 * são semânticas: `ok` é verde (positivo), `alerta` é âmbar,
 * `vendido` é cinza apagado e `marca` é o carimbo da casa.
 * Nenhuma delas depende só da cor — todas trazem texto, e o `Ponto`
 * dá um segundo canal de leitura para quem não distingue verde
 * de vermelho.
 */
export type VarianteBadge = 'ok' | 'neutro' | 'atencao' | 'marca' | 'apagado'

const VARIANTES: Record<VarianteBadge, string> = {
  ok: 'border-ok/40 bg-ok/10 text-ok',
  neutro: 'border-borda-forte bg-painel-2 text-texto-2',
  atencao: 'border-alerta/40 bg-alerta/10 text-alerta',
  marca: 'border-marca/40 bg-marca/10 text-marca-texto',
  apagado: 'border-borda bg-painel-2 text-texto-3',
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
      {ponto && <span className="size-1.5 shrink-0 bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
