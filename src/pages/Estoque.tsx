import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { FILTROS_PADRAO, filtrarMotos } from '../lib/filters'
import type { BikeFilterState } from '../types'
import { usePageMeta } from '../hooks/usePageMeta'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { BikeFilters } from '../components/motorcycles/BikeFilters'
import { MarcaGrid } from '../components/motorcycles/MarcaGrid'
import { Button } from '../components/ui/Button'
import { marcasDisponiveis } from '../lib/filters'

const plural = (n: number) => (n === 1 ? 'motocicleta encontrada' : 'motocicletas encontradas')

export function Estoque() {
  const { motos } = useCatalogo()

  usePageMeta(
    'Estoque | DG Motos — Motocicletas seminovas em BH',
    'Catálogo de motocicletas seminovas da DG Motos em Belo Horizonte: busque por marca ou modelo, filtre por marca, preço, ano e categoria.',
  )

  const [filtros, setFiltros] = useState<BikeFilterState>(FILTROS_PADRAO)
  const resultados = useMemo(() => filtrarMotos(motos, filtros), [motos, filtros])

  return (
    <div className="pt-[71px] lg:pt-[79px]">
      {/* Faixa vermelha fina que continua a do header: mantém a assinatura
          do topo. Vermelho sólido, sem gradiente — é um fio de identidade. */}
      <div aria-hidden="true" className="h-px w-full bg-brand-500/30" />

      {/* Cabeçalho da página — só o título. Descrição e contagem saíram
          de propósito: o catálogo é a página, e ele precisa começar alto. */}
      <section className="border-b border-line bg-night-950">
        <div className="container-site pt-7 pb-5 sm:pt-9 sm:pb-6">
          <p className="rotulo">Catálogo</p>
          <h1 className="h-display mt-3 text-4xl tracking-[0.04em] sm:text-5xl">Estoque</h1>
        </div>
      </section>

      <section className="pb-14 sm:pb-18 lg:pb-20">
        <div className="container-site">
          {/* Contagem só para leitor de tela: quem filtra recebe o
              anúncio da mudança, sem poluir a página. */}
          <p aria-live="polite" className="sr-only">
            {resultados.length} {plural(resultados.length)}
            {filtros.busca ? ` para "${filtros.busca}"` : ''}
          </p>
          {/* Mobile: marcas em círculos no topo (atalho visual) e os
              filtros como faixa horizontal. Desktop: filtros viram uma
              sidebar à esquerda, ao lado da grade. */}
          <div className="lg:hidden">
            <MarcaGrid
              marcas={marcasDisponiveis(motos)}
              marcaAtiva={filtros.marca}
              onSelecionar={(marca) => setFiltros({ ...filtros, marca })}
            />

            <div className="my-6 border-t border-line" aria-hidden="true" />

            <BikeFilters
              filtros={filtros}
              motos={motos}
              onChange={setFiltros}
              onClear={() => setFiltros(FILTROS_PADRAO)}
            />
          </div>

          <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
            {/* Sidebar de filtros (desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-[103px]">
                <BikeFilters
                  filtros={filtros}
                  motos={motos}
                  onChange={setFiltros}
                  onClear={() => setFiltros(FILTROS_PADRAO)}
                  layout="lateral"
                />
              </div>
            </aside>

            {/* Grade de resultados */}
            <div>
              {resultados.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-0 lg:gap-6 xl:grid-cols-3">
                  {resultados.map((bike) => (
                    <BikeCard key={bike.id} bike={bike} />
                  ))}
                </div>
              ) : (
                <div className="surface mt-6 flex flex-col items-center rounded-lg px-6 py-14 text-center lg:mt-0">
                  <SearchX className="size-8 text-steel-500" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-xl font-semibold tracking-[0.03em] uppercase">
                    Nenhuma moto com esses filtros
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-steel-400">
                    Ajuste a faixa de preço, o ano ou a categoria — ou fale com a
                    gente: pode ser que a moto que você procura esteja chegando.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button variant="outline" onClick={() => setFiltros(FILTROS_PADRAO)}>
                      Limpar filtros
                    </Button>
                    <Button to="/contato">Falar com a loja</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
