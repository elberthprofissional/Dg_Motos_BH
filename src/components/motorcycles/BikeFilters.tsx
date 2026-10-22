import { Search, X } from 'lucide-react'
import type { BikeFilterState, Motorcycle } from '../../types'
import {
  ANO_MAX,
  ANO_MIN,
  PRECO_MAX,
  PRECO_MIN,
  categoriasDisponiveis,
  marcasDisponiveis,
  modelosDisponiveis,
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
 * Filtros do estoque — a coluna de trabalho.
 *
 * Estreita e vertical, como a bancada de quem separa peças: campos
 * empilhados, cada um com o rótulo em cima. O visitante desce a
 * lista estreitando o pátio: marca, depois modelo (em cascata),
 * ano, faixa de preço e categoria — e o resultado reage na hora,
 * sem botão de busca no meio do caminho.
 */
export function BikeFilters({
  filtros,
  motos,
  onChange,
  onClear,
  prefix = 'filtro',
}: BikeFiltersProps) {
  const set = <K extends keyof BikeFilterState>(key: K, value: BikeFilterState[K]) =>
    onChange({ ...filtros, [key]: value })

  const marcas = marcasDisponiveis(motos)
  // Os modelos seguem a marca escolhida (a troca de marca solta o
  // modelo no onChange do select acima).
  const modelos = modelosDisponiveis(motos, filtros.marca)

  const categorias = categoriasDisponiveis(motos)

  // Chips de categoria só com o que existe no estoque. Com menos de duas
  // categorias distintas o controle não ajuda ninguém — some.
  const seletorDeCategoria =
    categorias.length >= 2 ? (
      <div role="group" aria-label="Categoria">
        <span aria-hidden="true" className="field-label">
          Categoria
        </span>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {(['todas', ...categorias] as BikeFilterState['categoria'][]).map((valor) => {
            const ativa = filtros.categoria === valor
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={ativa}
                onClick={() => set('categoria', valor)}
                className={`min-h-11 py-2 font-sans text-sm font-medium transition-colors ${
                  ativa ? 'text-marca-texto' : 'text-texto-3 hover:text-texto'
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
      className="flex flex-col gap-5 border-t border-borda pt-5"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filtros do estoque"
    >
      <div>
        <label htmlFor={`${prefix}-busca`} className="field-label">
          Buscar por marca ou modelo
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
            placeholder="Ex.: Honda XRE, Fazer, Lander..."
            className="input text-base pl-9"
          />
        </div>
      </div>

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
          className="select text-base"
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
            className="select text-base"
          >
            <option value="">Todos os modelos</option>
            {modelos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <select id={`${prefix}-modelo`} disabled aria-disabled="true" className="select text-base opacity-60">
            <option value="">Escolha a marca primeiro</option>
          </select>
        )}
      </div>

      <div>
        <label htmlFor={`${prefix}-ano`} className="field-label">
          Ano a partir de <span className="text-texto numeros">{filtros.anoMin}</span>
        </label>
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
        <div className="pequeno mt-1 flex justify-between text-texto-3 numeros">
          <span>{ANO_MIN}</span>
          <span>{ANO_MAX}</span>
        </div>
      </div>

      {/* Faixa de preço em dois puxadores (o chão e o teto), o par
          clássico dos catálogos de veículos. Um não passa do outro. */}
      <fieldset className="border-0 p-0">
        <legend className="field-label">Preço</legend>
        <div>
          <label htmlFor={`${prefix}-preco-min`} className="pequeno mb-1 block text-texto-3">
            De <span className="text-texto numeros">{formatPrice(filtros.precoMin)}</span>
          </label>
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
        <div className="mt-2">
          <label htmlFor={`${prefix}-preco-max`} className="pequeno mb-1 block text-texto-3">
            Até <span className="text-texto numeros">{formatPrice(filtros.precoMax)}</span>
          </label>
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
      </fieldset>

      {seletorDeCategoria}

      {temFiltroAtivo(filtros) && (
        <button
          type="button"
          onClick={onClear}
          className="btn btn-secondary btn-sm w-full justify-center"
        >
          <X className="size-4" aria-hidden="true" />
          Limpar filtros
        </button>
      )}
    </form>
  )
}
