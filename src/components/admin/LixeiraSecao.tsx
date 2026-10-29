import { useState } from 'react'
import { ImageOff, Loader2, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import type { Motorcycle } from '../../types'
import type { FotoNaLixeira } from '../../data/entregas'
import { bikeTitle, formatKm, formatPrice } from '../../lib/format'
import {
  DIAS_NA_LIXEIRA,
  diasAteApagar,
  diasAteApagarDesde,
  tempoRelativo,
} from '../../lib/painel'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { Esqueleto } from '../ui/Esqueleto'

interface LixeiraSecaoProps {
  /** Só as motos na lixeira; `null` enquanto o estoque carrega. */
  motos: Motorcycle[] | null
  /** Fotos apagadas do mural; `null` enquanto a lista carrega. */
  fotos: FotoNaLixeira[] | null
  erro: string | null
  erroFotos: string | null
  onRestaurar: (moto: Motorcycle) => void | Promise<void>
  onApagarDeVez: (moto: Motorcycle) => void
  onRestaurarFoto: (foto: FotoNaLixeira) => void | Promise<void>
  onApagarFoto: (foto: FotoNaLixeira) => void
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
    moto.quilometragem != null ? formatKm(moto.quilometragem) : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

type TomPrazo = 'urgente' | 'atencao' | 'normal'

interface Prazo {
  texto: string
  tom: TomPrazo
  fracao: number
}

/**
 * Prazo restante como texto e como fração de 30 dias. A barra é o
 * mesmo dado que o texto — quem bate o olho na lista vê o que está
 * perto de sumir antes de ler cada linha.
 */
function prazoRestante(dias: number | null): Prazo | null {
  if (dias === null) return null

  const tom: TomPrazo = dias <= 7 ? 'urgente' : dias <= 15 ? 'atencao' : 'normal'
  const texto = dias === 0 ? 'sai hoje' : dias === 1 ? 'sai em 1 dia' : `sai em ${dias} dias`

  return {
    texto,
    tom,
    fracao: Math.max(0, Math.min(1, dias / DIAS_NA_LIXEIRA)),
  }
}

function dataDaBaixa(iso: string | null | undefined): string | null {
  if (!iso) return null
  const data = new Date(iso)
  if (Number.isNaN(data.valueOf())) return null
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(data)
}

/** "2 motos excluídas no Estoque e 1 foto apagada do mural". */
function resumoDaGuarda(motos: number, fotos: number): string {
  const partes: string[] = []
  if (motos > 0) {
    partes.push(motos === 1 ? '1 moto excluída no Estoque' : `${motos} motos excluídas no Estoque`)
  }
  if (fotos > 0) {
    partes.push(fotos === 1 ? '1 foto apagada do mural' : `${fotos} fotos apagadas do mural`)
  }
  return partes.join(' e ')
}

function EsqueletoLixeira() {
  return (
    <ul className="lixo-esqueleto" aria-busy="true">
      {Array.from({ length: 3 }, (_, indice) => (
        <li key={indice} className="lixo-esqueleto-item">
          <span className="sr-only">Carregando item excluído</span>
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

function ErroFotos({
  erro,
  recarregando,
  onTentar,
}: {
  erro: string
  recarregando: boolean
  onTentar: () => void
}) {
  return (
    <div className="lixo-estado lixo-estado--erro" role="alert">
      <p className="lixo-estado-titulo">Não deu para abrir as fotos da lixeira</p>
      <p className="lixo-estado-texto">{erro}</p>
      <button
        type="button"
        onClick={onTentar}
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
  )
}

/**
 * ============================================================
 * LIXEIRA — o livro de baixas
 * ============================================================
 * Excluir no Estoque não apaga na hora: a moto perde o lugar na
 * vitrine e no pátio, mas a ficha e as fotos esperam aqui por 30 dias.
 * A mesma regra vale para as fotos apagadas do mural: o arquivo fica
 * guardado até o dono restaurar ou apagar de vez.
 *
 * A tela responde, nesta ordem: o que está guardado; qual é o prazo de
 * cada item; e como trazer de volta. O esvaziar fica separado no fim,
 * com o peso de área de risco — é a única ação desta tela que não tem
 * volta.
 */
export function LixeiraSecao({
  motos,
  fotos,
  erro,
  erroFotos,
  onRestaurar,
  onApagarDeVez,
  onRestaurarFoto,
  onApagarFoto,
  onEsvaziar,
  onIrParaEstoque,
  onRecarregar,
}: LixeiraSecaoProps) {
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null)
  const [restaurandoFotoId, setRestaurandoFotoId] = useState<string | null>(null)
  const [recarregando, setRecarregando] = useState(false)

  const totalMotos = motos?.length ?? 0
  const totalFotos = fotos?.length ?? 0
  const total = totalMotos + totalFotos
  const carregando = motos === null || fotos === null
  const ocupado = restaurandoId !== null || restaurandoFotoId !== null

  const alvosDoEsvaziar: string[] = []
  if (totalMotos > 0) {
    alvosDoEsvaziar.push(
      totalMotos === 1 ? 'a moto e as fotos dela' : `as ${totalMotos} motos e as fotos delas`,
    )
  }
  if (totalFotos > 0) {
    alvosDoEsvaziar.push(
      totalFotos === 1 ? 'a foto do mural' : `as ${totalFotos} fotos do mural`,
    )
  }

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

  async function restaurarFoto(foto: FotoNaLixeira) {
    if (ocupado) return
    setRestaurandoFotoId(foto.id)
    try {
      await onRestaurarFoto(foto)
    } catch {
      // O painel já avisa o dono; aqui basta devolver o botão ao estado normal.
    } finally {
      setRestaurandoFotoId(null)
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
    <section className="lixo" aria-label="Lixeira" aria-busy={carregando}>
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
      ) : carregando ? (
        <EsqueletoLixeira />
      ) : total === 0 ? (
        <>
          <div className="lixo-vazio">
            <p className="lixo-vazio-numero" aria-hidden="true">
              0
            </p>
            <div className="lixo-vazio-corpo">
              <p className="lixo-vazio-titulo">Nada na lixeira</p>
              <p className="lixo-vazio-texto">
                Nada foi excluído ainda. Ao excluir uma moto no Estoque ou uma foto do mural, ela
                fica aqui por{' '}
                <strong className="lixo-guarda-prazo">{DIAS_NA_LIXEIRA} dias</strong> e pode
                voltar.
              </p>
              <button type="button" onClick={onIrParaEstoque} className="mesa-btn-secundario">
                Ir para o Estoque
              </button>
            </div>
          </div>
          {erroFotos ? (
            <ErroFotos
              erro={erroFotos}
              recarregando={recarregando}
              onTentar={() => void recarregar()}
            />
          ) : null}
        </>
      ) : (
        <>
          <p className="lixo-guarda">
            {resumoDaGuarda(totalMotos, totalFotos)}{' '}
            {total === 1 ? 'fica guardada' : 'ficam guardadas'} por{' '}
            <strong className="lixo-guarda-prazo">{DIAS_NA_LIXEIRA} dias</strong> antes de{' '}
            {total === 1 ? 'ser apagada' : 'serem apagadas'} de vez.
          </p>

          {totalMotos > 0 ? (
            <>
              <div className="lixo-lista-cabecalho" aria-hidden="true">
                <span>Moto</span>
                <span>Preço</span>
                <span>Ações</span>
              </div>

              <ul className="lixo-lista">
                {motos.map((moto) => {
                  const prazo = prazoRestante(diasAteApagar(moto))
                  const dataBaixa = dataDaBaixa(moto.lixeiraEm)
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
            </>
          ) : null}

          {totalFotos > 0 || erroFotos ? (
            <section className="lixo-fotos" aria-label="Fotos de entregas na lixeira">
              <div className="lixo-fotos-cabecalho">
                <h3 className="lixo-fotos-titulo">Fotos de entregas</h3>
                {totalFotos > 0 ? (
                  <span className="lixo-fotos-contagem numeros">{totalFotos}</span>
                ) : null}
              </div>

              {erroFotos ? (
                <ErroFotos
                  erro={erroFotos}
                  recarregando={recarregando}
                  onTentar={() => void recarregar()}
                />
              ) : (
                <ul className="lixo-fotos-lista">
                  {(fotos ?? []).map((foto) => {
                    const prazo = prazoRestante(diasAteApagarDesde(foto.apagadaEm))
                    const dataBaixa = dataDaBaixa(foto.apagadaEm)
                    const restaurando = restaurandoFotoId === foto.id

                    return (
                      <li key={foto.id} className="lixo-foto-item">
                        <div className="lixo-foto-miniatura">
                          {foto.url ? (
                            <img src={foto.url} alt="" loading="lazy" decoding="async" />
                          ) : (
                            <span className="lixo-foto-vazia" aria-hidden="true">
                              <ImageOff className="size-4" />
                            </span>
                          )}
                        </div>

                        <div className="lixo-foto-corpo">
                          <p className="lixo-foto-nome">Foto do mural</p>
                          <div className="lixo-meta">
                            <span title={dataBaixa ?? undefined}>
                              Apagada {tempoRelativo(foto.apagadaEm)}
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
                        </div>

                        <div className="lixo-acoes">
                          <button
                            type="button"
                            onClick={() => {
                              if (!ocupado) void restaurarFoto(foto)
                            }}
                            aria-label={`Restaurar a foto apagada ${tempoRelativo(foto.apagadaEm)}`}
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
                              if (!ocupado) onApagarFoto(foto)
                            }}
                            aria-label={`Apagar a foto apagada ${tempoRelativo(foto.apagadaEm)} de vez`}
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
              )}
            </section>
          ) : null}

          <div className="lixo-risco">
            <div className="min-w-0">
              <p className="lixo-risco-titulo">Esvaziar a lixeira</p>
              <p className="lixo-risco-texto">
                Apaga de vez {alvosDoEsvaziar.join(', ')} — sem esperar os {DIAS_NA_LIXEIRA} dias e
                sem volta.
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
