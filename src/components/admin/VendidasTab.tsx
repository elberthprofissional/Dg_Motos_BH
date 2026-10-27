import { useMemo } from 'react'
import { ArchiveRestore, MessageCircle, Pencil, Tag } from 'lucide-react'
import type { Motorcycle, Venda } from '../../types'
import { bikeTitle, formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface VendidasTabProps {
  motos: Motorcycle[]
  /** Vendas lançadas; a da moto decide o que a linha mostra. */
  vendas: Venda[]
  onEditar: (moto: Motorcycle) => void
  /** Clique em "Comprou…" — abre o diálogo para lançar ou corrigir. */
  onRegistrarVenda: (moto: Motorcycle) => void
  /** Vendeu por engano: devolve a moto ao pátio sem sair da aba. */
  onReativar: (moto: Motorcycle) => void
  onIrParaEstoque: () => void
}

/** Telefone só com dígito, no formato que o wa.me entende. */
function digitos(telefone: string): string {
  return telefone.replace(/\D/g, '')
}

/**
 * Mensagem que já vai escrita na conversa.
 *
 * O registro da venda guarda só quem comprou e o telefone; o retorno
 * disso é abrir o WhatsApp com o agradecimento pronto — o dono revisa
 * e envia, sem digitar mensagem depois de cada venda.
 */
function mensagemVenda(moto: Motorcycle, comprador: string | null): string {
  const primeiroNome = comprador?.trim().split(/\s+/)[0]
  const saudacao = primeiroNome ? `Oi, ${primeiroNome}!` : 'Oi!'
  return `${saudacao} Obrigado pela compra da ${bikeTitle(moto)} ${moto.ano}. Aqui é a DG Motos — qualquer coisa sobre documentação, revisão ou garantia, me chama por aqui.`
}

/** Link do comprador: Brasil assume 55, e sem DDD não há link. */
function linkConversa(telefone: string, mensagem: string): string | null {
  let numero = digitos(telefone)
  if (numero.length < 10) return null
  if (numero.length === 10 || numero.length === 11) numero = `55${numero}`
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}

/**
 * ============================================================
 * VENDIDAS — o eco do estoque
 * ============================================================
 * Toda moto marcada como vendida aparece aqui, e só isso: sem post,
 * sem "falta publicar". A ficha continua editável — inclusive para
 * reativar a moto — e as fotos da entrega vivem na aba Publicações.
 *
 * Quem comprou é assunto desta aba: a linha "Comprou: …" abre o
 * diálogo para lançar ou corrigir a venda (comprador e telefone), e o
 * telefone vira link de WhatsApp já com a mensagem escrita.
 */
export function VendidasTab({
  motos,
  vendas,
  onEditar,
  onRegistrarVenda,
  onReativar,
  onIrParaEstoque,
}: VendidasTabProps) {
  const vendidas = useMemo(
    () =>
      motos
        .filter((moto) => moto.status === 'vendida')
        .sort((a, b) => (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? '')),
    [motos],
  )

  const vendaDaMoto = useMemo(() => {
    const mapa = new Map<string, Venda>()
    for (const venda of vendas) if (venda.motoId) mapa.set(venda.motoId, venda)
    return mapa
  }, [vendas])

  return (
    <section className="mx-auto max-w-5xl" aria-labelledby="vendidas-titulo">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h2 id="vendidas-titulo" className="font-display text-3xl font-semibold text-paper sm:text-4xl">
            Vendidas
          </h2>
          <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-steel-400">
            Toda moto marcada como vendida no Estoque aparece aqui.
          </p>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-steel-400">
          {vendidas.length === 0
            ? 'Nenhuma moto vendida no momento.'
            : `${vendidas.length} ${vendidas.length === 1 ? 'moto vendida' : 'motos vendidas'}`}
        </p>
        {vendidas.length > 0 ? (
          <p className="text-xs text-steel-500">Mais recentes primeiro.</p>
        ) : null}
      </div>

      {vendidas.length === 0 ? (
        <div className="mt-5 border border-line bg-painel px-5 py-14 text-center">
          <p className="font-medium text-paper">Nada vendido ainda.</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm text-steel-400">
            Marque uma moto como vendida no Estoque e ela aparece aqui, com a ficha pronta para
            editar.
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
        <ul className="mt-3 space-y-3">
          {vendidas.map((moto) => {
            const ficha = [
              String(moto.ano),
              moto.categoria,
              moto.quilometragem != null ? formatKm(moto.quilometragem) : null,
            ].filter(Boolean)

            const venda = vendaDaMoto.get(moto.id)
            const telefone = venda?.telefone?.trim() ?? ''
            const conversa = telefone
              ? linkConversa(telefone, mensagemVenda(moto, venda?.comprador ?? null))
              : null

            return (
              <li key={moto.id} className="border border-line bg-painel-2/30">
                {/* Um retângulo por moto: é ele que separa uma venda da
                    outra. Antes a lista era só um fio, e no celular a
                    foto, o preço e os botões pareciam soltos. */}
                <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                  <div className="size-20 shrink-0 overflow-hidden bg-painel-2 sm:size-24">
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
                      className="truncate font-display text-base leading-tight font-semibold text-paper sm:text-lg"
                      title={bikeTitle(moto)}
                    >
                      {bikeTitle(moto)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-steel-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-marca-texto" />
                        Vendida
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ficha.join(' · ')}</span>
                    </p>
                    <p className="numeros mt-2 text-base font-semibold text-paper">
                      {formatPrice(venda?.valor ?? moto.preco)}
                    </p>
                    {venda ? (
                      <p className="numeros mt-0.5 text-[11px] text-steel-500">
                        Registrada em {new Date(venda.vendidaEm).toLocaleDateString('pt-BR')}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Ações na base do card, dentro do mesmo retângulo:
                    é a bancada do registro da venda. Quem comprou abre o
                    diálogo; o telefone vira link do WhatsApp ao lado —
                    nunca <a> dentro de <button>. */}
                <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2.5">
                  {venda?.comprador ? (
                    <button
                      type="button"
                      onClick={() => onRegistrarVenda(moto)}
                      className="foco-painel group inline-flex min-h-10 min-w-0 flex-1 basis-40 items-center gap-1.5 border border-line px-2.5 text-left text-xs text-steel-300 transition-colors hover:border-brand-400/60 hover:text-paper"
                    >
                      <Tag className="size-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                      <span className="truncate">
                        Comprou:{' '}
                        <span className="font-semibold text-paper group-hover:text-brand-300">
                          {venda.comprador}
                        </span>
                      </span>
                      <Pencil className="size-3 shrink-0 text-steel-500" aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRegistrarVenda(moto)}
                      className="foco-painel inline-flex min-h-10 min-w-0 flex-1 basis-40 items-center gap-1.5 border border-dashed border-line-forte px-2.5 text-xs font-medium text-steel-300 transition-colors hover:border-brand-400/60 hover:text-paper"
                    >
                      <Tag className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Registrar quem comprou</span>
                    </button>
                  )}

                  {telefone ? (
                    conversa ? (
                      <a
                        href={conversa}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Conversar com ${venda?.comprador ?? 'o comprador'} no WhatsApp`}
                        className="foco-painel inline-flex min-h-10 items-center gap-1.5 px-1.5 text-xs text-steel-300 transition-colors hover:text-brand-300"
                      >
                        <MessageCircle className="size-3.5" aria-hidden="true" />
                        {telefone}
                      </a>
                    ) : (
                      <span className="inline-flex min-h-10 items-center gap-1.5 px-1.5 text-xs text-steel-300">
                        <MessageCircle className="size-3.5" aria-hidden="true" />
                        {telefone}
                      </span>
                    )
                  ) : null}

                  {/* Vendeu por engano? A saída fica aqui, na linha da
                      própria moto: volta ao estoque e a venda anterior
                      fica no histórico, desvinculada. */}
                  <button
                    type="button"
                    onClick={() => onReativar(moto)}
                    className="foco-painel ml-auto inline-flex min-h-10 shrink-0 items-center gap-2 border border-line px-3.5 text-sm font-medium text-steel-300 transition-colors hover:border-brand-400/60 hover:text-brand-300"
                    aria-label={`Devolver ${bikeTitle(moto)} ao estoque`}
                    title="Devolver ao estoque"
                  >
                    <ArchiveRestore className="size-3.5" aria-hidden="true" />
                    Devolver ao estoque
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditar(moto)}
                    className="foco-painel inline-flex min-h-10 shrink-0 items-center gap-2 border border-line-forte px-3.5 text-sm font-medium text-steel-300 transition-colors hover:border-claro/30 hover:text-paper"
                    aria-label={`Editar ${bikeTitle(moto)}`}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Editar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
