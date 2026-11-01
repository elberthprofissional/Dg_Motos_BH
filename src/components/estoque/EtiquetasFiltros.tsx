import { SlidersHorizontal, X } from 'lucide-react'

/**
 * ============================================================
 * RESUMO DOS FILTROS ATIVOS (ETIQUETAS REMOVÍVEIS)
 * ============================================================
 * Cada etiqueta sabe desfazer só o próprio campo. A ordenação não
 * entra na conta — ela organiza, não restringe o pátio.
 */

export interface EtiquetaFiltro {
  chave: string
  rotulo: string
  limpar: () => void
}

export function EtiquetasFiltros({
  ativos,
  onLimparTudo,
}: {
  ativos: EtiquetaFiltro[]
  onLimparTudo: () => void
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {ativos.map((ativo) => (
        <button
          key={ativo.chave}
          type="button"
          onClick={ativo.limpar}
          className="inline-flex items-center gap-2 rounded-full border border-borda bg-painel-2 px-3 py-1.5 font-sans text-xs text-texto-2 transition-colors hover:border-borda-forte hover:text-texto"
        >
          {ativo.rotulo}
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onLimparTudo}
        className="px-1 py-1.5 font-sans text-xs font-semibold text-marca-texto transition-colors hover:text-texto"
      >
        Limpar tudo
      </button>
    </div>
  )
}

/**
 * Botão flutuante de filtro — só no celular. Abre a folha no <dialog>
 * da página e mostra a contagem de filtros ativos.
 */
export function BotaoFiltrosFlutuante({
  abertos,
  contarAtivos,
  onAbrir,
}: {
  abertos: boolean
  contarAtivos: number
  onAbrir: (gatilho: HTMLElement) => void
}) {
  const temAtivos = contarAtivos > 0

  return (
    <button
      type="button"
      onClick={(e) => onAbrir(e.currentTarget)}
      aria-label={
        temAtivos ? `Abrir filtros, ${contarAtivos} ativos` : 'Abrir filtros'
      }
      aria-expanded={abertos}
      aria-haspopup="dialog"
      className="fixed left-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 grid size-14 place-items-center rounded-2xl border border-borda-forte bg-painel-2 text-texto transition-colors hover:border-marca hover:text-marca-texto lg:hidden"
    >
      <SlidersHorizontal className="size-6" aria-hidden="true" />
      {temAtivos ? (
        <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-marca font-sans text-[11px] font-bold text-white">
          {contarAtivos}
        </span>
      ) : null}
    </button>
  )
}
