import { Search, X } from 'lucide-react'
import type { BikeFilterState, Motorcycle } from '../../types'
import {
  ANO_MAX,
  ANO_MIN,
  ORDENACOES,
  PRECO_MAX,
  PRECO_MIN,
  categoriasDisponiveis,
  marcasDisponiveis,
  temFiltroAtivo,
} from '../../lib/filters'
import { formatPrice } from '../../lib/format'

interface BikeFiltersProps {
  filtros: BikeFilterState
  /** Estoque atual — usado só para listar as marcas que existem. */
  motos: Motorcycle[]
  onChange: (next: BikeFilterState) => void
  onClear: () => void
  /**
   * 'topo' (padrão): faixa horizontal de campos — usada no mobile.
   * 'lateral': coluna empilhada — usada na sidebar do desktop.
   */
  layout?: 'topo' | 'lateral'
}

export function BikeFilters({
  filtros,
  motos,
  onChange,
  onClear,
  layout = 'topo',
}: BikeFiltersProps) {
  const set = <K extends keyof BikeFilterState>(key: K, value: BikeFilterState[K]) =>
    onChange({ ...filtros, [key]: value })

  const marcas = marcasDisponiveis(motos)
  const categorias = categoriasDisponiveis(motos)
  const lateral = layout === 'lateral'

  // Chips de categoria só com o que existe no estoque. Com menos de duas
  // categorias distintas o controle não ajuda ninguém — some.
  const seletorDeCategoria =
    categorias.length >= 2 ? (
      <div role="group" aria-label="Categoria">
        <span aria-hidden="true" className="field-label">
          Categoria
        </span>
        <div className="flex flex-wrap gap-2">
          {(['todas', ...categorias] as BikeFilterState['categoria'][]).map((valor) => {
            const ativa = filtros.categoria === valor
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={ativa}
                onClick={() => set('categoria', valor)}
                className={`min-h-11 rounded-md border px-3.5 font-display text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
                  ativa
                    ? 'border-brand-500 bg-brand-500/15 text-brand-500'
                    : 'border-line-forte bg-night-800 text-steel-400 hover:border-white/25 hover:text-paper'
                }`}
              >
                {valor === 'todas' ? 'Todas' : valor}
              </button>
            )
          })}
        </div>
      </div>
    ) : null

  return (
    <form
      className={
        lateral
          ? 'surface flex flex-col gap-5 rounded-lg p-5'
          : 'surface rounded-lg p-4 sm:p-5'
      }
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filtros do estoque"
    >
      {lateral && (
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg tracking-[0.03em] uppercase">Filtros</h2>
          {temFiltroAtivo(filtros) && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs font-medium text-steel-400 transition-colors hover:text-paper"
            >
              <X className="size-3.5" aria-hidden="true" />
              Limpar
            </button>
          )}
        </div>
      )}

      {lateral && seletorDeCategoria}

      <div className={lateral ? 'flex flex-col gap-5' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-4'}>
        {!lateral && seletorDeCategoria && (
          <div className="md:col-span-2 lg:col-span-4">{seletorDeCategoria}</div>
        )}

        {/* Busca */}
        <div className={lateral ? '' : 'lg:col-span-2'}>
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

        {/* Marca */}
        <div>
          <label htmlFor="filtro-marca" className="field-label">
            Marca
          </label>
          <select
            id="filtro-marca"
            value={filtros.marca}
            onChange={(e) => set('marca', e.target.value)}
            className="select"
          >
            <option value="">Todas as marcas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenação */}
        <div className={lateral ? '' : 'md:col-span-2 lg:col-span-1'}>
          <label htmlFor="filtro-ordenacao" className="field-label">
            Ordenar por
          </label>
          <select
            id="filtro-ordenacao"
            value={filtros.ordenacao}
            onChange={(e) => set('ordenacao', e.target.value as BikeFilterState['ordenacao'])}
            className="select"
          >
            {ORDENACOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preço máximo */}
        <div className={lateral ? '' : 'md:col-span-1 lg:col-span-2'}>
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
            className="w-full accent-brand-500"
          />
          <div className="mt-1 flex justify-between text-[11px] text-steel-500">
            <span>{formatPrice(PRECO_MIN)}</span>
            <span>{formatPrice(PRECO_MAX)}</span>
          </div>
        </div>

        {/* Ano mínimo */}
        <div className={lateral ? '' : 'md:col-span-1 lg:col-span-2'}>
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
            className="w-full accent-brand-500"
          />
          <div className="mt-1 flex justify-between text-[11px] text-steel-500">
            <span>{ANO_MIN}</span>
            <span>{ANO_MAX}</span>
          </div>
        </div>
      </div>

      {!lateral && temFiltroAtivo(filtros) && (
        <div className="mt-4 border-t border-line pt-4">
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
