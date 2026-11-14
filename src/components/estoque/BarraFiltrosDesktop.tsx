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
import { useRolando, useScrolled } from '../../hooks/useScroll'
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
  // O cabeçalho fica fixo e só a barra de filtros se recolhe: sai
  // durante o arrasto e volta quando a rolagem para. No topo da
  // página ela nunca se esconde.
  const rolando = useRolando()
  const longeDoTopo = useScrolled(80)
  const recolhida = rolando && longeDoTopo

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filtros do estoque"
      className={`mb-8 hidden flex-wrap items-end gap-x-2.5 gap-y-3 border border-borda bg-painel px-4 py-4 transition-transform duration-300 ease-out motion-reduce:transition-none lg:sticky lg:top-[7.75rem] lg:z-40 lg:flex ${
        recolhida ? 'lg:-translate-y-[calc(100%+8rem)]' : 'lg:translate-y-0'
      }`}
    >
      <div className="min-w-[12rem] flex-1">
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
            className="h-11 w-full border border-borda bg-fundo px-3 py-1.5 pr-9 pl-9 text-sm text-texto transition-colors placeholder:text-texto-3 focus:border-texto focus:outline-none"
          />
        </div>
      </div>

      <div className="w-[7.75rem] xl:w-[8.5rem]">
        <label htmlFor="barra-marca" className="field-label">
          Marca
        </label>
        <select
          id="barra-marca"
          value={filtros.marca}
          onChange={(e) => atualizar({ marca: e.target.value, modelo: '' })}
          className="select h-11 w-full border-borda bg-fundo text-sm"
        >
          <option value="">Todas as marcas</option>
          {marcasDisponiveis(motos).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="w-[7.75rem] xl:w-[8.5rem]">
        <label htmlFor="barra-modelo" className="field-label">
          Modelo
        </label>
        {filtros.marca ? (
          <select
            id="barra-modelo"
            value={filtros.modelo}
            onChange={(e) => atualizar({ modelo: e.target.value })}
            className="select h-11 w-full border-borda bg-fundo text-sm"
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
            className="select h-11 w-full border-borda bg-fundo text-sm opacity-60"
          >
            <option value="">Escolha a marca</option>
          </select>
        )}
      </div>

      <div className="w-[7.75rem] xl:w-[8.5rem]">
        <label htmlFor="barra-ano" className="field-label">
          Ano
        </label>
        <select
          id="barra-ano"
          value={filtros.anoMin}
          onChange={(e) => atualizar({ anoMin: Number(e.target.value) })}
          className="select h-11 w-full border-borda bg-fundo text-sm"
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

      <div className="w-[8.75rem] xl:w-[9.5rem]">
        <label htmlFor="barra-ordenacao" className="field-label">
          Ordenar
        </label>
        <select
          id="barra-ordenacao"
          value={filtros.ordenacao}
          onChange={(e) =>
            atualizar({ ordenacao: e.target.value as BikeFilterState['ordenacao'] })
          }
          className="select h-11 w-full border-borda bg-fundo text-sm"
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
      {/* Preço: o rótulo divide a linha com o valor e o puxador vive
          dentro de uma caixa da mesma altura dos outros campos — antes
          ele boiava solto e desalinhava a barra inteira. */}
      <div className="w-[10.5rem] xl:w-[12rem]">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="barra-preco-max" className="field-label !mb-1">
            Preço até
          </label>
          <span className="numeros text-[11px] leading-none font-semibold text-texto">
            {formatPrice(filtrosAtuais.precoMax)}
          </span>
        </div>
        <div className="flex h-11 items-center border border-borda bg-fundo px-3">
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
          className="h-11 shrink-0 px-1 text-sm text-texto-3 transition-colors hover:text-texto"
        >
          Limpar filtros
        </button>
      ) : null}
    </form>
  )
}
