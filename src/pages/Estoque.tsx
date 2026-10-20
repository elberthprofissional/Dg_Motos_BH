import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { FILTROS_PADRAO, filtrarMotos } from '../lib/filters'
import type { BikeFilterState } from '../types'
import { usePageMeta } from '../hooks/useNavigation'
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
    <div className="pt-16">
      {/* Faixa vermelha fina que continua a do header: mantém a assinatura do topo */}
      <div aria-hidden="true" className="h-[3px] w-full bg-gradient-to-r from-[#d91f32] via-[#d91f32] to-[#8a1220]" />

      {/* Cabeçalho da página */}
      <section className="border-b border-white/10 bg-[#0c0c0c]">
        <div className="container-site py-14 text-center sm:py-20">
          <p className="eyebrow">
            <span aria-hidden="true" className="mr-3 inline-block h-px w-8 align-middle bg-[#d91f32]" />
            Catálogo
            <span aria-hidden="true" className="ml-3 inline-block h-px w-8 align-middle bg-[#d91f32]" />
          </p>
          <h1 className="h-display mt-4 text-4xl tracking-[0.08em] sm:text-6xl">Estoque</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-steel-400 sm:text-base">
            Todas as motocicletas disponíveis na DG Motos. Os anúncios são
            atualizados conforme o pátio muda — fale com a gente para confirmar
            disponibilidade.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          {/* Marcas em círculos (estilo concessionária): atalho visual para
              o filtro de marca. Toque numa marca filtra; tocar de novo
              limpa. O select dentro de BikeFilters continua funcionando
              e mostra o mesmo estado. */}
          <MarcaGrid
            marcas={marcasDisponiveis(motos)}
            marcaAtiva={filtros.marca}
            onSelecionar={(marca) => setFiltros({ ...filtros, marca })}
          />

          <div className="my-8 border-t border-white/8" aria-hidden="true" />

          <BikeFilters
            filtros={filtros}
            motos={motos}
            onChange={setFiltros}
            onClear={() => setFiltros(FILTROS_PADRAO)}
          />

          <p aria-live="polite" className="mt-8 text-sm text-steel-400">
            <span className="font-semibold text-paper">{resultados.length}</span>{' '}
            {plural(resultados.length)}
            {filtros.busca ? (
              <>
                {' '}
                para <span className="text-paper">“{filtros.busca}”</span>
              </>
            ) : null}
          </p>

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
    </div>
  )
}
