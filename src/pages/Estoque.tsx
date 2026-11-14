import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
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
import { BikeCard } from '../components/motorcycles/BikeCard'
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
      <section className="grow pt-2 pb-12 sm:pt-3 sm:pb-16">
        <div className="container-site flex grow">
          {/* Resultado */}
          <div className="min-w-0 flex-1">
            {/* O título fica só para leitores de tela e buscadores: o
                cabeçalho já nomeia a página e o filtro assume o topo. */}
            <h1 className="sr-only">Estoque</h1>
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
                className="btn btn-secondary h-11 shrink-0 gap-2 px-4 text-[13px]"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Filtros
                {temAtivos ? (
                  <span className="grid size-5 place-items-center bg-marca text-[10px] font-bold text-white">
                    {ativos.length}
                  </span>
                ) : null}
              </button>
            </div>

            {temAtivos ? <EtiquetasFiltros ativos={ativos} onLimparTudo={limparFiltros} /> : null}

            {resultados.length > 0 ? (
              <>
                {/* Desktop: índice editorial do pátio — fileiras separadas
                    por linha fina, foto à esquerda, preço vermelho à
                    direita. Sem caixa, sem grade de marketplace. */}
                <div className="estoque-indice hidden divide-y divide-borda lg:block">
                  {resultados.map((bike) => (
                    <BikeCard key={bike.id} bike={bike} variante="indice" />
                  ))}
                </div>

                {/* Mobile e tablet: grade de cartões — dois por linha no
                    celular, para a lista não virar uma coluna de fotos
                    gigantes de alturas diferentes. */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:hidden">
                  {resultados.map((bike, i) => (
                    <Revelar key={bike.id} atraso={Math.min(i, 6) * 45}>
                      <BikeCard bike={bike} priority={i < 3} />
                    </Revelar>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-16 text-center sm:py-24">
                <span aria-hidden="true" className="block h-0.5 w-12 bg-marca" />
                <h2 className="mt-6 font-display text-[1.375rem] leading-tight font-bold tracking-[-0.02em] text-texto">
                  {totalDisponiveis === 0
                    ? 'Sem motos anunciadas agora'
                    : 'Nenhuma moto encontrada'}
                </h2>
                <p className="mt-2.5 max-w-[40ch] text-[15px] leading-relaxed text-texto-2">
                  {totalDisponiveis === 0
                    ? 'Fale com a loja para saber quando chegam as próximas.'
                    : 'Ajuste a faixa de preço ou o ano, ou veja todo o estoque de uma vez.'}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                  {totalDisponiveis > 0 ? (
                    <Button variant="outline" onClick={limparFiltros}>
                      Limpar filtros
                    </Button>
                  ) : null}
                  <Button to="/contato" variant="ghost">
                    Falar com a loja
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

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
