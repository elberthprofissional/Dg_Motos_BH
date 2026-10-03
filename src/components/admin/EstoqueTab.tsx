import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Eye, Inbox, Pencil, Plus, SearchX, SlidersHorizontal, Star, Trash2 } from 'lucide-react'
import type { Motorcycle, MotorcycleAvailability } from '../../types'
import { motoParaFormulario } from '../../lib/catalog'
import type { MotoParaSalvar } from '../../lib/catalog'
import { filtrarEstoque } from '../../lib/painel'
import type { FiltroEstoque } from '../../lib/painel'
import { formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { Badge } from '../ui/Badge'
import type { VarianteBadge } from '../ui/Badge'
import { CampoBusca } from '../ui/CampoBusca'
import { EstadoVazio } from '../ui/EstadoVazio'
import { EsqueletoLinha } from '../ui/Esqueleto'
import { MotoForm } from './MotoForm'

/**
 * Status da moto no estoque.
 *
 * `disponivel` é o único estado positivo (verde). `reservada` é um estado
 * comercial normal, então fica em cinza — âmbar é alerta, e uma moto
 * reservada não é alerta. `vendida` é histórica: some do site, continua
 * no painel para o dono reativar.
 */
const STATUS: Record<MotorcycleAvailability, { rotulo: string; variante: VarianteBadge; margem: string }> = {
  disponivel: { rotulo: 'Disponível', variante: 'ok', margem: 'before:bg-ok' },
  reservada: { rotulo: 'Reservada', variante: 'atencao', margem: 'before:bg-warn' },
  vendida: { rotulo: 'Vendida', variante: 'apagado', margem: 'before:bg-white/15' },
}

const FILTROS: { valor: FiltroEstoque['disponibilidade']; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todos os status' },
  { valor: 'disponivel', rotulo: 'Disponíveis' },
  { valor: 'reservada', rotulo: 'Reservadas' },
  { valor: 'vendida', rotulo: 'Vendidas' },
]

/**
 * ============================================================
 * FILTROS: área compacta no celular
 * ============================================================
 * A busca fica sempre visível — é o filtro que o dono usa 90% das vezes
 * e precisa estar a um toque. O select de status vai para dentro de um
 * painel expansível: ele é usado com menos frequência, e aberto por
 * padrão ocupava uma linha inteira da tela de 320px.
 *
 * O botão mostra o status ativo dentro do rótulo, então um filtro aplicado
 * continua visível mesmo com o painel fechado — o que a versão anterior
 * não garantia.
 */
function PainelFiltros({
  disponibilidade,
  onDisponibilidade,
}: {
  disponibilidade: FiltroEstoque['disponibilidade']
  onDisponibilidade: (v: FiltroEstoque['disponibilidade']) => void
}) {
  const [aberto, setAberto] = useState(false)
  const rotulo = FILTROS.find((f) => f.valor === disponibilidade)?.rotulo ?? 'Todos os status'
  const filtrando = disponibilidade !== 'todas'

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="estoque-filtros"
        className={`foco-painel flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors ${
          filtrando
            ? 'border-brand-500/40 bg-brand-500/5 text-brand-500'
            : 'border-white/10 bg-night-800 text-steel-300'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{filtrando ? rotulo : 'Filtrar por status'}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {aberto && (
        <div id="estoque-filtros" className="animate-fade mt-2">
          <select
            value={disponibilidade}
            onChange={(e) => {
              onDisponibilidade(e.target.value as FiltroEstoque['disponibilidade'])
              setAberto(false)
            }}
            aria-label="Filtrar por status"
            className="select h-11"
          >
            {FILTROS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

export function EstoqueTab({
  motos,
  busca,
  onBusca,
  editando,
  onEditando,
  onPedirExclusao,
}: {
  motos: Motorcycle[] | null
  busca: string
  onBusca: (valor: string) => void
  editando: { id?: string; dados?: MotoParaSalvar } | null
  onEditando: (v: { id?: string; dados?: MotoParaSalvar } | null) => void
  onPedirExclusao: (moto: Motorcycle) => void
}) {
  const [disponibilidade, setDisponibilidade] = useState<FiltroEstoque['disponibilidade']>('todas')

  const visiveis = useMemo(
    () => (motos === null ? [] : filtrarEstoque(motos, { busca, disponibilidade })),
    [motos, busca, disponibilidade],
  )
  const filtrando = busca.trim() !== '' || disponibilidade !== 'todas'

  /* ---------------------------- Formulário ---------------------------- */

  if (editando) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => onEditando(null)}
          className="foco-painel inline-flex items-center gap-1.5 rounded text-sm text-steel-400 transition-colors hover:text-paper"
        >
          <Eye className="size-4" aria-hidden="true" />
          Voltar ao estoque
        </button>
        <MotoForm
          key={editando.id ?? 'nova'}
          id={editando.id}
          inicial={editando.dados}
          onSalvo={() => onEditando(null)}
          onCancelar={() => onEditando(null)}
        />
      </div>
    )
  }

  /* ----------------------------- Listagem ----------------------------- */

  return (
    <div className="space-y-5">
      {/* Cabeçalho: título + contagem à esquerda, controles à direita.
          No celular o título some (a topbar já diz "Estoque") e os
          controles viram uma pilha: busca, filtro expansível, botão. */}
      <header className="space-y-3">
        <div className="hidden flex-wrap items-end justify-between gap-4 sm:flex">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-wide text-paper uppercase">
              Estoque
            </h2>
            <p className="mt-1 text-sm text-steel-500" aria-live="polite">
              {motos === null
                ? 'Carregando…'
                : filtrando
                  ? `${visiveis.length} de ${motos.length} ${motos.length === 1 ? 'moto' : 'motos'}`
                  : `${motos.length} ${motos.length === 1 ? 'moto cadastrada' : 'motos cadastradas'}`}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <CampoBusca
              value={busca}
              onChange={onBusca}
              placeholder="Buscar por marca, modelo ou ano"
              rotulo="Buscar no estoque"
              className="sm:w-64"
            />
            <select
              value={disponibilidade}
              onChange={(e) =>
                setDisponibilidade(e.target.value as FiltroEstoque['disponibilidade'])
              }
              aria-label="Filtrar por status"
              className="select h-10 sm:w-44"
            >
              {FILTROS.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.rotulo}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => onEditando({})} className="btn btn-primary h-10">
              <Plus className="size-4" aria-hidden="true" />
              Nova moto
            </button>
          </div>
        </div>

        {/* Contagem + controles no celular */}
        <div className="space-y-2.5 sm:hidden">
          <p className="text-xs text-steel-500" aria-live="polite">
            {motos === null
              ? 'Carregando…'
              : filtrando
                ? `${visiveis.length} de ${motos.length} ${motos.length === 1 ? 'moto' : 'motos'}`
                : `${motos.length} ${motos.length === 1 ? 'moto cadastrada' : 'motos cadastradas'}`}
          </p>
          <CampoBusca
            value={busca}
            onChange={onBusca}
            placeholder="Buscar por marca, modelo ou ano"
            rotulo="Buscar no estoque"
          />
          <PainelFiltros
            disponibilidade={disponibilidade}
            onDisponibilidade={setDisponibilidade}
          />
          <button
            type="button"
            onClick={() => onEditando({})}
            className="btn btn-primary h-11 w-full"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova moto
          </button>
        </div>
      </header>

      {motos === null ? (
        <EsqueletoLinha />
      ) : visiveis.length === 0 ? (
        <div className="card">
          {filtrando ? (
            <EstadoVazio
              compacto
              icone={<SearchX className="size-4" aria-hidden="true" />}
              titulo="Nenhuma moto encontrada"
              descricao="Nenhum cadastro bate com a busca ou o status selecionado. Ajuste os filtros para ver o restante do estoque."
              acao={
                <button
                  type="button"
                  onClick={() => {
                    onBusca('')
                    setDisponibilidade('todas')
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Limpar filtros
                </button>
              }
            />
          ) : (
            <EstadoVazio
              compacto
              icone={<Inbox className="size-4" aria-hidden="true" />}
              titulo="Estoque vazio"
              descricao="Nenhuma moto cadastrada. A primeira cadastro é o que faz o site ter vitrine — e o que o Google começa a indexar."
              acao={
                <button type="button" onClick={() => onEditando({})} className="btn btn-primary btn-sm">
                  <Plus className="size-4" aria-hidden="true" />
                  Cadastrar a primeira moto
                </button>
              }
            />
          )}
        </div>
      ) : (
        /* ============================================================
         * Cartão da moto — duas arranjos, uma árvore só
         * ============================================================
         * Desktop: miniatura · identificação · preço · ações, tudo numa
         * linha, com o preço alinhado à direita como coluna.
         *
         * Celular: a linha de baixo traz preço e ações juntas, e as
         * ações ganham área de toque de 44px. Antes os três botões de
         * 36px ficavam espremidos ao lado do preço e era fácil tocar no
         * errado — o de excluir é irreversível.
         * ============================================================ */
        <ul className="space-y-2.5 sm:space-y-2">
          {visiveis.map((moto) => {
            const status = STATUS[moto.disponibilidade]
            return (
              <li
                key={moto.id}
                className={`card relative transition-colors hover:border-white/20 before:absolute before:top-3 before:bottom-3 before:left-0 before:w-0.5 before:rounded-full ${status.margem}`}
              >
                <div className="p-3">
                  <div className="flex gap-3 sm:items-center sm:gap-4">
                    {/* A miniatura não é link: o botão "ver" ao lado já
                        leva à ficha. Dois alvos para a mesma ação só
                        confundem a ordem de tabulação. */}
                    <img
                      src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                      alt=""
                      loading="lazy"
                      className="h-16 w-24 shrink-0 rounded-md object-cover sm:h-20 sm:w-28"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="truncate font-display text-sm font-semibold tracking-wide text-paper uppercase sm:text-base">
                          {moto.marca} {moto.modelo}
                        </h3>
                        <span className="text-sm text-steel-500 tabular-nums">{moto.ano}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-steel-500">
                        {moto.categoria}
                        {moto.cilindrada ? ` · ${moto.cilindrada} cc` : ''} · {formatKm(moto.quilometragem)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variante={status.variante} ponto>
                          {status.rotulo}
                        </Badge>
                        {moto.destaque && (
                          <Badge variante="marca">
                            <Star className="size-3" aria-hidden="true" />
                            Destaque
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Preço: coluna própria, alinhada à direita em
                        desktop. `w-32` reserva a largura para que duas
                        linhas de moto com preços de 4 e 5 dígitos fiquem
                        com o mesmo alinhamento. */}
                    <p className="valor-moeda hidden w-32 shrink-0 text-right font-display text-xl font-semibold text-paper sm:block">
                      {formatPrice(moto.preco)}
                    </p>
                  </div>

                  {/* Rodapé do card: preço e ações. No desktop os botões
                      sobem para a linha de cima via sm:absolute, então
                      aqui só eles aparecem. */}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3 sm:hidden">
                    <p className="valor-moeda font-display text-lg font-semibold text-paper">
                      {formatPrice(moto.preco)}
                    </p>
                    <AcoesMoto moto={moto} onPedirExclusao={onPedirExclusao} onEditando={onEditando} />
                  </div>
                </div>

                <div className="absolute top-3 right-3 hidden sm:block">
                  <AcoesMoto moto={moto} onPedirExclusao={onPedirExclusao} onEditando={onEditando} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {motos !== null && visiveis.length > 0 && (
        <p className="text-xs text-steel-600">
          Exibindo {visiveis.length} de {motos.length} {motos.length === 1 ? 'moto' : 'motos'}.{' '}
          <span className="hidden sm:inline">
            Use o filtro de status para incluir as vendidas no resultado.
          </span>
        </p>
      )}
    </div>
  )
}

/**
 * Ver / editar / excluir.
 *
 * Extraído do mapa porque o mesmo conjunto aparece em dois lugares do
 * card (rodapé no celular, canto superior no desktop) e são exatamente
 * as ações que o Criterion de aceitação proíbe remover.
 *
 * No celular os botões são `size-11` (44px) — o alvo de toque mínimo.
 * No desktop voltam a `btn-icone` (36px), que é a densidade certa para
 * uso com mouse.
 */
function AcoesMoto({
  moto,
  onPedirExclusao,
  onEditando,
}: {
  moto: Motorcycle
  onPedirExclusao: (moto: Motorcycle) => void
  onEditando: (v: { id?: string; dados?: MotoParaSalvar }) => void
}) {
  const tamanho = 'size-11 sm:size-9'
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Link
        to={`/moto/${moto.slug}`}
        className={`foco-painel btn btn-icone ${tamanho}`}
        aria-label={`Ver ${moto.modelo} no site`}
      >
        <Eye className="size-4" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => onEditando({ id: moto.id, dados: motoParaFormulario(moto) })}
        className={`foco-painel btn btn-icone ${tamanho}`}
        aria-label={`Editar ${moto.modelo}`}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onPedirExclusao(moto)}
        className={`foco-painel btn btn-icone btn-icone-perigo ${tamanho}`}
        aria-label={`Excluir ${moto.modelo}`}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}