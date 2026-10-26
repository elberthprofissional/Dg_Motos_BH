import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArchiveRestore,
  ArrowRight,
  CircleDollarSign,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { motoParaFormulario } from '../../lib/catalog'
import type { MotoParaSalvar } from '../../lib/catalog'
import { filtrarEstoque, resumirEstoque } from '../../lib/painel'
import type { FiltroEstoque } from '../../lib/painel'
import { formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { CampoBusca } from '../ui/CampoBusca'
import { Esqueleto } from '../ui/Esqueleto'
import { MotoForm } from './MotoForm'

/* Vendida não é situação de estoque: a moto sai do pátio e passa a
   viver na aba Vendidas. Por isso não há filtro "Vendidas" aqui. */
type OrdemEstoque = 'padrao' | 'preco-desc' | 'preco-asc' | 'ano-desc'

const ORDENS: { valor: OrdemEstoque; rotulo: string }[] = [
  { valor: 'padrao', rotulo: 'Ordem padrão' },
  { valor: 'preco-desc', rotulo: 'Maior preço' },
  { valor: 'preco-asc', rotulo: 'Menor preço' },
  { valor: 'ano-desc', rotulo: 'Mais novo' },
]

function ordenarEstoque(motos: Motorcycle[], ordem: OrdemEstoque): Motorcycle[] {
  if (ordem === 'preco-desc') return [...motos].sort((a, b) => b.preco - a.preco)
  if (ordem === 'preco-asc') return [...motos].sort((a, b) => a.preco - b.preco)
  if (ordem === 'ano-desc') return [...motos].sort((a, b) => b.ano - a.ano)
  return [...motos].sort(
    (a, b) =>
      Number(b.emPromocao) - Number(a.emPromocao) ||
      b.ano - a.ano ||
      a.modelo.localeCompare(b.modelo, 'pt-BR'),
  )
}

function fichaTecnica(moto: Motorcycle): string[] {
  const itens = [String(moto.ano), moto.categoria]
  if (moto.cilindrada != null) itens.push(`${moto.cilindrada} cc`)
  if (moto.quilometragem != null) itens.push(formatKm(moto.quilometragem))
  return itens
}

function EsqueletoEstoque() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="estoque-linha" role="row" aria-busy="true">
          <span className="sr-only">Carregando veículo</span>
          <div className="estoque-celula-veiculo" role="cell">
            <Esqueleto className="estoque-thumb" />
            <div className="min-w-0 flex-1">
              <Esqueleto className="h-3.5 w-2/5" />
              <Esqueleto className="mt-2 h-3 w-3/5" />
            </div>
          </div>
          <div className="estoque-celula-valor" role="cell">
            <Esqueleto className="h-3.5 w-24" />
          </div>
          <div className="estoque-celula-acoes" role="cell">
            <Esqueleto className="h-11 w-full max-w-[14rem]" />
          </div>
        </div>
      ))}
    </>
  )
}

