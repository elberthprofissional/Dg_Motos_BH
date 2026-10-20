import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArchiveRestore,
  BadgeCheck,
  ChevronDown,
  Eye,
  Pencil,
  Plus,
  SlidersHorizontal,
  Star,
  Trash2,
} from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../types'
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
 * `disponivel` é o único estado positivo. `indisponivel` é um estado
 * temporário (âmbar, alerta leve): a moto existe mas não pode ser vendida
 * agora. `vendida` é histórica: some do site e continua no painel para o
 * dono consultar ou reativar.
 */
const STATUS: Record<MotorcycleStatus, { rotulo: string; variante: VarianteBadge; margem: string }> = {
  disponivel: { rotulo: 'Disponível', variante: 'ok', margem: 'bg-ok' },
  indisponivel: { rotulo: 'Indisponível', variante: 'atencao', margem: 'bg-warn' },
  vendida: { rotulo: 'Vendida', variante: 'apagado', margem: 'bg-white/20' },
}

const FILTROS: { valor: FiltroEstoque['status']; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todos os status' },
  { valor: 'disponivel', rotulo: 'Disponíveis' },
  { valor: 'indisponivel', rotulo: 'Indisponíveis' },
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
  status,
  onStatus,
}: {
  status: FiltroEstoque['status']
  onStatus: (v: FiltroEstoque['status']) => void
}) {
  const [aberto, setAberto] = useState(false)
  const rotulo = FILTROS.find((f) => f.valor === status)?.rotulo ?? 'Todos os status'
  const filtrando = status !== 'todas'

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="estoque-filtros"
        className={`foco-painel flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm transition-colors ${
          filtrando
            ? 'border-brand-500/40 bg-brand-500/5 text-brand-500'
            : 'border-line-forte bg-night-800 text-steel-300'
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
            value={status}
            onChange={(e) => {
              onStatus(e.target.value as FiltroEstoque['status'])
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
  onAlterarStatus,
  onSalva,
}: {
  motos: Motorcycle[] | null
  busca: string
  onBusca: (valor: string) => void
  editando: { id?: string; dados?: MotoParaSalvar } | null
  onEditando: (v: { id?: string; dados?: MotoParaSalvar } | null) => void
  onPedirExclusao: (moto: Motorcycle) => void
  onAlterarStatus: (moto: Motorcycle, status: MotorcycleStatus) => void
  /** Chamado após o formulário salvar: fecha a edição e recarrega a lista. */
  onSalva: () => void
}) {
  const [status, setStatus] = useState<FiltroEstoque['status']>('todas')

  const visiveis = useMemo(
    () => (motos === null ? [] : filtrarEstoque(motos, { busca, status })),
    [motos, busca, status],
  )
  const filtrando = busca.trim() !== '' || status !== 'todas'

  /* ---------------------------- Formulário ---------------------------- */

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

  /* ----------------------------- Listagem ----------------------------- */

  const contagem =
    motos === null
      ? 'Carregando…'
      : filtrando
        ? `${visiveis.length} de ${motos.length} ${motos.length === 1 ? 'moto' : 'motos'}`
        : `${motos.length} ${motos.length === 1 ? 'moto cadastrada' : 'motos cadastradas'}`

  return (
    <div className="space-y-5">
      {/* Cabeçalho: título e contagem à esquerda, controles à direita.
          Uma barra só, o título aparece aqui — a topbar não repete. */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="painel-h1">Estoque</h2>
          <p className="mt-1.5 text-sm text-steel-500" aria-live="polite">
            {contagem}
          </p>
        </div>

        {/* Controles. No celular empilham (busca, filtro expansível,
            botão); do sm em diante ficam em linha, com o botão fechando
            à direita como ação primária. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CampoBusca
            value={busca}
            onChange={onBusca}
            placeholder="Buscar por marca, modelo ou ano"
            rotulo="Buscar no estoque"
            className="h-10 sm:w-72"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FiltroEstoque['status'])}
            aria-label="Filtrar por status"
            className="select hidden h-10 sm:block sm:w-40"
          >
            {FILTROS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
          {/* No celular o filtro de status vira um painel expansível, para
              não tomar uma linha inteira num campo pouco usado. */}
          <div className="sm:hidden">
            <PainelFiltros status={status} onStatus={setStatus} />
          </div>
          <button
            type="button"
            onClick={() => onEditando({})}
            className="btn btn-primary h-10 max-sm:w-full"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova moto
          </button>
        </div>
      </header>

      {motos === null ? (
        <EsqueletoLinha />
      ) : visiveis.length === 0 ? (
        filtrando ? (
          <EstadoVazio
            compacto
            titulo="Nenhuma moto encontrada"
            descricao="Nenhum cadastro bate com a busca ou o status selecionado. Ajuste os filtros para ver o restante do estoque."
            acao={
              <button
                type="button"
                onClick={() => {
                  onBusca('')
                  setStatus('todas')
                }}
                className="btn btn-secondary btn-sm"
              >
                Limpar filtros
              </button>
            }
          />
        ) : (
          <div className="flex min-h-[45vh] items-center justify-center">
            <EstadoVazio compacto titulo="Nenhuma moto no estoque" />
          </div>
        )
      ) : (
        /* ============================================================
         * Lista de estoque — uma linha por moto
         * ============================================================
         * Desktop: miniatura · identificação · preço · ações, tudo na
         * mesma linha; o preço fica numa coluna larga o bastante para
         * alinhar valores de 4 e 5 dígitos.
         *
         * Celular: a identificação fica em cima e o preço desce para uma
         * faixa própria junto das ações, com alvo de toque de 44px — o de
         * excluir é irreversível e não pode dividir espaço com o preço.
         * ============================================================ */
        <ul className="space-y-2.5 sm:space-y-2">
          {visiveis.map((moto) => {
            const selo = STATUS[moto.status]
            return (
              <li key={moto.id} className="linha-estoque">
                {/* Indicador de status: um fio de cor na borda esquerda,
                    redundante com o badge — nunca só cor. */}
                <span
                  aria-hidden="true"
                  className={`absolute top-3 bottom-3 left-0 w-[3px] rounded-full ${selo.margem}`}
                />

                {/* Miniatura. Não é link: o botão "ver" ao lado é o único
                    alvo para abrir a ficha (dois alvos para a mesma ação
                    confundem a ordem de tabulação). Moldura em grafite
                    (um anel interno escuro) em vez de borda clara — a
                    foto parece encaixada, não emoldurada. */}
                <img
                  src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                  alt=""
                  loading="lazy"
                  className="h-[4.5rem] w-24 shrink-0 rounded-lg object-cover ring-1 ring-inset ring-white/[0.06] sm:h-[5.25rem] sm:w-full"
                />

                <div className="flex min-w-0 flex-1 flex-col sm:flex-none">
                  <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-paper">
                    {moto.marca} {moto.modelo}
                  </h3>

                  {/* Linha técnica: ano primeiro, em tabular-nums, seguido
                      dos dados — todos num só tom secundário. O ano fica
                      aqui (não na linha do nome) porque é detalhe, não
                      título: assim o nome carrega sozinho a hierarquia. */}
                  <p className="mt-1 truncate text-xs text-steel-500">
                    <span className="tabular-nums">{moto.ano}</span>
                    {' · '}
                    {moto.categoria}
                    {moto.cilindrada ? ` · ${moto.cilindrada} cc` : ''} · {formatKm(moto.quilometragem)}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variante={selo.variante} ponto>
                      {selo.rotulo}
                    </Badge>
                    {moto.destaque && (
                      <Badge variante="marca">
                        <Star className="size-3" aria-hidden="true" />
                        Destaque
                      </Badge>
                    )}
                  </div>

                  {/* Celular: preço e ações numa faixa própria, separada
                      por um fio. O preço ganha destaque; as ações ficam
                      à direita. */}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 sm:hidden">
                    <p className="valor-moeda text-lg font-semibold text-paper">
                      {formatPrice(moto.preco)}
                    </p>
                    <AcoesMoto
                      moto={moto}
                      onPedirExclusao={onPedirExclusao}
                      onEditando={onEditando}
                      onAlterarStatus={onAlterarStatus}
                    />
                  </div>
                </div>

                {/* Desktop: preço como coluna alinhada à direita, e as
                    ações numa fileira à parte, separadas por um fio
                    vertical — três zonas, sem virar três caixas. Largura
                    fixa no preço para os valores caírem todos na mesma
                    vertical, com o "R$" alinhado. */}
                <div className="hidden shrink-0 items-center gap-4 sm:flex">
                  <p className="valor-moeda w-28 text-right text-[17px] font-semibold text-paper">
                    {formatPrice(moto.preco)}
                  </p>
                  <span aria-hidden="true" className="h-9 w-px bg-line" />
                  <AcoesMoto
                    moto={moto}
                    onPedirExclusao={onPedirExclusao}
                    onEditando={onEditando}
                    onAlterarStatus={onAlterarStatus}
                  />
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
 * card (rodapé no celular, coluna à direita no desktop) e são exatamente
 * as ações que o Criterio de aceitação proíbe remover.
 *
 * No celular os botões são `size-10` (40px) + `toque-minimo`, chegando
 * aos 44px de alvo. No desktop voltam a `size-9` (36px), que é a
 * densidade certa para uso com mouse. Cada um traz `title` e
 * `aria-label` — o ícone sozinho não basta para o dono saber a função.
 */
function AcoesMoto({
  moto,
  onPedirExclusao,
  onEditando,
  onAlterarStatus,
}: {
  moto: Motorcycle
  onPedirExclusao: (moto: Motorcycle) => void
  onEditando: (v: { id?: string; dados?: MotoParaSalvar }) => void
  onAlterarStatus: (moto: Motorcycle, status: MotorcycleStatus) => void
}) {
  const tamanho = 'size-10 toque-minimo sm:size-9'
  // Vender/reativar alterna entre os dois estados comerciais. Um botão só,
  // com rótulo explícito, para não empilhar ação demais no card.
  const vendida = moto.status === 'vendida'
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => onAlterarStatus(moto, vendida ? 'disponivel' : 'vendida')}
        className={`foco-painel btn btn-icone ${tamanho}`}
        aria-label={
          vendida
            ? `Reativar ${moto.modelo} (disponível para venda)`
            : `Marcar ${moto.modelo} como vendida`
        }
        title={vendida ? 'Reativar' : 'Marcar como vendida'}
      >
        {vendida ? (
          <ArchiveRestore className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <BadgeCheck className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        )}
      </button>
      <Link
        to={`/moto/${moto.slug}`}
        className={`foco-painel btn btn-icone ${tamanho}`}
        aria-label={`Ver ${moto.modelo} no site`}
        title="Ver no site"
      >
        <Eye className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => onEditando({ id: moto.id, dados: motoParaFormulario(moto) })}
        className={`foco-painel btn btn-icone ${tamanho}`}
        aria-label={`Editar ${moto.modelo}`}
        title="Editar"
      >
        <Pencil className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onPedirExclusao(moto)}
        className={`foco-painel btn btn-icone btn-icone-perigo ${tamanho}`}
        aria-label={`Excluir ${moto.modelo}`}
        title="Excluir"
      >
        <Trash2 className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  )
}