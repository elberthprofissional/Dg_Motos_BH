import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useScrolled } from '../hooks/useScroll'
import {
  ANO_MIN,
  FILTROS_PADRAO,
  PRECO_MAX,
  PRECO_MIN,
  categoriasDisponiveis,
  filtrarMotos,
  marcasDisponiveis,
} from '../lib/filters'
import type { BikeFilterState, Motorcycle } from '../types'
import { usePageMeta } from '../hooks/usePageMeta'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { BikeFilters } from '../components/motorcycles/BikeFilters'
import { EstadoVazio } from '../components/ui/EstadoVazio'
import { Button } from '../components/ui/Button'
import { Revelar } from '../components/ui/Revelar'
import { formatPrice } from '../lib/format'
import { PLACEHOLDER_CARD } from '../lib/placeholder'

/**
 * Painel lateral das motos recém-chegadas ao pátio.
 *
 * Barato de ler: foto miúda, nome e preço — o cliente que volta toda
 * semana quer saber o que entrou de novo, não olhar o estoque inteiro.
 * `criadoEm` só existe quando a moto vem do banco; no fallback, a
 * chegada é o ano.
 */
function Recentes({ motos }: { motos: Motorcycle[] }) {
  const disponiveis = motos.filter((m) => m.status === 'disponivel')
  if (disponiveis.length < 4) return null

  const recentes = [...disponiveis]
    .sort((a, b) => {
      const chegada = (m: typeof a) => m.atualizadoEm ?? m.criadoEm ?? ''
      return chegada(b).localeCompare(chegada(a)) || b.ano - a.ano
    })
    .slice(0, 4)

  return (
    <section
      className="rounded-2xl border border-borda bg-painel/80 p-5"
      aria-labelledby="recentes-titulo"
    >
      <h2 id="recentes-titulo" className="text-sm font-semibold text-texto">
        Recém-chegadas
      </h2>
      <ul className="mt-3 flex flex-col">
        {recentes.map((moto) => {
          const titulo = `${moto.marca} ${moto.modelo}`
          return (
            <li key={moto.id}>
              <Link
                to={`/moto/${moto.slug}`}
                className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-painel-2"
              >
                <span className="relative block size-14 shrink-0 overflow-hidden rounded-lg bg-fundo">
                  <img
                    src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                    alt={moto.imagens[0]?.alt ?? titulo}
                    loading="lazy"
                    width={960}
                    height={1200}
                    className="absolute inset-0 h-full w-full object-contain p-0.5"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-texto transition-colors group-hover:text-marca-texto">
                    {titulo}
                  </span>
                  <span className="numeros block text-[13px] text-marca-texto">
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
 * Estoque — a vitrine completa do pátio.
 *
 * O topo é uma faixa tipográfica curta, para o catálogo começar cedo.
 * Abaixo, filtros na coluna lateral e o resultado em grade de vitrines.
 *
 * A coluna de filtros trabalha com um rascunho: o visitante ajusta os
 * campos e só então aplica. Assim o resultado não muda a cada arrasto
 * de slider, e o botão "Aplicar filtros" tem uma função clara. Os
 * atalhos de categoria continuam aplicando na hora.
 *
 * No celular a coluna vira uma folha de tela cheia (um <dialog>
 * nativo, com foco preso e Esc de graça). O botão flutuante só aparece
 * depois que a faixa de abertura sai da tela.
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
  const [rascunho, setRascunho] = useState<BikeFilterState>(() => ({
    ...FILTROS_PADRAO,
    marca: marcaUrl,
  }))
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const folhaRef = useRef<HTMLDialogElement>(null)
  const gatilhoRef = useRef<HTMLElement | null>(null)
  const passouBarra = useScrolled(280)

  // Sincroniza quando a URL muda (ex.: clique em chip de marca na Home)
  // sem efeito cascata. O modelo é solto porque pode ser de outra marca.
  if (marcaUrl !== marcaParamAnterior) {
    setMarcaParamAnterior(marcaUrl)
    setFiltros((prev) => ({ ...prev, marca: marcaUrl, modelo: '' }))
    setRascunho((prev) => ({ ...prev, marca: marcaUrl, modelo: '' }))
  }

  // Folha aberta trava a rolagem do fundo, como o menu do celular.
  useEffect(() => {
    if (!filtrosAbertos) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [filtrosAbertos])

  const abrirFolha = (gatilho: HTMLElement) => {
    gatilhoRef.current = gatilho
    // Cada abertura parte do que está aplicado: um rascunho abandonado
    // não volta para a folha na próxima visita.
    setRascunho(filtros)
    setFiltrosAbertos(true)
  }

  const fecharFolha = () => {
    setFiltrosAbertos(false)
    gatilhoRef.current?.focus()
  }

  const cancelarFolha = () => {
    setRascunho(filtros)
    fecharFolha()
  }

  const aplicarFiltros = () => setFiltros(rascunho)

  const aplicarEFechar = () => {
    setFiltros(rascunho)
    fecharFolha()
  }

  const resultados = useMemo(() => filtrarMotos(motos, filtros), [motos, filtros])
  const previa = useMemo(() => filtrarMotos(motos, rascunho), [motos, rascunho])

  const disponiveis = useMemo(
    () => motos.filter((m) => m.status === 'disponivel'),
    [motos],
  )
  const marcas = useMemo(() => marcasDisponiveis(disponiveis), [disponiveis])
  const categorias = useMemo(() => categoriasDisponiveis(disponiveis), [disponiveis])

  // Atualização imediata (chips e etiquetas): mexe no aplicado e no
  // rascunho ao mesmo tempo para os dois nunca divergirem.
  const atualizar = (patch: Partial<BikeFilterState>) => {
    setFiltros((prev) => ({ ...prev, ...patch }))
    setRascunho((prev) => ({ ...prev, ...patch }))
  }

  const limparFiltros = () => {
    const limpo = { ...FILTROS_PADRAO, ordenacao: filtros.ordenacao }
    setFiltros(limpo)
    setRascunho(limpo)
  }

  // Resumo removível dos filtros ativos: cada etiqueta sabe desfazer
  // só o próprio campo. A ordenação não entra na conta — ela organiza,
  // não restringe o pátio.
  const ativos: { chave: string; rotulo: string; limpar: () => void }[] = []

  if (filtros.busca.trim()) {
    ativos.push({
      chave: 'busca',
      rotulo: `Busca: “${filtros.busca.trim()}”`,
      limpar: () => atualizar({ busca: '' }),
    })
  }
  if (filtros.marca) {
    ativos.push({
      chave: 'marca',
      rotulo: `Marca: ${filtros.marca}`,
      limpar: () => atualizar({ marca: '', modelo: '' }),
    })
  }
  if (filtros.modelo) {
    ativos.push({
      chave: 'modelo',
      rotulo: `Modelo: ${filtros.modelo}`,
      limpar: () => atualizar({ modelo: '' }),
    })
  }
  if (filtros.precoMin > PRECO_MIN || filtros.precoMax < PRECO_MAX) {
    ativos.push({
      chave: 'preco',
      rotulo: `${formatPrice(filtros.precoMin)} – ${formatPrice(filtros.precoMax)}`,
      limpar: () => atualizar({ precoMin: PRECO_MIN, precoMax: PRECO_MAX }),
    })
  }
  if (filtros.anoMin > ANO_MIN) {
    ativos.push({
      chave: 'ano',
      rotulo: `Ano: ${filtros.anoMin}+`,
      limpar: () => atualizar({ anoMin: ANO_MIN }),
    })
  }
  if (filtros.categoria !== 'todas') {
    ativos.push({
      chave: 'categoria',
      rotulo: `Categoria: ${filtros.categoria}`,
      limpar: () => atualizar({ categoria: 'todas' }),
    })
  }

  const temAtivos = ativos.length > 0

  return (
    <div className="pt-cabecalho">
      {/* Faixa de abertura: título, contagem e trilha em uma altura
          curta — o catálogo aparece logo abaixo. */}
      <section className="border-b border-borda bg-painel">
        <div className="container-site py-8 sm:py-10">
          <nav
            aria-label="Trilha de navegação"
            className="flex items-center gap-2 text-xs text-texto-3"
          >
            <Link
              to="/"
              className="inline-flex min-h-6 items-center transition-colors hover:text-texto"
            >
              Início
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-texto-2">
              Estoque
            </span>
          </nav>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display">Estoque</h1>
                <span
                  aria-live="polite"
                  className="numeros inline-flex items-center rounded-full border border-marca/30 bg-marca/10 px-3 py-1 text-sm font-semibold text-marca-texto"
                >
                  {resultados.length} {resultados.length === 1 ? 'moto' : 'motos'}
                </span>
              </div>
              <p className="lead mt-4 max-w-[40ch] text-texto-2">
                Seminovas inspecionadas e prontas para rodar em Belo Horizonte.
              </p>
            </div>

            <dl className="hidden shrink-0 grid-cols-3 gap-6 rounded-2xl bg-fundo/70 px-6 py-5 lg:grid">
              <div>
                <dt className="text-[12px] font-medium text-texto-3">No pátio</dt>
                <dd className="numeros mt-1 font-display text-2xl leading-none font-bold text-texto">
                  {disponiveis.length}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium text-texto-3">Marcas</dt>
                <dd className="numeros mt-1 font-display text-2xl leading-none font-bold text-texto">
                  {marcas.length}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium text-texto-3">Categorias</dt>
                <dd className="numeros mt-1 font-display text-2xl leading-none font-bold text-texto">
                  {categorias.length}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={(e) => abrirFolha(e.currentTarget)}
              aria-haspopup="dialog"
              aria-expanded={filtrosAbertos}
              className="btn btn-secondary h-11 gap-2 rounded-xl px-4 text-xs lg:hidden"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filtros
              {temAtivos ? (
                <span className="grid size-5 place-items-center rounded-full bg-marca text-[10px] font-bold text-white">
                  {ativos.length}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-fundo pt-8 pb-20 sm:pt-10 sm:pb-28">
        <div className="container-site flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
          {/* Coluna de filtros — só existe como coluna no desktop. */}
          <aside className="hidden w-[20rem] shrink-0 flex-col gap-6 lg:sticky lg:top-[5.5rem] lg:flex">
            <div className="rounded-2xl border border-borda bg-painel/80 p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg leading-none font-bold text-texto">
                    Filtros
                  </h2>
                  <p className="mt-1.5 text-xs text-texto-3">Refine o pátio</p>
                </div>
                {temAtivos ? (
                  <span className="numeros grid size-6 place-items-center rounded-full bg-marca/15 text-xs font-bold text-marca-texto">
                    {ativos.length}
                  </span>
                ) : null}
              </div>

              <BikeFilters
                filtros={rascunho}
                motos={motos}
                onChange={setRascunho}
                onAplicar={aplicarFiltros}
                prefix="filtro"
              />

              <div className="mt-6 space-y-3">
                <p className="text-center text-xs text-texto-3">
                  <span className="numeros font-semibold text-texto">{previa.length}</span>{' '}
                  {previa.length === 1 ? 'moto' : 'motos'} com estes filtros
                </p>
                <button
                  type="button"
                  onClick={aplicarFiltros}
                  className="w-full rounded-xl bg-marca py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marca-viva"
                >
                  Aplicar filtros
                </button>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mx-auto flex min-h-6 w-fit items-center text-xs text-texto-3 transition-colors hover:text-texto"
                >
                  Limpar filtros
                </button>
              </div>
            </div>

            <Recentes motos={motos} />
          </aside>

          {/* Resultado */}
          <div className="min-w-0 flex-1">
            <h2 className="sr-only">Motos disponíveis no estoque</h2>

            {/* Categorias reais do estoque: um atalho horizontal antes
                da grade. */}
            {categorias.length >= 2 ? (
              <div
                role="group"
                aria-label="Filtrar por categoria"
                className="mb-5 flex items-center gap-2 overflow-x-auto pb-1"
              >
                <button
                  type="button"
                  aria-pressed={filtros.categoria === 'todas'}
                  onClick={() => atualizar({ categoria: 'todas' })}
                  className="chip-filtro"
                >
                  Todas
                </button>
                {categorias.map((categoria) => (
                  <button
                    key={categoria}
                    type="button"
                    aria-pressed={filtros.categoria === categoria}
                    onClick={() => atualizar({ categoria })}
                    className="chip-filtro"
                  >
                    {categoria}
                  </button>
                ))}
              </div>
            ) : null}

            {temAtivos ? (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {ativos.map((ativo) => (
                  <button
                    key={ativo.chave}
                    type="button"
                    onClick={ativo.limpar}
                    className="inline-flex items-center gap-2 rounded-full border border-borda bg-painel-2 px-3 py-1.5 font-sans text-xs text-texto-2 transition-colors hover:border-borda-forte hover:text-texto"
                  >
                    {ativo.rotulo}
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="px-1 py-1.5 font-sans text-xs font-semibold text-marca-texto transition-colors hover:text-texto"
                >
                  Limpar tudo
                </button>
              </div>
            ) : null}

            {resultados.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {resultados.map((bike, i) => (
                  <Revelar key={bike.id} atraso={Math.min(i, 6) * 45}>
                    <BikeCard bike={bike} priority={i < 3} />
                  </Revelar>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-borda bg-painel/80">
                <EstadoVazio
                  icone={<SearchX className="size-7" aria-hidden="true" />}
                  titulo="Nenhuma moto encontrada com esses filtros"
                  descricao="Ajuste a faixa de preço, o ano ou a categoria. A moto que você procura pode estar chegando ao pátio — fale com a gente para avisar."
                  acao={
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button variant="outline" onClick={limparFiltros}>
                        Limpar filtros
                      </Button>
                      <Button to="/contato">Falar com a loja</Button>
                    </div>
                  }
                />
              </div>
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
            gatilhoRef.current?.focus()
          }}
          className="menu-mobile"
          aria-label="Filtros do estoque"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-borda px-5 py-4">
              <div>
                <h2 className="font-display text-lg leading-none font-bold text-texto">
                  Filtrar
                </h2>
                <p className="mt-1 text-xs text-texto-3">
                  {previa.length} {previa.length === 1 ? 'moto' : 'motos'} com estes filtros
                </p>
              </div>
              <button
                type="button"
                onClick={cancelarFolha}
                aria-label="Fechar filtros"
                className="btn-icone rounded-xl"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5">
              <BikeFilters
                filtros={rascunho}
                motos={motos}
                onChange={setRascunho}
                onAplicar={aplicarEFechar}
                prefix="filtro-m"
              />
            </div>

            <div className="border-t border-borda bg-painel px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-xl border border-borda px-4 py-3 text-sm text-texto-2 transition-colors hover:border-borda-forte hover:text-texto"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={aplicarEFechar}
                  className="flex-1 rounded-xl bg-marca py-3 text-sm font-semibold text-white transition-colors hover:bg-marca-viva"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* Botão flutuante de filtro — só no celular e só depois que a
          faixa de abertura saiu da tela. Ele é o espelho do WhatsApp no
          outro canto. */}
      <button
        type="button"
        onClick={(e) => abrirFolha(e.currentTarget)}
        aria-label={
          temAtivos ? `Abrir filtros, ${ativos.length} ativos` : 'Abrir filtros'
        }
        aria-expanded={filtrosAbertos}
        aria-hidden={!passouBarra}
        inert={!passouBarra}
        aria-haspopup="dialog"
        className={`fixed left-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 grid size-14 place-items-center rounded-2xl border border-borda-forte bg-painel-2 text-texto transition-[opacity,transform,border-color] duration-300 hover:border-marca hover:text-marca-texto lg:hidden ${
          passouBarra
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <SlidersHorizontal className="size-6" aria-hidden="true" />
        {temAtivos ? (
          <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-marca font-sans text-[11px] font-bold text-white">
            {ativos.length}
          </span>
        ) : null}
      </button>
    </div>
  )
}
