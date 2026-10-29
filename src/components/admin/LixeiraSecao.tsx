import { useState } from 'react'
import { Loader2, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import type { Motorcycle } from '../../types'
import { bikeTitle, formatKm, formatPrice } from '../../lib/format'
import { DIAS_NA_LIXEIRA, diasAteApagar, tempoRelativo } from '../../lib/painel'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { Esqueleto } from '../ui/Esqueleto'

interface LixeiraSecaoProps {
  /** Só as motos na lixeira; `null` enquanto o estoque carrega. */
  motos: Motorcycle[] | null
  erro: string | null
  onRestaurar: (moto: Motorcycle) => void | Promise<void>
  onApagarDeVez: (moto: Motorcycle) => void
  onEsvaziar: () => void
  onIrParaEstoque: () => void
  onRecarregar: () => void | Promise<void>
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

type TomPrazo = 'urgente' | 'atencao' | 'normal'

/**
 * Prazo restante como texto e como fração de 30 dias. A barra é o
 * mesmo dado que o texto — quem bate o olho na lista vê o que está
 * perto de sumir antes de ler cada linha.
 */
function prazoNaLixeira(
  moto: Motorcycle,
): { texto: string; tom: TomPrazo; fracao: number } | null {
  const dias = diasAteApagar(moto)
  if (dias === null) return null

  const tom: TomPrazo = dias <= 7 ? 'urgente' : dias <= 15 ? 'atencao' : 'normal'
  const texto = dias === 0 ? 'sai hoje' : dias === 1 ? 'sai em 1 dia' : `sai em ${dias} dias`

  return {
    texto,
    tom,
    fracao: Math.max(0, Math.min(1, dias / DIAS_NA_LIXEIRA)),
  }
}

function dataDaBaixa(moto: Motorcycle): string | null {
  if (!moto.lixeiraEm) return null
  const data = new Date(moto.lixeiraEm)
  if (Number.isNaN(data.valueOf())) return null
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(data)
}

function EsqueletoLixeira() {
  return (
    <ul className="lixo-esqueleto" aria-busy="true">
      {Array.from({ length: 3 }, (_, indice) => (
        <li key={indice} className="lixo-esqueleto-item">
          <span className="sr-only">Carregando moto excluída</span>
          <Esqueleto className="lixo-esqueleto-foto" />
          <div className="min-w-0">
            <Esqueleto className="h-4 w-2/5" />
            <Esqueleto className="mt-2 h-3 w-3/5" />
            <Esqueleto className="mt-2 h-3 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * ============================================================
 * LIXEIRA — o livro de baixas
 * ============================================================
 * Excluir no Estoque não apaga na hora: a moto perde o lugar na
 * vitrine e no pátio, mas a ficha e as fotos esperam aqui por 30 dias.
 *
 * A tela responde, nesta ordem: quantas motos estão guardadas; qual é
 * o prazo de cada uma; e como trazer de volta. O esvaziar fica
 * separado no fim, com o peso de área de risco — é a única ação desta
 * tela que não tem volta.
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
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null)
  const [recarregando, setRecarregando] = useState(false)

  const total = motos?.length ?? 0
  const ocupado = restaurandoId !== null

  async function restaurar(moto: Motorcycle) {
    if (ocupado) return
    setRestaurandoId(moto.id)
    try {
      await onRestaurar(moto)
    } catch {
      // O painel já avisa o dono; aqui basta devolver o botão ao estado normal.
    } finally {
      setRestaurandoId(null)
    }
  }

  async function recarregar() {
    if (recarregando) return
    setRecarregando(true)
    try {
      await onRecarregar()
    } catch {
      // A mensagem de erro continua vindo do painel.
    } finally {
      setRecarregando(false)
    }
  }

  return (
    <section className="lixo" aria-label="Lixeira" aria-busy={motos === null}>
      {erro ? (
        <div className="lixo-estado lixo-estado--erro" role="alert">
          <p className="lixo-estado-titulo">Não deu para abrir a lixeira agora</p>
          <p className="lixo-estado-texto">{erro}</p>
          <button
            type="button"
            onClick={() => void recarregar()}
            className="mesa-btn-secundario"
            aria-disabled={recarregando}
          >
            {recarregando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            {recarregando ? 'Tentando…' : 'Tentar novamente'}
          </button>
        </div>
      ) : motos === null ? (
        <EsqueletoLixeira />
      ) : total === 0 ? (
        <div className="lixo-vazio">
          <p className="lixo-vazio-numero" aria-hidden="true">
            0
          </p>
          <div className="lixo-vazio-corpo">
            <p className="lixo-vazio-titulo">Nenhuma moto na lixeira</p>
            <p className="lixo-vazio-texto">
              Nada foi excluído ainda. Ao excluir uma moto no Estoque, ela fica aqui por{' '}
              <strong className="lixo-guarda-prazo">{DIAS_NA_LIXEIRA} dias</strong> e pode voltar
              ao pátio.
            </p>
            <button type="button" onClick={onIrParaEstoque} className="mesa-btn-secundario">
              Ir para o Estoque
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="lixo-guarda">
            {total === 1
              ? '1 moto excluída no Estoque fica guardada por '
              : `${total} motos excluídas no Estoque ficam guardadas por `}
            <strong className="lixo-guarda-prazo">{DIAS_NA_LIXEIRA} dias</strong>
            {total === 1 ? ' antes de ser apagada de vez.' : ' antes de serem apagadas de vez.'}
          </p>

          <div className="lixo-lista-cabecalho" aria-hidden="true">
            <span>Moto</span>
            <span>Preço</span>
            <span>Ações</span>
          </div>

          <ul className="lixo-lista">
            {motos.map((moto) => {
              const prazo = prazoNaLixeira(moto)
              const dataBaixa = dataDaBaixa(moto)
              const restaurando = restaurandoId === moto.id

              return (
                <li key={moto.id} className="lixo-item">
                  <div className="lixo-foto">
                    <img
                      src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      onError={(evento) => {
                        evento.currentTarget.onerror = null
                        evento.currentTarget.src = PLACEHOLDER_CARD
                      }}
                    />
                  </div>

                  <div className="lixo-info">
                    <p className="lixo-nome" title={bikeTitle(moto)}>
                      {bikeTitle(moto)}
                    </p>
                    <p className="lixo-ficha">
                      <span>{fichaTecnica(moto)}</span>
                      <span className="lixo-destino">{destinoDaRestauracao(moto)}</span>
                    </p>
                    <div className="lixo-meta">
                      <span title={dataBaixa ?? undefined}>
                        {moto.lixeiraEm
                          ? `Excluída ${tempoRelativo(moto.lixeiraEm)}`
                          : 'Na lixeira'}
                      </span>
                      {prazo ? (
                        <span className="lixo-prazo" data-tom={prazo.tom}>
                          <span className="lixo-medidor" aria-hidden="true">
                            <span style={{ width: `${prazo.fracao * 100}%` }} />
                          </span>
                          {prazo.texto}
                        </span>
                      ) : null}
                    </div>
                    <p className="lixo-preco-mobile numeros">{formatPrice(moto.preco)}</p>
                  </div>

                  <span className="lixo-preco numeros">{formatPrice(moto.preco)}</span>

                  <div className="lixo-acoes">
                    <button
                      type="button"
                      onClick={() => {
                        if (!ocupado) void restaurar(moto)
                      }}
                      aria-label={`Restaurar ${bikeTitle(moto)}`}
                      aria-disabled={ocupado}
                      aria-busy={restaurando}
                      className="lixo-btn-restaurar"
                    >
                      {restaurando ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          Restaurando…
                        </>
                      ) : (
                        <>
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                          Restaurar
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!ocupado) onApagarDeVez(moto)
                      }}
                      aria-label={`Apagar ${bikeTitle(moto)} de vez`}
                      aria-disabled={ocupado}
                      title="Apagar de vez"
                      className="lixo-btn-apagar"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span className="lixo-btn-apagar-texto">Apagar</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="lixo-risco">
            <div className="min-w-0">
              <p className="lixo-risco-titulo">Esvaziar a lixeira</p>
              <p className="lixo-risco-texto">
                Apaga de vez{' '}
                {total === 1
                  ? 'esta moto e as fotos dela'
                  : `estas ${total} motos e as fotos delas`}{' '}
                — sem esperar os {DIAS_NA_LIXEIRA} dias e sem volta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!ocupado) onEsvaziar()
              }}
              aria-disabled={ocupado}
              className="mesa-btn-perigo"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Esvaziar lixeira
            </button>
          </div>
        </>
      )}
    </section>
  )
}
