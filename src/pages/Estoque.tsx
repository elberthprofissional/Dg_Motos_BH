import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { FILTROS_PADRAO, ORDENACOES, filtrarMotos, temFiltroAtivo } from '../lib/filters'
import type { BikeFilterState } from '../types'
import { usePageMeta } from '../hooks/usePageMeta'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { BikeFilters } from '../components/motorcycles/BikeFilters'
import { EstadoVazio } from '../components/ui/EstadoVazio'
import { Button } from '../components/ui/Button'
import { formatPrice } from '../lib/format'
import { PLACEHOLDER_CARD } from '../lib/placeholder'

/**
 * Panel lateral das motos recém-chegadas ao pátio.
 *
 * Barato de ler: foto miúda, nome e preço — o cliente que volta toda
 * semana quer saber o que entrou de novo, não olhar o estoque inteiro.
 * `criadoEm` só existe quando a moto vem do banco; no fallback, a
 * chegada é o ano.
 */
function Recentes({ motos }: { motos: import('../types').Motorcycle[] }) {
  const disponiveis = motos.filter((m) => m.status === 'disponivel')
  if (disponiveis.length < 4) return null

  const recentes = [...disponiveis]
    .sort((a, b) => {
      const chegada = (m: typeof a) => m.atualizadoEm ?? m.criadoEm ?? ''
      return chegada(b).localeCompare(chegada(a)) || b.ano - a.ano
    })
    .slice(0, 4)

  return (
    <section className="surface p-5" aria-labelledby="recentes-titulo">
      <h2
        id="recentes-titulo"
        className="font-display text-base leading-none font-bold tracking-wide text-texto uppercase"
      >
        Recém-chegadas
      </h2>
      <ul className="mt-4 flex flex-col divide-y divide-borda">
        {recentes.map((moto) => {
          const titulo = `${moto.marca} ${moto.modelo}`
          return (
            <li key={moto.id}>
              <Link
                to={`/moto/${moto.slug}`}
                className="group -mx-2 flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-painel-2"
              >
                <img
                  src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                  alt={moto.imagens[0]?.alt ?? titulo}
                  loading="lazy"
                  width={120}
                  height={90}
                  className="size-14 shrink-0 object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-texto transition-colors group-hover:text-marca-texto">
                    {titulo}
                  </span>
                  <span className="numeros block text-sm text-texto-3">
                    {formatPrice(moto.preco)}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * Estoque — o livro do pátio, now em bancada de trabalho.
 *
 * A estrutura segue o padrão clássico dos catálogos de veículos —
 * filtros na coluna lateral estreita, contagem e ordenação na
 * régua do topo, o resultado em grade — mas com a pele da casa:
 * fundo preto, vermelho apenas onde é sinal, canto reto.
 *
 * No celular a coluna de filtros vira folha sobre a tela (um
 * <dialog> nativo, como o menu); no desktop ela fica à esquerda,
 * fixa enquanto o resultado rola ao lado.
 */
export function Estoque() {
  const { motos } = useCatalogo()
  const [searchParams] = useSearchParams()
  const marcaUrl = searchParams.get('marca') ?? ''

  usePageMeta(
    'Estoque | DG Motos — Motocicletas seminovas em BH',
    'Catálogo de motocicletas seminovas da DG Motos em Belo Horizonte: busque por marca ou modelo, filtre por marca, preço, ano e categoria.',
  )

  const [marcaParamAnterior, setMarcaParamAnterior] = useState(marcaUrl)
  const [filtros, setFiltros] = useState<BikeFilterState>(() => ({
    ...FILTROS_PADRAO,
    marca: marcaUrl,
  }))
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const folhaRef = useRef<HTMLDialogElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  // Sincroniza quando a URL muda (ex.: clique em chip de marca na Home) sem efeito cascata
  if (marcaUrl !== marcaParamAnterior) {
    setMarcaParamAnterior(marcaUrl)
    setFiltros((prev) => ({ ...prev, marca: marcaUrl }))
  }

  const abrirFolha = () => {
    setFiltrosAbertos(true)
    folhaRef.current?.showModal()
  }
  const fecharFolha = () => {
    folhaRef.current?.close()
    setFiltrosAbertos(false)
  }

  const resultados = useMemo(() => filtrarMotos(motos, filtros), [motos, filtros])

  const resumo =
    resultados.length === 1 ? '1 moto encontrada' : `${resultados.length} motos encontradas`

  const formularioFiltros = (prefix: string) => (
    <BikeFilters
      filtros={filtros}
      motos={motos}
      onChange={setFiltros}
      onClear={() => setFiltros(FILTROS_PADRAO)}
      prefix={prefix}
    />
  )

  return (
    <div className="pt-cabecalho">
      <section className="bg-fundo">
        <div className="container-site pt-10 pb-6 sm:pt-12 sm:pb-8">
          <h1 className="display">Estoque</h1>
        </div>
      </section>

      {/* A bancada: coluna de filtros à esquerda, resultado ao lado. */}
      <section className="bg-fundo pb-16 sm:pb-24">
        <div className="container-site flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
          {/* Coluna lateral — só existe como coluna no desktop. */}
          <aside className="flex w-full flex-col gap-5 lg:w-72 lg:shrink-0 lg:sticky lg:top-[92px]">
            <div className="hidden lg:block [&_form]:border-t-0 [&_form]:pt-0">{formularioFiltros('filtro')}</div>
            <div className="hidden lg:block">
              <Recentes motos={motos} />
            </div>
          </aside>

          {/* Resultado */}
          <div className="min-w-0 flex-1">
            <h2 className="sr-only">Motos disponíveis no estoque</h2>
            {/* Régua do topo: contagem e ordenação — só isso. A
                ferramenta de filtrar fica no canto da tela, não no
                meio da vitrine. */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <p aria-live="polite" className="pequeno flex-1 text-texto-2">
                <span className="sr-only">
                  {resumo}
                  {filtros.busca ? ` para "${filtros.busca}"` : ''}
                  {filtros.marca ? ` na marca ${filtros.marca}` : ''}
                </span>
                <span aria-hidden="true">{resumo}</span>
              </p>

              <div className="flex items-center gap-2">
                <label htmlFor="estoque-ordenacao" className="pequeno text-texto-3">
                  Ordenar:
                </label>
                <select
                  id="estoque-ordenacao"
                  value={filtros.ordenacao}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      ordenacao: e.target.value as BikeFilterState['ordenacao'],
                    })
                  }
                  className="select h-11 py-0 text-sm"
                >
                  {ORDENACOES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {resultados.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {resultados.map((bike, i) => (
                  <BikeCard key={bike.id} bike={bike} priority={i < 3} />
                ))}
              </div>
            ) : (
              <EstadoVazio
                icone={<SearchX className="size-7" aria-hidden="true" />}
                titulo="Nenhuma moto encontrada com esses filtros"
                descricao="Ajuste a faixa de preço, o ano ou a categoria. A moto que você procura pode estar chegando ao pátio — fale com a gente para avisar."
                acao={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="outline" onClick={() => setFiltros(FILTROS_PADRAO)}>
                      Limpar filtros
                    </Button>
                    <Button to="/contato">Falar com a loja</Button>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </section>

      {/* Folha de filtros do celular: dialog nativo — foco preso, Esc
          e camada superior de graça, como o menu. */}
      {filtrosAbertos && (
        <dialog
          ref={(el) => {
            folhaRef.current = el
            if (el && !el.open) el.showModal()
          }}
          onClose={() => {
            setFiltrosAbertos(false)
            // Retorna o foco ao botão flutuante ao fechar
            fabRef.current?.focus()
          }}
          className="menu-mobile"
          aria-label="Filtros do estoque"
        >
          <div className="flex h-full flex-col overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-borda bg-fundo px-5 py-4">
              <h2 className="painel-h1 text-lg">Filtrar</h2>
              <button
                type="button"
                onClick={fecharFolha}
                aria-label="Fechar filtros"
                className="btn-icone"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-5">{formularioFiltros('filtro-m')}</div>
          </div>
        </dialog>
      )}

      {/* Botão flutuante de filtro — só no celular (no desktop a
          coluna lateral já está sempre à vista). Ele é o espelho do
          WhatsApp no outro canto: ferramenta no canto esquerdo,
          conversa no direito. */}
      <button
        ref={fabRef}
        type="button"
        onClick={abrirFolha}
        aria-label="Abrir filtros"
        aria-expanded={filtrosAbertos}
        aria-haspopup="dialog"
        className="fixed left-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 grid size-14 place-items-center border border-borda-forte bg-painel-2 text-texto transition-colors hover:text-marca-texto lg:hidden"
      >
        <SlidersHorizontal className="size-6" aria-hidden="true" />
        {temFiltroAtivo(filtros) ? (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 size-2 rounded-full bg-marca"
          />
        ) : null}
      </button>
    </div>
  )
}

