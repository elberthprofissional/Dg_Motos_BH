import { RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import type { Motorcycle } from '../../types'
import { bikeTitle, formatKm, formatPrice } from '../../lib/format'
import { DIAS_NA_LIXEIRA, diasAteApagar, tempoRelativo } from '../../lib/painel'
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
  if (moto.status === 'vendida') return 'volta para Vendidas'
  if (moto.status === 'indisponivel') return 'volta como indisponível'
  return 'volta para o pátio'
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

/** Prazo em palavras: "some hoje", "some em 4 dias". */
function prazoNaLixeira(moto: Motorcycle): { texto: string; urgente: boolean } | null {
  const dias = diasAteApagar(moto)
  if (dias === null) return null
  if (dias === 0) return { texto: 'sai hoje', urgente: true }
  const texto = dias === 1 ? 'sai em 1 dia' : `sai em ${dias} dias`
  return { texto, urgente: dias <= 7 }
}

function EsqueletoLixeira() {
  return (
    <ul className="lixo-lista" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="lixo-item">
          <span className="sr-only">Carregando moto excluída</span>
          <Esqueleto className="lixo-foto" />
          <div className="lixo-info">
            <Esqueleto className="h-3.5 w-2/5" />
            <Esqueleto className="mt-2 h-3 w-3/5" />
          </div>
          <span className="lixo-preco hidden lg:block">
            <Esqueleto className="h-3.5 w-20" />
          </span>
          <span className="lixo-acoes">
            <Esqueleto className="h-10 w-32" />
          </span>
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
 * Cada linha responde três perguntas na ordem em que elas aparecem:
 * qual moto é, para onde ela volta e quanto tempo ainda resta — o prazo
 * é de 30 dias, contado pelo `lixeira_em`. A limpeza automática roda ao
 * abrir o painel (ver Admin), então o prazo aqui nunca é só decoração.
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
      <div className="lixo-topo">
        <p className="lixo-contagem">
          {motos === null
            ? 'Abrindo a lixeira…'
            : total === 0
              ? 'Nenhuma moto na lixeira.'
              : `${total} ${total === 1 ? 'moto excluída' : 'motos excluídas'}`}
        </p>
        <p className="lixo-prazo-nota">
          Apaga sozinho depois de {DIAS_NA_LIXEIRA} dias.
        </p>
      </div>

      {erro ? (
        <div className="lixo-estado">
          <p className="lixo-estado-titulo">Não deu para abrir a lixeira agora</p>
          <p className="lixo-estado-texto">{erro}</p>
          <button type="button" onClick={onRecarregar} className="btn btn-secondary min-h-10 px-4 text-sm">
            <RotateCw className="size-3.5" aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      ) : motos === null ? (
        <EsqueletoLixeira />
      ) : total === 0 ? (
        <div className="lixo-estado">
          <Trash2 className="size-5 text-steel-500" aria-hidden="true" />
          <p className="lixo-estado-titulo">A lixeira está vazia.</p>
          <p className="lixo-estado-texto">
            Nada foi excluído ainda. Ao excluir uma moto no Estoque, ela aparece aqui e pode ser
            restaurada durante {DIAS_NA_LIXEIRA} dias.
          </p>
          <button type="button" onClick={onIrParaEstoque} className="btn btn-secondary min-h-10 px-4 text-sm">
            Ir para o Estoque
          </button>
        </div>
      ) : (
        <ul className="lixo-lista">
          {motos.map((moto) => {
            const prazo = prazoNaLixeira(moto)
            return (
              <li key={moto.id} className="lixo-item">
                <div className="lixo-foto">
                  <img
                    src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = PLACEHOLDER_CARD
                    }}
                  />
                </div>

                <div className="lixo-info">
                  <p className="lixo-nome" title={bikeTitle(moto)}>
                    {bikeTitle(moto)}
                  </p>
                  <p className="lixo-ficha">
                    {fichaTecnica(moto)} · {destinoDaRestauracao(moto)}
                  </p>
                  <p className="lixo-datas">
                    <span>
                      {moto.lixeiraEm ? `Excluída ${tempoRelativo(moto.lixeiraEm)}` : 'Na lixeira'}
                    </span>
                    {prazo ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className={prazo.urgente ? 'lixo-urgente' : undefined}>
                          {prazo.urgente ? <strong>{prazo.texto}</strong> : prazo.texto}
                        </span>
                      </>
                    ) : null}
                  </p>
                  <p className="numeros lixo-preco-mobile">{formatPrice(moto.preco)}</p>
                </div>

                <span className="numeros lixo-preco">{formatPrice(moto.preco)}</span>

                <div className="lixo-acoes">
                  <button
                    type="button"
                    onClick={() => onRestaurar(moto)}
                    className="btn btn-secondary lixo-restaurar min-h-10 px-4 text-sm"
                    aria-label={`Restaurar ${bikeTitle(moto)}`}
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Restaurar
                  </button>
                  <button
                    type="button"
                    onClick={() => onApagarDeVez(moto)}
                    className="lixo-apagar"
                    aria-label={`Apagar ${bikeTitle(moto)} de vez`}
                    title="Apagar de vez"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {!erro && total > 0 ? (
        <div className="lixo-esvaziar">
          <div>
            <p className="lixo-esvaziar-titulo">Esvaziar a lixeira</p>
            <p className="lixo-esvaziar-texto">
              Apaga de vez{' '}
              {total === 1 ? 'esta moto e as fotos dela' : `estas ${total} motos e as fotos delas`} —
              sem esperar os {DIAS_NA_LIXEIRA} dias e sem volta.
            </p>
          </div>
          <button type="button" onClick={onEsvaziar} className="btn btn-danger min-h-10 shrink-0 px-4 text-sm">
            Esvaziar lixeira
          </button>
        </div>
      ) : null}
    </section>
  )
}
