import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import {
  ANO_MAX,
  ANO_MIN,
  FILTROS_PADRAO,
  ORDENACOES,
  PRECO_MIN,
  filtrarMotos,
  marcasDisponiveis,
  modelosDisponiveis,
  tetoPrecoDisponivel,
} from '../lib/filters'
import type { BikeFilterState } from '../types'
import { usePageMeta } from '../hooks/usePageMeta'
import { Marcas } from '../components/home/MarcasProcuradas'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { BikeFilters } from '../components/motorcycles/BikeFilters'
import { EstadoVazio } from '../components/ui/EstadoVazio'
import { Button } from '../components/ui/Button'
import { Revelar } from '../components/ui/Revelar'
import { formatPrice } from '../lib/format'

/**
 * Estoque — a vitrine completa do pátio.
 *
 * A página começa direto no catálogo: filtros na coluna lateral e o
 * resultado em grade de vitrines. O título fica só para leitores de tela.
 *
 * A coluna de filtros trabalha com um rascunho: o visitante ajusta os
 * campos e só então aplica. Assim o resultado não muda a cada arrasto
 * de slider, e o botão "Aplicar filtros" tem uma função clara. Os
 * atalhos de categoria continuam aplicando na hora.
 *
 * No celular a coluna vira uma folha de tela cheia (um <dialog>
 * nativo, com foco preso e Esc de graça). A folha abre pelo botão na
 * pelo botão flutuante, sempre disponível.
 */
