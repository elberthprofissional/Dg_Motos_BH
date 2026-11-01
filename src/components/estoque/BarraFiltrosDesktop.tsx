import type { Motorcycle } from '../../types'
import {
  ANO_MAX,
  ANO_MIN,
  ORDENACOES,
  PRECO_MIN,
  marcasDisponiveis,
  modelosDisponiveis,
} from '../../lib/filters'
import type { BikeFilterState } from '../../types'
import { formatPrice } from '../../lib/format'
import { Search } from 'lucide-react'

/**
 * ============================================================
 * BARRA DE FILTROS DO DESKTOP
 * ============================================================
 * Uma linha acima do grid, à la catálogo simples — sem coluna
 * lateral. Aplica na hora (o mesmo caminho dos chips); o botão de
 * aplicar ficou pro celular, que continua com a folha de rascunho
 * intacta.
 */

export function BarraFiltrosDesktop({
  motos,
  filtros,
  filtrosAtuais,
  precoMaximo,
  temAtivos,
  atualizar,
  limparFiltros,
}: {
  motos: Motorcycle[]
  filtros: BikeFilterState
  /** Filtros aplicados com o teto resolvido — o slider lê daqui. */
  filtrosAtuais: BikeFilterState
  precoMaximo: number
  temAtivos: boolean
  atualizar: (patch: Partial<BikeFilterState>) => void
  limparFiltros: () => void
}) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filtros do estoque"
      className="mb-6 hidden flex-wrap items-end gap-3 bg-painel p-4 lg:flex"
    >
      <div className="min-w-44 flex-1">
        <label htmlFor="barra-busca" className="field-label">
          Buscar
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-texto-3"
            aria-hidden="true"
          />
          <input
            id="barra-busca"
            type="search"
            value={filtros.busca}
            onChange={(e) => atualizar({ busca: e.target.value })}
            placeholder="Marca, modelo ou ano"
            className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 pr-8 pl-8 text-[13px] text-neutral-200 transition-colors placeholder:text-texto-3 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600/30 focus:outline-none"
          />
        </div>
      </div>

      <div className="w-40">
        <label htmlFor="barra-marca" className="field-label">
          Marca
        </label>
        <select
          id="barra-marca"
          value={filtros.marca}
          onChange={(e) => atualizar({ marca: e.target.value, modelo: '' })}
          className="select h-10 w-full rounded-lg border-neutral-800 bg-neutral-900 text-[13px]"
        >
          <option value="">Todas as marcas</option>
          {marcasDisponiveis(motos).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="w-40">
        <label htmlFor="barra-modelo" className="field-label">
          Modelo
        </label>
        {filtros.marca ? (
          <select
            id="barra-modelo"
            value={filtros.modelo}
            onChange={(e) => atualizar({ modelo: e.target.value })}
            className="select h-10 w-full rounded-lg border-neutral-800 bg-neutral-900 text-[13px]"
          >
            <option value="">Todos os modelos</option>
            {modelosDisponiveis(motos, filtros.marca).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <select
            id="barra-modelo"
            disabled
            aria-disabled="true"
            className="select h-10 w-full rounded-lg border-neutral-800 bg-neutral-900 text-[13px] opacity-60"
          >
            <option value="">Escolha a marca</option>
          </select>
        )}
      </div>

      <div className="w-36">
        <label htmlFor="barra-ano" className="field-label">
          Ano
        </label>
        <select
          id="barra-ano"
          value={filtros.anoMin}
          onChange={(e) => atualizar({ anoMin: Number(e.target.value) })}
          className="select h-10 w-full rounded-lg border-neutral-800 bg-neutral-900 text-[13px]"
        >
          <option value={ANO_MIN}>Ano: todos</option>
          {Array.from({ length: ANO_MAX - ANO_MIN }, (_, i) => ANO_MAX - i).map(
            (ano) => (
              <option key={ano} value={ano}>
                A partir de {ano}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="w-36">
        <label htmlFor="barra-ordenacao" className="field-label">
          Ordenar
        </label>
        <select
          id="barra-ordenacao"
          value={filtros.ordenacao}
          onChange={(e) =>
            atualizar({ ordenacao: e.target.value as BikeFilterState['ordenacao'] })
          }
          className="select h-10 w-full rounded-lg border-neutral-800 bg-neutral-900 text-[13px]"
        >
          {ORDENACOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preço: um puxador só, "até tal" — a versão limpa da
          referência. O mínimo fica no padrão (a folha do celular
          continua com os dois, intocada). */}
      <div className="w-44">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="barra-preco-max" className="field-label !mb-0">
            Preço até
          </label>
          <span className="numeros text-[11px] leading-none font-semibold text-neutral-200">
            {formatPrice(filtrosAtuais.precoMax)}
          </span>
        </div>
        <div className="flex h-10 items-center">
          <input
            id="barra-preco-max"
            type="range"
            aria-label="Preço até"
            min={PRECO_MIN}
            max={precoMaximo}
            step={1000}
            value={filtrosAtuais.precoMax}
            onChange={(e) =>
              atualizar({
                precoMax: Math.max(Number(e.target.value), filtrosAtuais.precoMin + 1000),
              })
            }
            className="w-full"
          />
        </div>
      </div>

      {temAtivos ? (
        <button
          type="button"
          onClick={limparFiltros}
          className="self-center shrink-0 text-[13px] text-texto-3 transition-colors hover:text-texto"
        >
          Limpar filtros
        </button>
      ) : null}
    </form>
  )
}
