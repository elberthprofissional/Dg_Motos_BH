import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import {
  ANO_MIN,
  FILTROS_PADRAO,
  PRECO_MIN,
  filtrarMotos,
  tetoPrecoDisponivel,
} from '../lib/filters'
import type { BikeFilterState } from '../types'
import { usePageMeta } from '../hooks/usePageMeta'
import { Marcas } from '../components/home/MarcasProcuradas'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { EstadoVazio } from '../components/ui/EstadoVazio'
import { Button } from '../components/ui/Button'
import { Revelar } from '../components/ui/Revelar'
import { formatPrice } from '../lib/format'
import { BarraFiltrosDesktop } from '../components/estoque/BarraFiltrosDesktop'
import { FolhaFiltrosMobile } from '../components/estoque/FolhaFiltrosMobile'
import {
  BotaoFiltrosFlutuante,
  EtiquetasFiltros,
  type EtiquetaFiltro,
} from '../components/estoque/EtiquetasFiltros'

/**
 * Estoque — a vitrine completa do pátio.
 *
 * A página começa direto no catálogo: filtros na barra do desktop (aplicam
 * na hora) e o resultado em grade de vitrines. O título fica só para
 * leitores de tela.
 *
 * A folha do celular trabalha com um rascunho: o visitante ajusta os
 * campos e só então aplica. Assim o resultado não muda a cada arrasto
 * de slider, e o botão "Aplicar filtros" tem uma função clara.
 *
 * A coluna cresce dentro do <main>: num pátio curto (poucas motos), a
 * sobra de altura fica entre o resultado e a esteira de marcas, e a
 * esteira continua encostada no rodapé — como na Home, onde o conteúdo
 * é longo demais para sobrar espaço.
 *
 * Peças visuais moram em `components/estoque/`: a barra do desktop, a
 * folha do celular e as etiquetas de filtros ativos. Aqui fica a
 * máquina de estado dos filtros.
 */
export function Estoque() {
  const { motos } = useCatalogo()
  const [searchParams] = useSearchParams()
  const marcaUrl = searchParams.get('marca') ?? ''
  const buscaUrl = searchParams.get('busca') ?? ''
  const precoMaximo = useMemo(() => tetoPrecoDisponivel(motos), [motos])

  usePageMeta(
    'Estoque | DG Motos — Motocicletas seminovas em BH',
    'Catálogo de motocicletas seminovas da DG Motos em Belo Horizonte: busque por marca ou modelo e filtre por marca, preço e ano.',
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
  const ativos: EtiquetaFiltro[] = []

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

  const temAtivos = ativos.length > 0
  const totalDisponiveis = motos.filter((moto) => moto.status === 'disponivel').length

  return (
    <div className="flex grow flex-col pt-cabecalho">
      <section className="grow bg-fundo pt-2 pb-6 sm:pt-3 sm:pb-8">
        <div className="container-site flex grow">
          {/* Resultado */}
          <div className="min-w-0 flex-1">
            {/* A vitrine abre direto no grid, sem título visível — mas
                a página precisa de um h1 para o leitor de tela e para
                o buscador. O sr-only entrega o nome sem mexer no
                desenho compacto da barra de filtros. */}
            <h1 className="sr-only">Estoque de motos seminovas em Belo Horizonte</h1>
            <h2 className="sr-only">Resultados do estoque</h2>

            {/* Barra de filtros do desktop */}
            <BarraFiltrosDesktop
              motos={motos}
              filtros={filtros}
              filtrosAtuais={filtrosAtuais}
              precoMaximo={precoMaximo}
              temAtivos={temAtivos}
              atualizar={atualizar}
              limparFiltros={limparFiltros}
            />

            {/* No celular, a folha de filtros abre por aqui. */}
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={(e) => abrirFolha(e.currentTarget)}
                aria-haspopup="dialog"
                aria-expanded={filtrosAbertos}
                className="btn btn-secondary h-11 shrink-0 gap-2 rounded-lg px-4 text-[13px]"
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

            {temAtivos ? <EtiquetasFiltros ativos={ativos} onLimparTudo={limparFiltros} /> : null}

            {resultados.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {resultados.map((bike, i) => (
                  <Revelar key={bike.id} atraso={Math.min(i, 6) * 45}>
                    <BikeCard bike={bike} priority={i < 3} />
                  </Revelar>
                ))}
              </div>
            ) : (
              <div className="bg-painel px-4 py-2 sm:px-8">
                <EstadoVazio
                  icone={<SearchX className="size-7" aria-hidden="true" />}
                  titulo={totalDisponiveis === 0 ? 'Sem motos anunciadas agora' : 'Nenhuma moto encontrada com esses filtros'}
                  descricao={
                    totalDisponiveis === 0
                      ? 'Fale com a loja para saber quando chegam as próximas.'
                      : 'Ajuste a faixa de preço ou o ano, ou limpe os filtros para ver todo o estoque.'
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

      {/* Folha de filtros do celular */}
      {filtrosAbertos && (
        <FolhaFiltrosMobile
          motos={motos}
          rascunho={rascunhoAtual}
          precoMaximo={precoMaximo}
          folhaRef={folhaRef}
          aoMudar={(proximo) => {
            setRascunho(proximo)
            if (proximo.precoMax !== rascunhoAtual.precoMax) {
              setTetoPrecoRascunhoAlterado(true)
            }
          }}
          onAplicar={aplicarEFechar}
          onCancelar={() => {
            setFiltrosAbertos(false)
            gatilhoRef.current?.focus()
          }}
          onLimpar={limparFiltros}
        />
      )}

      {/* Botão flutuante de filtro — espelho do WhatsApp no outro canto. */}
      <BotaoFiltrosFlutuante
        abertos={filtrosAbertos}
        contarAtivos={ativos.length}
        onAbrir={abrirFolha}
      />
    </div>
  )
}
