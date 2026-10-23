import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArchiveRestore,
  CircleDollarSign,
  Eye,
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

const FILTROS: { valor: FiltroEstoque['status']; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas as situações' },
  { valor: 'disponivel', rotulo: 'Disponíveis' },
  { valor: 'indisponivel', rotulo: 'Indisponíveis' },
  { valor: 'vendida', rotulo: 'Vendidas' },
]

type OrdemEstoque = 'padrao' | 'preco-desc' | 'preco-asc' | 'ano-desc'

const ORDENS: { valor: OrdemEstoque; rotulo: string }[] = [
  { valor: 'padrao', rotulo: 'Ordem padrão' },
  { valor: 'preco-desc', rotulo: 'Maior preço' },
  { valor: 'preco-asc', rotulo: 'Menor preço' },
  { valor: 'ano-desc', rotulo: 'Mais novo' },
]

const STATUS_ROTULO: Record<MotorcycleStatus, string> = {
  disponivel: 'Disponível',
  indisponivel: 'Indisponível',
  vendida: 'Vendida',
}

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0')
}

function ordenarEstoque(motos: Motorcycle[], ordem: OrdemEstoque): Motorcycle[] {
  if (ordem === 'preco-desc') return [...motos].sort((a, b) => b.preco - a.preco)
  if (ordem === 'preco-asc') return [...motos].sort((a, b) => a.preco - b.preco)
  if (ordem === 'ano-desc') return [...motos].sort((a, b) => b.ano - a.ano)
  return [...motos].sort(
    (a, b) =>
      Number(b.destaque) - Number(a.destaque) ||
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
          <div className="estoque-celula-situacao" role="cell">
            <Esqueleto className="h-3 w-20" />
          </div>
          <div className="estoque-celula-valor" role="cell">
            <Esqueleto className="h-3.5 w-24" />
          </div>
          <div className="estoque-celula-acoes" role="cell">
            <Esqueleto className="h-8 w-32" />
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
}) {
  const [status, setStatus] = useState<FiltroEstoque['status']>('todas')
  const [ordem, setOrdem] = useState<OrdemEstoque>('padrao')

  const visiveis = useMemo(() => {
    if (motos === null) return []
    return ordenarEstoque(filtrarEstoque(motos, { busca, status }), ordem)
  }, [motos, busca, status, ordem])

  const filtrando = busca.trim() !== '' || status !== 'todas'
  const ajustado = filtrando || ordem !== 'padrao'
  const erroAtivo = erro !== null

  const resumo = useMemo(
    () => (motos === null || erroAtivo ? null : resumirEstoque(motos)),
    [motos, erroAtivo],
  )
  const emDestaque = useMemo(
    () => (motos === null ? 0 : motos.filter((m) => m.destaque && m.status === 'disponivel').length),
    [motos],
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

  const total = motos === null ? 0 : motos.length
  const vistos = visiveis.length
  const contagem = erroAtivo || motos === null ? '' : filtrando ? `${doisDigitos(vistos)} de ${doisDigitos(total)}` : doisDigitos(total)
  const unidadeContagem = filtrando ? (vistos === 1 ? 'veículo' : 'veículos') : total === 1 ? 'veículo' : 'veículos'

  return (
    <div className="estoque-pagina">
      <header className="estoque-cabecalho-pagina">
        <div className="estoque-titulo-linha">
          <h1 className="estoque-h1">Estoque de motocicletas</h1>
          <button type="button" onClick={() => onEditando({})} className="estoque-btn-primario">
            <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
            Cadastrar moto
          </button>
        </div>

        <div className="estoque-resumo" aria-live="polite">
          {erroAtivo ? (
            <span className="estoque-resumo-total">Estoque indisponível</span>
          ) : motos === null ? (
            <span className="estoque-resumo-total">Carregando inventário…</span>
          ) : resumo ? (
            <>
              <span className="estoque-resumo-total">
                {doisDigitos(total)} {total === 1 ? 'veículo no inventário' : 'veículos no inventário'}
              </span>
              <span className="estoque-resumo-item">
                {doisDigitos(resumo.disponiveis)} {resumo.disponiveis === 1 ? 'disponível' : 'disponíveis'}
              </span>
              <span className="estoque-resumo-item">
                {doisDigitos(emDestaque)} em destaque
              </span>
              <span className="estoque-resumo-item">
                {doisDigitos(resumo.indisponiveis)} {resumo.indisponiveis === 1 ? 'indisponível' : 'indisponíveis'}
              </span>
              <span className="estoque-resumo-item">
                {doisDigitos(resumo.vendidas)} {resumo.vendidas === 1 ? 'vendido' : 'vendidos'}
              </span>
              <span className="estoque-resumo-valor">
                {formatPrice(resumo.valorEmEstoque)} <span>em estoque</span>
              </span>
            </>
          ) : null}
        </div>
      </header>

      <div className="estoque-operacoes">
        <CampoBusca
          value={busca}
          onChange={onBusca}
          placeholder="Buscar por marca, modelo ou ano"
          rotulo="Buscar no estoque"
          className="estoque-busca-primaria"
        />

        <div className="estoque-operacoes-direita">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FiltroEstoque['status'])}
            aria-label="Filtrar por situação"
            className={`estoque-select ${status !== 'todas' ? 'estoque-select-ativo' : ''}`}
          >
            {FILTROS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>

          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as OrdemEstoque)}
            aria-label="Ordenar inventário"
            className={`estoque-select ${ordem !== 'padrao' ? 'estoque-select-ativo' : ''}`}
          >
            {ORDENS.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>

          <div className="estoque-contagem" aria-live="polite">
            {contagem ? (
              <span className="estoque-contagem-texto">
                {contagem} {unidadeContagem}
              </span>
            ) : null}
            {ajustado ? (
              <button type="button" onClick={limpar} className="estoque-limpar">
                Limpar
              </button>
            ) : null}
          </div>
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
          <span role="columnheader" className="estoque-col-situacao">
            Situação
          </span>
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
                <p className="estoque-estado-titulo">Não foi possível carregar o estoque</p>
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
                  {filtrando ? 'Nenhuma moto encontrada' : 'Nenhum veículo no inventário'}
                </p>
                <p className="estoque-estado-descricao">
                  {filtrando
                    ? 'A busca e a situação selecionada não retornaram nenhum veículo.'
                    : 'Cadastre a primeira moto para iniciar o inventário da loja.'}
                </p>
              </div>
              {filtrando ? (
                <button type="button" onClick={limpar} className="estoque-estado-acao">
                  Limpar filtros
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
                      alt=""
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

                <div className="estoque-celula-situacao" role="cell">
                  <span className={`estoque-status estoque-status-${moto.status}`}>
                    <span className="estoque-status-ponto" aria-hidden="true" />
                    {STATUS_ROTULO[moto.status]}
                  </span>
                  {moto.destaque && moto.status === 'disponivel' ? (
                    <span className="estoque-destaque">Destaque</span>
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