export function Estoque() {
  const { motos } = useCatalogo()
  const [searchParams] = useSearchParams()
  const marcaUrl = searchParams.get('marca') ?? ''
  const buscaUrl = searchParams.get('busca') ?? ''
  const precoMaximo = useMemo(() => tetoPrecoDisponivel(motos), [motos])

  usePageMeta(
    'Estoque | DG Motos — Motocicletas seminovas em BH',
    'Catálogo de motocicletas seminovas da DG Motos em Belo Horizonte: busque por marca ou modelo, filtre por marca, preço, ano e categoria.',
  )

  const [marcaParamAnterior, setMarcaParamAnterior] = useState(marcaUrl)
  const [buscaParamAnterior, setBuscaParamAnterior] = useState(buscaUrl)
  const [filtros, setFiltros] = useState<BikeFilterState>(() => ({
    ...FILTROS_PADRAO,
    precoMax: precoMaximo,
    marca: marcaUrl,
    busca: buscaUrl,
  }))
  const [rascunho, setRascunho] = useState<BikeFilterState>(() => ({
    ...FILTROS_PADRAO,
    precoMax: precoMaximo,
    marca: marcaUrl,
    busca: buscaUrl,
  }))
  const [tetoPrecoAplicadoAlterado, setTetoPrecoAplicadoAlterado] = useState(false)
  const [tetoPrecoRascunhoAlterado, setTetoPrecoRascunhoAlterado] = useState(false)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const folhaRef = useRef<HTMLDialogElement>(null)
  const gatilhoRef = useRef<HTMLElement | null>(null)
  const filtrosAtuais = useMemo(
    () => ({ ...filtros, precoMax: tetoPrecoAplicadoAlterado ? filtros.precoMax : precoMaximo }),
    [filtros, precoMaximo, tetoPrecoAplicadoAlterado],
  )
  const rascunhoAtual = useMemo(
    () => ({ ...rascunho, precoMax: tetoPrecoRascunhoAlterado ? rascunho.precoMax : precoMaximo }),
    [rascunho, precoMaximo, tetoPrecoRascunhoAlterado],
  )

  // Sincroniza quando a URL muda (ex.: clique em chip de marca na Home ou
  // busca do header). O modelo é solto porque pode ser de outra marca
  // ou outro termo de busca.
  if (marcaUrl !== marcaParamAnterior || buscaUrl !== buscaParamAnterior) {
    setMarcaParamAnterior(marcaUrl)
    setBuscaParamAnterior(buscaUrl)
    setFiltros((prev) => ({ ...prev, marca: marcaUrl, modelo: '', busca: buscaUrl }))
    setRascunho((prev) => ({ ...prev, marca: marcaUrl, modelo: '', busca: buscaUrl }))
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
    setRascunho(filtrosAtuais)
    setTetoPrecoRascunhoAlterado(tetoPrecoAplicadoAlterado)
    setFiltrosAbertos(true)
  }

  const fecharFolha = () => {
    setFiltrosAbertos(false)
    gatilhoRef.current?.focus()
  }

  const cancelarFolha = () => {
    setRascunho(filtrosAtuais)
    setTetoPrecoRascunhoAlterado(tetoPrecoAplicadoAlterado)
    fecharFolha()
  }

  const aplicarEFechar = () => {
    setFiltros(rascunhoAtual)
    setTetoPrecoAplicadoAlterado(tetoPrecoRascunhoAlterado)
    fecharFolha()
  }

  const resultados = useMemo(
    () => filtrarMotos(motos, filtrosAtuais, precoMaximo),
    [motos, filtrosAtuais, precoMaximo],
  )

  // Atualização imediata (chips e etiquetas): mexe no aplicado e no
  // rascunho ao mesmo tempo para os dois nunca divergirem.
  const atualizar = (patch: Partial<BikeFilterState>) => {
    setFiltros((prev) => ({ ...prev, ...patch }))
    setRascunho((prev) => ({ ...prev, ...patch }))
    if (patch.precoMax !== undefined) {
      setTetoPrecoAplicadoAlterado(true)
      setTetoPrecoRascunhoAlterado(true)
    }
  }

  const limparFiltros = () => {
    const limpo = { ...FILTROS_PADRAO, ordenacao: filtros.ordenacao }
    setFiltros(limpo)
    setRascunho(limpo)
    setTetoPrecoAplicadoAlterado(false)
    setTetoPrecoRascunhoAlterado(false)
  }

  const limparFaixaPreco = () => {
    setTetoPrecoAplicadoAlterado(false)
    setTetoPrecoRascunhoAlterado(false)
    setFiltros((prev) => ({ ...prev, precoMin: PRECO_MIN }))
    setRascunho((prev) => ({ ...prev, precoMin: PRECO_MIN }))
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
  if (filtrosAtuais.precoMin > PRECO_MIN || filtrosAtuais.precoMax < precoMaximo) {
    ativos.push({
      chave: 'preco',
      rotulo: `${formatPrice(filtrosAtuais.precoMin)} – ${formatPrice(filtrosAtuais.precoMax)}`,
      limpar: limparFaixaPreco,
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
  const totalDisponiveis = motos.filter((moto) => moto.status === 'disponivel').length

  return (
<div className="pt-cabecalho">
        <section className="bg-fundo pt-2 pb-6 sm:pt-3 sm:pb-8">
          <div className="container-site">

          {/* Resultado */}
          <div className="min-w-0 flex-1">
            <h2 className="sr-only">Resultados do estoque</h2>

            {/* Barra de filtros do desktop: uma linha acima do grid, à la
                catálogo simples — sem coluna lateral. Aplica na hora (o
                mesmo caminho dos chips); o botão de aplicar ficou pro
                celular, que continua com a folha de rascunho intacta. */}
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

            {/* No celular, a folha de filtros abre por aqui: os
                atalhos de categoria não mostram os demais campos. */}
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={(e) => abrirFolha(e.currentTarget)}
                aria-haspopup="dialog"
                aria-expanded={filtrosAbertos}
                className="btn btn-secondary h-9 shrink-0 gap-2 rounded-lg px-4 text-[13px]"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Filtros
                {temAtivos ? (
                  <span className="grid size-5 place-items-center rounded-full bg-marca text-[10px] font-bold text-white">
                    {ativos.length}
                  </span>
                ) : null}
              </button>
              <p className="numeros truncate text-xs text-texto-3">
                {resultados.length} {resultados.length === 1 ? 'moto' : 'motos'}
              </p>
            </div>

            {temAtivos ? (
              <div className="mb-5 flex flex-wrap items-center gap-2">
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
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {resultados.map((bike, i) => (
                    <Revelar key={bike.id} atraso={Math.min(i, 6) * 45}>
                      <BikeCard bike={bike} priority={i < 3} />
                    </Revelar>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-painel px-4 py-2 sm:px-8">
                <EstadoVazio
                  icone={<SearchX className="size-7" aria-hidden="true" />}
                  titulo={totalDisponiveis === 0 ? 'Sem motos anunciadas agora' : 'Nenhuma moto encontrada com esses filtros'}
                  descricao={
                    totalDisponiveis === 0
                      ? 'Fale com a loja para consultar as próximas entradas.'
                      : 'Ajuste a faixa de preço, o ano ou a categoria, ou limpe os filtros para ver todo o estoque.'
                  }
                  acao={
                    <div className="flex flex-wrap justify-center gap-3">
                      {totalDisponiveis > 0 ? (
                        <Button variant="outline" onClick={limparFiltros}>
                          Limpar filtros
                        </Button>
                      ) : null}
                      <Button to="/contato">Falar com a loja</Button>
                    </div>
                  }
                />
              </div>
            )}

          </div>
        </div>
      </section>

      {/* A esteira de marcas fecha a vitrine, como na Home: fica depois
          do resultado para não competir com os filtros. */}
      <Marcas />

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
                filtros={rascunhoAtual}
                motos={motos}
                precoMaximo={precoMaximo}
                onChange={(proximo) => {
                  setRascunho(proximo)
                  if (proximo.precoMax !== rascunhoAtual.precoMax) {
                    setTetoPrecoRascunhoAlterado(true)
                  }
                }}
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
                  className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-black transition-colors hover:bg-neutral-200"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* Botão flutuante de filtro — só no celular. Ele é o espelho do
          WhatsApp no outro canto. */}
      <button
        type="button"
        onClick={(e) => abrirFolha(e.currentTarget)}
        aria-label={
          temAtivos ? `Abrir filtros, ${ativos.length} ativos` : 'Abrir filtros'
        }
        aria-expanded={filtrosAbertos}
        aria-haspopup="dialog"
        className="fixed left-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 grid size-14 place-items-center rounded-2xl border border-borda-forte bg-painel-2 text-texto transition-colors hover:border-marca hover:text-marca-texto lg:hidden"
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
