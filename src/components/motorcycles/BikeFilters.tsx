import { Search, X } from 'lucide-react'
import type { BikeFilterState, Motorcycle } from '../../types'
import {
  ANO_MAX,
  ANO_MIN,
  ORDENACOES,
  PRECO_MAX,
  PRECO_MIN,
  marcasDisponiveis,
  modelosDisponiveis,
} from '../../lib/filters'
import { formatPrice } from '../../lib/format'

interface BikeFiltersProps {
  filtros: BikeFilterState
  /** Estoque atual — usado só para listar as marcas que existem. */
  motos: Motorcycle[]
  onChange: (next: BikeFilterState) => void
  /** Aplica o rascunho quando o formulário é enviado (Enter em um campo). */
  onAplicar?: () => void
  /**
   * Prefixo dos `id` dos campos.
   *
   * A página de estoque desenha os filtros duas vezes — a folha do
   * celular e a coluna do desktop — e as duas cópias ficam no DOM
   * ao mesmo tempo. Sem prefixo, os `id` se repetem e o `label`
   * aponta sempre para o campo da cópia escondida: clicar no rótulo
   * do desktop focaria o input invisível do celular.
   */
  prefix?: string
}

/**
 * Filtros do estoque — a bancada de trabalho da vitrine.
 *
 * A coluna é organizada em seções curtas (marca/modelo, preço, ano e
 * ordenação) em vez de uma pilha de controles soltos. Cada campo
 * compartilha o mesmo desenho de input: fundo da bancada, canto
 * arredondado e foco vermelho.
 */
export function BikeFilters({
  filtros,
  motos,
  onChange,
  onAplicar,
  prefix = 'filtro',
}: BikeFiltersProps) {
  const set = <K extends keyof BikeFilterState>(key: K, value: BikeFilterState[K]) =>
    onChange({ ...filtros, [key]: value })

  const marcas = marcasDisponiveis(motos)
  // Os modelos seguem a marca escolhida (a troca de marca solta o
  // modelo no onChange do select acima).
  const modelos = modelosDisponiveis(motos, filtros.marca)

  const legenda = 'mb-3 block font-sans text-[13px] leading-none font-semibold text-texto'

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        onAplicar?.()
      }}
      aria-label="Filtros do estoque"
    >
      <div>
        <label htmlFor={`${prefix}-busca`} className="field-label">
          Buscar
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-3"
            aria-hidden="true"
          />
          <input
            id={`${prefix}-busca`}
            type="search"
            value={filtros.busca}
            onChange={(e) => set('busca', e.target.value)}
            placeholder="Marca, modelo ou ano"
            className="h-11 w-full rounded-xl border border-borda bg-fundo px-3 py-2 pr-10 pl-9 text-sm text-texto transition-colors placeholder:text-texto-3 focus:border-marca focus:ring-1 focus:ring-marca/30 focus:outline-none"
          />
          {filtros.busca ? (
            <button
              type="button"
              onClick={() => set('busca', '')}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-texto-3 transition-colors hover:bg-painel-2 hover:text-texto"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <fieldset className="min-w-0 border-0 p-0">
        <legend className={legenda}>Marca e modelo</legend>
        <div className="space-y-3">
          <div>
            <label htmlFor={`${prefix}-marca`} className="field-label">
              Marca
            </label>
            <select
              id={`${prefix}-marca`}
              value={filtros.marca}
              onChange={(e) => {
                const marca = e.target.value
                onChange({
                  ...filtros,
                  marca,
                  modelo: '',
                })
              }}
              className="select h-11 rounded-xl bg-fundo text-sm"
            >
              <option value="">Todas as marcas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${prefix}-modelo`} className="field-label">
              Modelo
            </label>
            {filtros.marca ? (
              <select
                id={`${prefix}-modelo`}
                value={filtros.modelo}
                onChange={(e) => set('modelo', e.target.value)}
                className="select h-11 rounded-xl bg-fundo text-sm"
              >
                <option value="">Todos os modelos</option>
                {modelos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <select
                id={`${prefix}-modelo`}
                disabled
                aria-disabled="true"
                className="select h-11 rounded-xl bg-fundo text-sm opacity-60"
              >
                <option value="">Escolha a marca</option>
              </select>
            )}
          </div>
        </div>
      </fieldset>

      {/* Faixa de preço em dois puxadores (o chão e o teto), o par
          clássico dos catálogos de veículos. Um não passa do outro. */}
      <fieldset className="min-w-0 border-0 p-0">
        <legend className={legenda}>Faixa de preço</legend>
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label
                htmlFor={`${prefix}-preco-min`}
                className="text-xs text-texto-3"
              >
                Mínimo
              </label>
              <span className="numeros rounded-md bg-painel-3/60 px-2 py-0.5 text-xs font-semibold text-texto">
                {formatPrice(filtros.precoMin)}
              </span>
            </div>
            <input
              id={`${prefix}-preco-min`}
              type="range"
              min={PRECO_MIN}
              max={PRECO_MAX}
              step={1000}
              value={filtros.precoMin}
              onChange={(e) =>
                set('precoMin', Math.min(Number(e.target.value), filtros.precoMax - 1000))
              }
              className="w-full"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label
                htmlFor={`${prefix}-preco-max`}
                className="text-xs text-texto-3"
              >
                Máximo
              </label>
              <span className="numeros rounded-md bg-painel-3/60 px-2 py-0.5 text-xs font-semibold text-texto">
                {formatPrice(filtros.precoMax)}
              </span>
            </div>
            <input
              id={`${prefix}-preco-max`}
              type="range"
              min={PRECO_MIN}
              max={PRECO_MAX}
              step={1000}
              value={filtros.precoMax}
              onChange={(e) =>
                set('precoMax', Math.max(Number(e.target.value), filtros.precoMin + 1000))
              }
              className="w-full"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="min-w-0 border-0 p-0">
        <legend className={legenda}>Ano</legend>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor={`${prefix}-ano`} className="text-xs text-texto-3">
            A partir de
          </label>
          <span className="numeros rounded-md bg-painel-3/60 px-2 py-0.5 text-xs font-semibold text-texto">
            {filtros.anoMin}
          </span>
        </div>
        <input
          id={`${prefix}-ano`}
          type="range"
          min={ANO_MIN}
          max={ANO_MAX}
          step={1}
          value={filtros.anoMin}
          onChange={(e) => set('anoMin', Number(e.target.value))}
          className="w-full"
        />
        <div className="numeros mt-1 flex justify-between text-[11px] text-texto-3">
          <span>{ANO_MIN}</span>
          <span>{ANO_MAX}</span>
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${prefix}-ordenacao`} className="mb-2 block text-[13px] font-semibold text-texto">
          Ordenação
        </label>
        <select
          id={`${prefix}-ordenacao`}
          value={filtros.ordenacao}
          onChange={(e) =>
            set('ordenacao', e.target.value as BikeFilterState['ordenacao'])
          }
          className="select h-11 rounded-xl bg-fundo text-sm"
        >
          {ORDENACOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  )
}
