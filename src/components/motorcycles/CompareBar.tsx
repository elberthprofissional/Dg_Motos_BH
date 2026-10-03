import { Link } from 'react-router-dom'
import { GitCompare, Trash2, X } from 'lucide-react'
import { useCompare, slugsToBikes } from '../../hooks/useCompare'
import { useCatalogo } from '../../hooks/useCatalogo'
import { SmartImage } from '../ui/SmartImage'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

/**
 * Barra fixa no rodapé quando há motos selecionadas para
 * comparação. O botão abre o painel de comparação no estoque.
 */
export function CompareBar() {
  const { slugs, toggle, limpar, MAX } = useCompare()
  const { motos } = useCatalogo()
  const bikes = slugsToBikes(slugs, motos)

  if (bikes.length === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-night-950/95 backdrop-blur">
      <div className="container-site flex flex-wrap items-center gap-3 py-3">
        <span className="hidden items-center gap-2 font-display text-xs font-semibold tracking-[0.18em] text-steel-400 uppercase sm:inline-flex">
          <GitCompare className="size-4" aria-hidden="true" />
          Comparar ({bikes.length}/{MAX})
        </span>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          {bikes.map((bike) => (
            <span
              key={bike.id}
              className="relative inline-flex items-center overflow-hidden rounded border border-white/10"
            >
              <SmartImage
                src={bike.imagens[0]?.src ?? PLACEHOLDER_CARD}
                alt={`${bike.marca} ${bike.modelo}`}
                className="h-11 w-16"
                width={64}
                height={44}
              />
              <button
                type="button"
                onClick={() => toggle(bike.slug)}
                aria-label={`Remover ${bike.marca} ${bike.modelo} da comparação`}
                className="grid h-full w-7 place-items-center bg-night-900 text-steel-400 transition-colors hover:text-brand-500"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}

          {bikes.length === 1 && (
            <span className="text-xs text-steel-500">
              Selecione mais {MAX - 1} no card para comparar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={limpar}
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-xs font-medium text-steel-400 transition-colors hover:text-paper"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Limpar
          </button>
          <Link
            to="/estoque#comparar"
            className="inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2 font-display text-xs font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-brand-600"
          >
            Comparar
          </Link>
        </div>
      </div>
    </div>
  )
}