export function EstoqueTab({
  motos,
  erro,
  busca,
  onBusca,
  editando,
  onEditando,
  onPedirExclusao,
  onAlterarStatus,
  onSalva,
  onRecarregar,
  onIrParaVendidas,
}: {
  motos: Motorcycle[] | null
  erro: string | null
  busca: string
  onBusca: (valor: string) => void
  editando: { id?: string; dados?: MotoParaSalvar } | null
  onEditando: (v: { id?: string; dados?: MotoParaSalvar } | null) => void
  onPedirExclusao: (moto: Motorcycle) => void
  onAlterarStatus: (moto: Motorcycle, status: MotorcycleStatus) => void
  onSalva: () => void
  onRecarregar: () => void
  /** A moto vendida sai do pátio; o atalho leva para onde ela foi. */
  onIrParaVendidas: () => void
}) {
  const [status, setStatus] = useState<FiltroEstoque['status']>('todas')
  const [ordem, setOrdem] = useState<OrdemEstoque>('padrao')
  // Menu ⋯ do cartão (celular): um aberto por vez, pelo id da moto.
  const [acoesAbertas, setAcoesAbertas] = useState<string | null>(null)

  // Fecha o menu com Esc ou clique fora de qualquer menu ⋯. O
  // mousedown precedente ao click do próprio kebab não o fecha: só
  // conta clique fora do wrapper (o próprio toque alterna).
  useEffect(() => {
    if (!acoesAbertas) return
    function aoCliqueFora(evento: MouseEvent) {
      if (!(evento.target as HTMLElement).closest('[data-estoque-menu]')) {
        setAcoesAbertas(null)
      }
    }
    function aoEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAcoesAbertas(null)
    }
    window.addEventListener('mousedown', aoCliqueFora)
    window.addEventListener('keydown', aoEsc)
    return () => {
      window.removeEventListener('mousedown', aoCliqueFora)
      window.removeEventListener('keydown', aoEsc)
    }
  }, [acoesAbertas])

  // O pátio é o que ainda pode ser vendido. Vendida tem casa própria.
  const noPatio = useMemo(
    () => (motos ?? []).filter((moto) => moto.status !== 'vendida'),
    [motos],
  )

  const visiveis = useMemo(() => {
    if (motos === null) return []
    return ordenarEstoque(filtrarEstoque(noPatio, { busca, status }), ordem)
  }, [motos, noPatio, busca, status, ordem])

  const filtrando = busca.trim() !== '' || status !== 'todas'
  const ajustado = filtrando || ordem !== 'padrao'
  const erroAtivo = erro !== null

  const resumo = useMemo(
    () => (motos === null || erroAtivo ? null : resumirEstoque(motos)),
    [motos, erroAtivo],
  )

  function limpar() {
    onBusca('')
    setStatus('todas')
    setOrdem('padrao')
  }

  if (editando) {
    return (
      <MotoForm
        key={editando.id ?? 'nova'}
        id={editando.id}
        inicial={editando.dados}
        estoque={motos ?? []}
        onSalvo={onSalva}
        onCancelar={() => onEditando(null)}
      />
    )
  }

  const total = motos === null ? 0 : noPatio.length
  const vistos = visiveis.length
  // A contagem só aparece quando há filtro: em repouso ela repetia o
  // "4 motos cadastradas" que já está no cabeçalho.
  const contagem =
    erroAtivo || motos === null
      ? ''
      : `${vistos} de ${total} ${total === 1 ? 'moto' : 'motos'} na tela`

  return (
    <div className="estoque-pagina">
      <header className="estoque-cabecalho-pagina">
        <div className="estoque-titulo-linha">
          <h1 className="estoque-h1">Estoque</h1>
          <button type="button" onClick={() => onEditando({})} className="estoque-btn-primario">
            <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
            Cadastrar moto
          </button>
        </div>

        <div className="estoque-resumo" aria-live="polite">
          {erroAtivo ? (
            <span className="estoque-resumo-total">Estoque indisponível</span>
          ) : motos === null ? (
            <span className="estoque-resumo-total">Abrir o pátio…</span>
          ) : resumo ? (
            <span className="estoque-resumo-total">
              {resumo.disponiveis + resumo.indisponiveis}{' '}
              {resumo.disponiveis + resumo.indisponiveis === 1 ? 'moto no pátio' : 'motos no pátio'}
            </span>
          ) : null}
        </div>
      </header>

      {motos !== null && !erroAtivo && resumo ? (
        <section className="estoque-indicadores" aria-label="Resumo do estoque">
          <div className="estoque-indicador">
            <span className="estoque-indicador-valor">{resumo.disponiveis}</span>
            <span className="estoque-indicador-rotulo">Disponíveis</span>
          </div>
          <button
            type="button"
            onClick={onIrParaVendidas}
            className="estoque-indicador estoque-indicador-acao"
            aria-label={`Ver as ${resumo.vendidas} vendidas`}
          >
            <span className="estoque-indicador-valor">{resumo.vendidas}</span>
            <span className="estoque-indicador-rotulo inline-flex items-center gap-1.5">
              Vendidas
              <ArrowRight className="size-3.5 text-texto-3" aria-hidden="true" />
            </span>
          </button>
          <div className="estoque-indicador estoque-indicador-financeiro">
            <span className="estoque-indicador-valor">{formatPrice(resumo.valorEmEstoque)}</span>
            <span className="estoque-indicador-rotulo">Valor em estoque</span>
          </div>
        </section>
      ) : null}

      {/* Barra de filtros: cada controle tem o mesmo desenho de campo
          (mesma altura, mesma borda, mesmo fundo) e o resumo fica à
          direita. A situação virou um grupo de quatro opções à vista —
          num select, "quantas vendidas?" ficava escondido atrás de um
          clique. */}
      <div className="estoque-operacoes">
        <CampoBusca
          value={busca}
          onChange={onBusca}
          placeholder="Buscar por marca, modelo ou ano"
          rotulo="Buscar no estoque"
          className="estoque-busca-primaria"
        />

        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as OrdemEstoque)}
          aria-label="Ordenar inventário"
          className="estoque-select"
        >
          {ORDENS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>

        <div className="estoque-contagem" aria-live="polite">
          {filtrando && contagem ? (
            <span className="estoque-contagem-texto">{contagem}</span>
          ) : null}
          {ajustado ? (
            <button type="button" onClick={limpar} className="estoque-limpar">
              Limpar
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="estoque-inventario"
        role="table"
        aria-label="Inventário de motocicletas"
        aria-busy={motos === null}
      >
        <div className="estoque-cabecalho" role="row">
          <span role="columnheader">Veículo</span>
          <span role="columnheader" className="estoque-col-valor">
            Valor
          </span>
          <span role="columnheader" className="estoque-col-acoes">
            Ações
          </span>
        </div>

        {erroAtivo ? (
          <div className="estoque-estado" role="row">
            <div className="estoque-estado-celula" role="cell">
              <div className="estoque-estado-texto">
                <p className="estoque-estado-titulo">Não deu pra abrir o estoque agora</p>
                <p className="estoque-estado-descricao">{erro}</p>
              </div>
              <button type="button" onClick={onRecarregar} className="estoque-estado-acao">
                <RotateCw className="size-3.5" aria-hidden="true" />
                Tentar novamente
              </button>
            </div>
          </div>
        ) : motos === null ? (
          <EsqueletoEstoque />
        ) : visiveis.length === 0 ? (
          <div className="estoque-estado" role="row">
            <div className="estoque-estado-celula" role="cell">
              <div className="estoque-estado-texto">
                <p className="estoque-estado-titulo">
                  {filtrando ? 'Nada com esses filtros' : 'Nenhuma moto no pátio'}
                </p>
                <p className="estoque-estado-descricao">
                  {filtrando
                    ? 'Nenhuma moto caiu nessa busca. Limpe os filtros ou tente outro termo.'
                    : (resumo?.vendidas ?? 0) > 0
                      ? `${resumo?.vendidas} ${resumo?.vendidas === 1 ? 'moto vendida já está' : 'motos vendidas já estão'} na aba Vendidas.`
                      : 'Cadastre a primeira moto para começar — rápido, chega em dois minutos.'}
                </p>
              </div>
              {filtrando ? (
                <button type="button" onClick={limpar} className="estoque-estado-acao">
                  Limpar filtros
                </button>
              ) : (resumo?.vendidas ?? 0) > 0 ? (
                <button type="button" onClick={onIrParaVendidas} className="estoque-estado-acao">
                  Ver as vendidas
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              ) : (
                <button type="button" onClick={() => onEditando({})} className="estoque-estado-acao">
                  <Plus className="size-3.5" aria-hidden="true" />
                  Cadastrar moto
                </button>
              )}
            </div>
          </div>
        ) : (
          visiveis.map((moto) => {
            const ficha = fichaTecnica(moto)
            const vendida = moto.status === 'vendida'
            return (
              <div key={moto.id} className="estoque-linha" role="row">
                <div className="estoque-celula-veiculo" role="cell">
                  <div className="estoque-foto">
                    <img
                      src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                      alt={`${moto.marca} ${moto.modelo}, ${moto.ano}`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = PLACEHOLDER_CARD
                      }}
                    />
                  </div>
                  <div className="estoque-veiculo-texto">
                    <p className="estoque-nome" title={`${moto.marca} ${moto.modelo}`}>
                      {moto.marca} {moto.modelo}
                    </p>
                    <p className="estoque-ficha">
                      {ficha.map((item, i) => (
                        <span key={i}>
                          {item}
                          {i < ficha.length - 1 ? (
                            <>
                              {' '}
                              <span className="estoque-ficha-sep" aria-hidden="true">
                                ·
                              </span>{' '}
                            </>
                          ) : null}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                {/* Menu ⋯ do cartão: vive só no celular (o CSS esconde
                    na mesa). Cada item fecha o menu antes de agir, e
                    Excluir continua passando pela confirmação global. */}
                <div className="estoque-menu-acoes" data-estoque-menu>
                  <button
                    type="button"
                    onClick={() =>
                      setAcoesAbertas((abertas) => (abertas === moto.id ? null : moto.id))
                    }
                    aria-expanded={acoesAbertas === moto.id}
                    aria-haspopup="menu"
                    aria-label={`Mais ações de ${moto.marca} ${moto.modelo}`}
                    className="estoque-menu-botao"
                  >
                    <MoreHorizontal className="size-5" strokeWidth={1.7} aria-hidden="true" />
                  </button>

                  {acoesAbertas === moto.id ? (
                    <div
                      role="menu"
                      aria-label={`Ações de ${moto.marca} ${moto.modelo}`}
                      className="estoque-menu-painel"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAcoesAbertas(null)
                          onAlterarStatus(moto, vendida ? 'disponivel' : 'vendida')
                        }}
                        className="estoque-menu-item"
                      >
                        {vendida ? (
                          <ArchiveRestore className="size-4" strokeWidth={1.7} aria-hidden="true" />
                        ) : (
                          <CircleDollarSign className="size-4" strokeWidth={1.7} aria-hidden="true" />
                        )}
                        {vendida ? 'Reativar moto' : 'Marcar como vendida'}
                      </button>
                      <Link
                        role="menuitem"
                        to={`/moto/${moto.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="estoque-menu-item"
                        onClick={() => setAcoesAbertas(null)}
                      >
                        <Eye className="size-4" strokeWidth={1.7} aria-hidden="true" />
                        Ver no site
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAcoesAbertas(null)
                          onEditando({ id: moto.id, dados: motoParaFormulario(moto) })
                        }}
                        className="estoque-menu-item"
                      >
                        <Pencil className="size-4" strokeWidth={1.7} aria-hidden="true" />
                        Editar
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAcoesAbertas(null)
                          onPedirExclusao(moto)
                        }}
                        className="estoque-menu-item estoque-menu-item-perigo"
                      >
                        <Trash2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
                        Excluir
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="estoque-celula-valor" role="cell">
                  <span className="estoque-preco">{formatPrice(moto.preco)}</span>
                </div>

                <div className="estoque-celula-acoes" role="cell">
                  <div className="estoque-acoes">
                    <button
                      type="button"
                      onClick={() => onAlterarStatus(moto, vendida ? 'disponivel' : 'vendida')}
                      className="estoque-acao"
                      aria-label={
                        vendida
                          ? `Reativar ${moto.marca} ${moto.modelo}`
                          : `Marcar ${moto.marca} ${moto.modelo} como vendida`
                      }
                      title={vendida ? 'Reativar' : 'Marcar como vendida'}
                    >
                      {vendida ? (
                        <ArchiveRestore className="size-4" strokeWidth={1.7} aria-hidden="true" />
                      ) : (
                        <CircleDollarSign className="size-4" strokeWidth={1.7} aria-hidden="true" />
                      )}
                    </button>
                    <Link
                      to={`/moto/${moto.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="estoque-acao"
                      aria-label={`Ver ${moto.marca} ${moto.modelo} no site`}
                      title="Ver no site"
                    >
                      <Eye className="size-4" strokeWidth={1.7} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onEditando({ id: moto.id, dados: motoParaFormulario(moto) })}
                      className="estoque-acao"
                      aria-label={`Editar ${moto.marca} ${moto.modelo}`}
                      title="Editar"
                    >
                      <Pencil className="size-4" strokeWidth={1.7} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPedirExclusao(moto)}
                      className="estoque-acao estoque-acao-perigo"
                      aria-label={`Excluir ${moto.marca} ${moto.modelo}`}
                      title="Excluir"
                    >
                      <Trash2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
