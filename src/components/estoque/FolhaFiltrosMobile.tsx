import type { MutableRefObject } from 'react'
import { X } from 'lucide-react'
import type { Motorcycle } from '../../types'
import type { BikeFilterState } from '../../types'
import { BikeFilters } from '../motorcycles/BikeFilters'

/**
 * ============================================================
 * FOLHA DE FILTROS DO CELULAR
 * ============================================================
 * Dialog nativo — foco preso, Esc e camada superior de graça.
 * Edita um rascunho; aplicar é decisão do dono (botão no pé).
 */

export function FolhaFiltrosMobile({
  motos,
  rascunho,
  precoMaximo,
  folhaRef,
  aoMudar,
  onAplicar,
  onCancelar,
  onLimpar,
}: {
  motos: Motorcycle[]
  /** Rascunho com o teto já resolvido. */
  rascunho: BikeFilterState
  precoMaximo: number
  folhaRef: MutableRefObject<HTMLDialogElement | null>
  aoMudar: (proximo: BikeFilterState) => void
  onAplicar: () => void
  onCancelar: () => void
  onLimpar: () => void
}) {
  return (
    <dialog
      ref={(el) => {
        folhaRef.current = el
        if (el && !el.open) el.showModal()
      }}
      onClose={() => {
        onCancelar()
      }}
      className="menu-mobile"
      aria-label="Filtros do estoque"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-borda px-5 py-4">
          <div>
            <h2 className="font-display text-lg leading-none font-bold text-texto">
              Filtrar
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            aria-label="Fechar filtros"
            className="btn-icone rounded-xl"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          <BikeFilters
            filtros={rascunho}
            motos={motos}
            precoMaximo={precoMaximo}
            onChange={aoMudar}
            onAplicar={onAplicar}
            prefix="filtro-m"
          />
        </div>

        <div className="border-t border-borda bg-painel px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onLimpar}
              className="rounded-xl border border-borda px-4 py-3 text-sm text-texto-2 transition-colors hover:border-borda-forte hover:text-texto"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={onAplicar}
              className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-black transition-colors hover:bg-neutral-200"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
