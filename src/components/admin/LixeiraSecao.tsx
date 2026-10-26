import { RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import type { Motorcycle } from '../../types'
import { bikeTitle, formatKm, formatPrice } from '../../lib/format'
import { tempoRelativo } from '../../lib/painel'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { Esqueleto } from '../ui/Esqueleto'

interface LixeiraSecaoProps {
  /** Só as motos na lixeira; `null` enquanto o estoque carrega. */
  motos: Motorcycle[] | null
  erro: string | null
  onRestaurar: (moto: Motorcycle) => void
  onApagarDeVez: (moto: Motorcycle) => void
  onEsvaziar: () => void
  onIrParaEstoque: () => void
  onRecarregar: () => void
}

/** Diz para onde a moto volta, sem esconder o status que ela tinha. */
function destinoDaRestauracao(moto: Motorcycle): string {
  if (moto.status === 'vendida') return 'Volta para Vendidas'
  if (moto.status === 'indisponivel') return 'Volta como indisponível'
  return 'Volta para o pátio'
}

function fichaTecnica(moto: Motorcycle): string {
  return [
    String(moto.ano),
    moto.categoria,
    moto.quilometragem != null ? formatKm(moto.quilometragem) : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function EsqueletoLixeira() {
  return (
    <ul className="mt-2 divide-y divide-line border-b border-line" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 py-4">
          <span className="sr-only">Carregando moto excluída</span>
          <Esqueleto className="size-16 shrink-0 sm:size-20" />
          <div className="min-w-0 flex-1">
            <Esqueleto className="h-3.5 w-2/5" />
            <Esqueleto className="mt-2 h-3 w-3/5" />
          </div>
          <Esqueleto className="hidden h-3.5 w-24 sm:block" />
          <Esqueleto className="h-10 w-32" />
        </li>
      ))}
    </ul>
  )
}

/**
 * ============================================================
 * LIXEIRA — o caminho de volta da exclusão
 * ============================================================
 * Vive dentro de Configurações, junto dos ajustes da loja. Excluir no
 * Estoque não apaga na hora: a moto perde o lugar na vitrine e no pátio,
 * mas a ficha e as fotos continuam aqui até o dono restaurar ou apagar
 * de vez.
 *
 * A lista responde primeiro "o que eu apaguei e ainda posso recuperar";
 * por isso cada linha mostra o destino da restauração e há quanto tempo
 * a moto está fora. O apagar definitivo fica no fim, com confirmação
 * própria — longe do Restaurar.
 */
export function LixeiraSecao({
  motos,
  erro,
  onRestaurar,
  onApagarDeVez,
  onEsvaziar,
  onIrParaEstoque,
  onRecarregar,
}: LixeiraSecaoProps) {
  const total = motos?.length ?? 0

  return (
    <section aria-label="Lixeira">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-steel-400">
          {motos === null
            ? 'Abrindo a lixeira…'
            : total === 0
              ? 'Nenhuma moto na lixeira.'
              : `${total} ${total === 1 ? 'moto excluída' : 'motos excluídas'}`}
        </p>
        {total > 0 ? <p className="text-xs text-steel-500">Mais recentes primeiro.</p> : null}
      </div>

      {erro ? (
        <div className="mt-5 border border-line bg-painel px-5 py-12 text-center">
          <p className="font-medium text-paper">Não deu para abrir a lixeira agora</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-steel-400">{erro}</p>
          <button
            type="button"
            onClick={onRecarregar}
            className="foco-painel btn btn-secondary mt-5 min-h-10 px-4 text-sm"
          >
            <RotateCw className="size-3.5" aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      ) : motos === null ? (
        <EsqueletoLixeira />
      ) : total === 0 ? (
        <div className="mt-5 border border-line bg-painel px-5 py-14 text-center">
          <Trash2 className="mx-auto size-5 text-steel-500" aria-hidden="true" />
          <p className="mt-3 font-medium text-paper">A lixeira está vazia.</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-steel-400">
            Nada foi excluído ainda. Ao excluir uma moto no Estoque, ela aparece aqui e pode ser
            restaurada a qualquer momento.
          </p>
          <button
            type="button"
            onClick={onIrParaEstoque}
            className="foco-painel btn btn-secondary mt-5 min-h-10 px-4 text-sm"
          >
            Ir para o Estoque
          </button>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-line border-b border-line">
          {motos.map((moto) => (
            <li key={moto.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="size-16 shrink-0 overflow-hidden bg-painel-2 sm:size-20">
                <img
                  src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = PLACEHOLDER_CARD
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate font-display text-lg font-semibold text-paper"
                  title={bikeTitle(moto)}
                >
                  {bikeTitle(moto)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-steel-400">
                  <span>{fichaTecnica(moto)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{destinoDaRestauracao(moto)}</span>
                </p>
                <p className="mt-1 text-xs text-steel-500">
                  {moto.lixeiraEm ? `Excluída ${tempoRelativo(moto.lixeiraEm)}` : 'Na lixeira'}
                </p>
                <p className="numeros mt-1 text-sm font-semibold text-paper sm:hidden">
                  {formatPrice(moto.preco)}
                </p>
              </div>

              <span className="numeros hidden shrink-0 text-base font-semibold text-paper sm:block">
                {formatPrice(moto.preco)}
              </span>

              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => onRestaurar(moto)}
                  className="foco-painel btn btn-secondary h-11 flex-1 px-4 text-sm sm:h-10 sm:flex-none"
                  aria-label={`Restaurar ${bikeTitle(moto)}`}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Restaurar
                </button>
                <button
                  type="button"
                  onClick={() => onApagarDeVez(moto)}
                  className="foco-painel inline-flex size-11 shrink-0 items-center justify-center border border-marca/50 text-marca-texto transition-colors hover:bg-marca hover:text-white sm:size-10"
                  aria-label={`Apagar ${bikeTitle(moto)} de vez`}
                  title="Apagar de vez"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!erro && total > 0 ? (
        <div className="mt-8 border border-line bg-painel p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-paper">Esvaziar a lixeira</p>
              <p className="mt-1 max-w-[54ch] text-sm leading-relaxed text-steel-400">
                Apaga de vez {total === 1 ? 'esta moto e as fotos dela' : `estas ${total} motos e as fotos delas`}.
                Não dá para restaurar depois.
              </p>
            </div>
            <button
              type="button"
              onClick={onEsvaziar}
              className="foco-painel btn btn-danger h-11 shrink-0 px-4 text-sm sm:h-10"
            >
              Esvaziar lixeira
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
