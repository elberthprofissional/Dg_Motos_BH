import type { ReactNode } from 'react'

/**
 * ============================================================
 * GRUPO DE CAMPOS DE UMA SEÇÃO DO FORMULÁRIO
 * ============================================================
 */

/** Grupo de campos com título de seção do painel: fio + carimbo vermelho. */
export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-xs font-semibold tracking-[0.14em] text-steel-400 uppercase">
        <span aria-hidden="true" className="h-px w-6 bg-brand-500" />
        {titulo}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
