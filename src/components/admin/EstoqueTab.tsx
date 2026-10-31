import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Plus, RotateCw } from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import type { MotoParaSalvar } from '../../lib/catalog'
import { filtrarEstoque, resumirEstoque } from '../../lib/painel'
import { formatPrice } from '../../lib/format'
import { CampoBusca } from '../ui/CampoBusca'
import { MotoForm } from './MotoForm'
import { EsqueletoEstoque } from './estoque/EsqueletoEstoque'
import { LinhaInventario } from './estoque/LinhaInventario'
import { ORDENS, ordenarEstoque } from './estoque/comum'
import type { OrdemEstoque } from './estoque/comum'

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
    return ordenarEstoque(filtrarEstoque(noPatio, { busca }), ordem)
  }, [motos, noPatio, busca, ordem])

  const filtrando = busca.trim() !== ''
  const ajustado = filtrando || ordem !== 'padrao'
  const erroAtivo = erro !== null

  const resumo = useMemo(
    () => (motos === null || erroAtivo ? null : resumirEstoque(motos)),
    [motos, erroAtivo],
  )

  function limpar() {
    onBusca('')
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
  // A contagem só aparece quando há filtro: em repouso os indicadores
  // logo abaixo já dizem quantas motos existem.
  const contagem =
    erroAtivo || motos === null
      ? ''
      : `${vistos} de ${total} ${total === 1 ? 'moto' : 'motos'} na tela`

  return (
    <div className="estoque-pagina">
      <header className="estoque-cabecalho-pagina">
        <div className="estoque-titulo-linha">
          <h1 className="estoque-h1">
            Estoque
            <span className="estoque-h1-ponto" aria-hidden="true">
              .
            </span>
          </h1>
          <button type="button" onClick={() => onEditando({})} className="estoque-btn-primario">
            <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
            Cadastrar moto
          </button>
        </div>

        {/* A contagem saiu daqui: o total já está nos indicadores logo
            abaixo (Disponíveis/Vendidas), e repetir "4 motos no pátio"
            aqui só somava o mesmo número duas vezes. A faixa continua
            montada para anunciar carregamento e erro — quando não tem
            nada a dizer, ela some do layout. */}
        <div className="estoque-resumo empty:hidden" aria-live="polite">
          {erroAtivo ? (
            <span className="estoque-resumo-total">Estoque indisponível</span>
          ) : motos === null ? (
            <span className="estoque-resumo-total">Abrir o pátio…</span>
          ) : null}
        </div>
      </header>

      {motos !== null && !erroAtivo && resumo ? (
        <section className="estoque-indicadores" aria-label="Resumo do estoque">
          <div className="estoque-indicador">
            <span className="estoque-indicador-rotulo">Disponíveis</span>
            <span className="estoque-indicador-valor">{resumo.disponiveis}</span>
          </div>
          <div className="estoque-indicador estoque-indicador-financeiro">
            <span className="estoque-indicador-rotulo">Valor em estoque</span>
            <span className="estoque-indicador-valor">{formatPrice(resumo.valorEmEstoque)}</span>
          </div>
        </section>
      ) : null}

      {/* Barra de filtros: cada controle tem o mesmo desenho de campo
          (mesma altura, mesma borda, mesmo fundo) e o resumo fica à
          direita. Só busca e ordem — a situação não é filtro aqui:
          vendida mora em Vendidas e o pátio é o que ainda vende. */}
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
          <span role="columnheader" className="estoque-col-veiculo">
            Veículo
          </span>
          <span role="columnheader" className="estoque-col-loja">
            Tempo na loja
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
                    ? 'Nenhuma moto corresponde à busca. Limpe os filtros ou tente outro termo.'
                    : (resumo?.vendidas ?? 0) > 0
                      ? `${resumo?.vendidas} ${resumo?.vendidas === 1 ? 'moto vendida já está' : 'motos vendidas já estão'} na aba Vendidas.`
                      : 'Cadastre a primeira moto para começar. Ela aparece no site assim que salvar.'}
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
          visiveis.map((moto) => (
            <LinhaInventario
              key={moto.id}
              moto={moto}
              menuAberto={acoesAbertas === moto.id}
              onAlternarMenu={() =>
                setAcoesAbertas((abertas) => (abertas === moto.id ? null : moto.id))
              }
              onFecharMenu={() => setAcoesAbertas(null)}
              onAlterarStatus={onAlterarStatus}
              onEditando={onEditando}
              onPedirExclusao={onPedirExclusao}
            />
          ))
        )}
      </div>
    </div>
  )
}
