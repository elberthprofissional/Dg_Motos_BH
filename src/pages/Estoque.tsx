import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import { CompareBar } from '../components/motorcycles/CompareBar'
import { ComparePanel } from '../components/motorcycles/ComparePanel'
import { useCatalogo } from '../hooks/useCatalogo'
import { FILTROS_PADRAO, filtrarMotos } from '../lib/filters'
import type { BikeFilterState } from '../types'
import { usePageMeta } from '../hooks/useNavigation'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { useCompare, slugsToBikes } from '../hooks/useCompare'
import { BikeFilters } from '../components/motorcycles/BikeFilters'
import { Button } from '../components/ui/Button'

const plural = (n: number) => (n === 1 ? 'motocicleta encontrada' : 'motocicletas encontradas')

export function Estoque() {
  const { motos } = useCatalogo()

  usePageMeta(
    'Estoque | DG Motos — Motocicletas seminovas em BH',
    'Catálogo de motocicletas seminovas da DG Motos em Belo Horizonte: busque por marca, filtre por preço, ano e categoria.',
  )

  const [filtros, setFiltros] = useState<BikeFilterState>(FILTROS_PADRAO)
  const { slugs, toggle, limpar } = useCompare()
  const comparar = slugsToBikes(slugs, motos)

  const resultados = useMemo(() => filtrarMotos(motos, filtros), [motos, filtros])

  return (
    <div className="pt-16">
      {/* Cabeçalho da página */}
      <section className="border-b border-white/10 bg-night-900">
        <div className="container-site py-12 sm:py-16">
          <p className="eyebrow">Catálogo</p>
          <h1 className="h-display mt-3 text-4xl sm:text-5xl">Estoque</h1>
          <p className="mt-3 max-w-xl text-steel-400">
            Todas as motocicletas disponíveis na DG Motos. Os anúncios são
            atualizados conforme o pátio muda — fale com a gente para confirmar
            disponibilidade.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <BikeFilters
            filtros={filtros}
            onChange={setFiltros}
            onClear={() => setFiltros(FILTROS_PADRAO)}
          />

          <p aria-live="polite" className="mt-6 text-sm text-steel-400">
            <span className="font-semibold text-paper">{resultados.length}</span>{' '}
            {plural(resultados.length)}
            {filtros.busca ? (
              <>
                {' '}
                para <span className="text-paper">“{filtros.busca}”</span>
              </>
            ) : null}
          </p>

          {/* Comparador */}
          {comparar.length > 0 && (
            <div id="comparar" className="mt-10 scroll-mt-24">
              <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">
                Comparar motos
              </h2>
              <div className="mt-4">
                <ComparePanel
                  bikes={comparar}
                  onRemove={toggle}
                  onClear={limpar}
                />
              </div>
            </div>
          )}

          {resultados.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          ) : (
            <div className="surface mt-6 flex flex-col items-center rounded-lg px-6 py-16 text-center">
              <SearchX className="size-8 text-steel-500" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-semibold uppercase">
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
      </section>
      <CompareBar />
    </div>
  )
}
