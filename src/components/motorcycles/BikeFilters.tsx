import { Search, X } from 'lucide-react'
import type { BikeFilterState } from '../../types'
import {
  ANO_MAX,
  ANO_MIN,
  CATEGORIAS,
  ORDENACOES,
  PRECO_MAX,
  PRECO_MIN,
  temFiltroAtivo,
} from '../../lib/filters'
import { formatPrice } from '../../lib/format'

interface BikeFiltersProps {
  filtros: BikeFilterState
  onChange: (next: BikeFilterState) => void
  onClear: () => void
}

export function BikeFilters({ filtros, onChange, onClear }: BikeFiltersProps) {
  const set = <K extends keyof BikeFilterState>(key: K, value: BikeFilterState[K]) =>
    onChange({ ...filtros, [key]: value })

  return (
    <form
      className="surface rounded-lg p-4 sm:p-5"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filtros do estoque"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Busca */}
        <div className="lg:col-span-2">
          <label htmlFor="filtro-busca" className="field-label">
            Buscar por marca ou modelo
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel-500"
              aria-hidden="true"
            />
            <input
              id="filtro-busca"
              type="search"
              value={filtros.busca}
              onChange={(e) => set('busca', e.target.value)}
              placeholder="Ex.: Honda XRE, Fazer, Lander..."
              className="input pl-9"
            />
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="filtro-categoria" className="field-label">
            Categoria
          </label>
          <select
            id="filtro-categoria"
            value={filtros.categoria}
            onChange={(e) =>
              set('categoria', e.target.value as BikeFilterState['categoria'])
            }
            className="input"
          >
            <option value="todas">Todas as categorias</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenação */}
        <div>
          <label htmlFor="filtro-ordenacao" className="field-label">
            Ordenar por
          </label>
          <select
            id="filtro-ordenacao"
            value={filtros.ordenacao}
            onChange={(e) => set('ordenacao', e.target.value as BikeFilterState['ordenacao'])}
            className="input"
          >
            {ORDENACOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preço máximo */}
        <div className="md:col-span-1 lg:col-span-2">
          <label htmlFor="filtro-preco" className="field-label">
            Preço até <span className="text-paper">{formatPrice(filtros.precoMax)}</span>
          </label>
          <input
            id="filtro-preco"
            type="range"
            min={PRECO_MIN}
            max={PRECO_MAX}
            step={1000}
            value={filtros.precoMax}
            onChange={(e) => set('precoMax', Number(e.target.value))}
            className="w-full accent-[#E21B23]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-steel-500">
            <span>{formatPrice(PRECO_MIN)}</span>
            <span>{formatPrice(PRECO_MAX)}</span>
          </div>
        </div>

        {/* Ano mínimo */}
        <div className="md:col-span-1 lg:col-span-2">
          <label htmlFor="filtro-ano" className="field-label">
            Ano a partir de <span className="text-paper">{filtros.anoMin}</span>
          </label>
          <input
            id="filtro-ano"
            type="range"
            min={ANO_MIN}
            max={ANO_MAX}
            step={1}
            value={filtros.anoMin}
            onChange={(e) => set('anoMin', Number(e.target.value))}
            className="w-full accent-[#E21B23]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-steel-500">
            <span>{ANO_MIN}</span>
            <span>{ANO_MAX}</span>
          </div>
        </div>
      </div>

      {temFiltroAtivo(filtros) && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-300 transition-colors hover:text-paper"
          >
            <X className="size-4" aria-hidden="true" />
            Limpar filtros
          </button>
        </div>
      )}
    </form>
  )
}
