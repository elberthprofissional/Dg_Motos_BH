import { useMemo } from 'react'
import {
  ArchiveRestore,
  MessageCircle,
  Pencil,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from 'lucide-react'
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

interface Registro {
  moto: Motorcycle
  venda: Venda | null
}

const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** Telefone só com dígito, no formato que o wa.me entende. */
function digitos(telefone: string): string {
  return telefone.replace(/\D/g, '')
}

/** Telefone legível: (31) 99999-9999. Sem DDD reconhecível, devolve cru. */
function formatarTelefone(telefone: string): string {
  let numero = digitos(telefone)
  if (numero.length === 12 || numero.length === 13) numero = numero.slice(2)
  if (numero.length === 11) {
    return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`
  }
  if (numero.length === 10) {
    return `(${numero.slice(0, 2)}) ${numero.slice(2, 6)}-${numero.slice(6)}`
  }
  return telefone
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

function dataDaVenda(iso: string | undefined): string | null {
  if (!iso) return null
  const data = new Date(iso)
  if (Number.isNaN(data.valueOf())) return null
  return FORMATO_DATA.format(data)
}

/** Mesma grade no cabeçalho e nas linhas do desktop. */
const GRADE =
  'lg:grid-cols-[minmax(0,1.65fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_5.25rem]'

/**
 * ============================================================
 * VENDIDAS — o livro de saídas
 * ============================================================
 * Toda moto marcada como vendida aparece aqui. A tela é uma ficha
 * de balcão: cada linha responde quando saiu, por quanto, para quem
 * e qual foi a margem — sem abrir a moto.
 *
 * O cadastro de quem comprou não é placeholder: é o mesmo diálogo da
 * venda, que exige nome e telefone. Quando a venda não foi lançada, a
 * própria linha oferece o registro. Devolver ao estoque e editar ficam
 * discretos na última coluna.
 */
export function VendidasTab({
  motos,
  vendas,
  onEditar,
  onRegistrarVenda,
  onReativar,
  onIrParaEstoque,
}: VendidasTabProps) {
  const vendaDaMoto = useMemo(() => {
    // A lista do provedor vem da mais nova para a mais antiga: a
    // primeira venda vinculada é a que vale para a moto.
    const mapa = new Map<string, Venda>()
    for (const venda of vendas) {
      if (venda.motoId && !mapa.has(venda.motoId)) mapa.set(venda.motoId, venda)
    }
    return mapa
  }, [vendas])

  const registros = useMemo<Registro[]>(
    () =>
      motos
        .filter((moto) => moto.status === 'vendida')
        .map((moto) => ({ moto, venda: vendaDaMoto.get(moto.id) ?? null }))
        .sort((a, b) => {
          const dataA = a.venda?.vendidaEm ?? a.moto.atualizadoEm ?? ''
          const dataB = b.venda?.vendidaEm ?? b.moto.atualizadoEm ?? ''
          return dataB.localeCompare(dataA)
        }),
    [motos, vendaDaMoto],
  )

  const resumo = useMemo(() => {
    const registradas = registros.flatMap(({ venda }) => (venda ? [venda] : []))
    const comCusto = registradas.filter((venda) => venda.custo != null)
    return {
      registradas: registradas.length,
      faturamento: registradas.reduce((total, venda) => total + venda.valor, 0),
      comCusto: comCusto.length,
      lucro: comCusto.reduce((total, venda) => total + (venda.valor - (venda.custo ?? 0)), 0),
    }
  }, [registros])

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="vendidas-titulo">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
        <div>
          <h2
            id="vendidas-titulo"
            className="font-display text-[22px] leading-none font-bold tracking-[-0.02em] text-paper sm:text-[26px]"
          >
            Vendidas
          </h2>
          <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-steel-400">
            Cada moto que saiu do pátio, com data, comprador e resultado da venda.
          </p>
        </div>
        {registros.length > 1 ? (
          <p className="text-[11px] text-steel-500">Mais recentes primeiro.</p>
        ) : null}
      </header>

      {registros.length === 0 ? (
        <div className="mt-4 border border-line border-t-2 border-t-marca bg-painel px-5 py-12 text-center">
          <p className="font-display text-lg font-semibold text-paper">O livro está vazio.</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-steel-400">
            Marque uma moto como vendida no Estoque e ela aparece aqui, com ficha para editar e
            venda para registrar.
          </p>
          <button
            type="button"
            onClick={onIrParaEstoque}
            className="btn btn-secondary mt-5 min-h-11 px-4 text-sm"
          >
            Ir para o Estoque
          </button>
        </div>
      ) : (
        <>
          <dl
            className="mt-4 grid grid-cols-2 border border-line bg-painel-2/20 sm:grid-cols-3"
            aria-label="Resumo das vendas"
          >
            <div className="border-r border-b border-line px-3 py-2.5 sm:border-b-0 sm:px-4 sm:py-3">
              <dt className="text-[10px] font-bold tracking-[0.12em] text-steel-500 uppercase">
                No livro
              </dt>
              <dd className="numeros mt-1 font-display text-base leading-none font-bold text-paper sm:text-xl">
                {registros.length}
              </dd>
              <dd className="mt-1 text-[10px] leading-tight text-steel-500">
                {registros.length === 1 ? 'moto vendida' : 'motos vendidas'}
              </dd>
            </div>

            <div className="border-b border-line px-3 py-2.5 sm:border-r sm:border-b-0 sm:px-4 sm:py-3">
              <dt className="text-[10px] font-bold tracking-[0.12em] text-steel-500 uppercase">
                Faturamento
              </dt>
              <dd className="numeros mt-1 truncate font-display text-base leading-none font-bold text-paper sm:text-xl">
                {resumo.registradas > 0 ? formatPrice(resumo.faturamento) : '—'}
              </dd>
              <dd className="mt-1 truncate text-[10px] leading-tight text-steel-500">
                {resumo.registradas === 0
                  ? 'nenhuma venda lançada'
                  : `${resumo.registradas} ${resumo.registradas === 1 ? 'venda lançada' : 'vendas lançadas'}`}
              </dd>
            </div>

            <div className="col-span-2 px-3 py-2.5 sm:col-span-1 sm:px-4 sm:py-3">
              <dt className="text-[10px] font-bold tracking-[0.12em] text-steel-500 uppercase">
                Lucro
              </dt>
              <dd
                className={`numeros mt-1 truncate font-display text-base leading-none font-bold sm:text-xl ${
                  resumo.comCusto === 0
                    ? 'text-steel-500'
                    : resumo.lucro < 0
                      ? 'text-marca-texto'
                      : 'text-ok'
                }`}
              >
                {resumo.comCusto > 0 ? formatPrice(resumo.lucro) : '—'}
              </dd>
              <dd className="mt-1 truncate text-[10px] leading-tight text-steel-500">
                {resumo.comCusto === 0
                  ? 'sem custo lançado'
                  : `em ${resumo.comCusto} ${resumo.comCusto === 1 ? 'venda com custo' : 'vendas com custo'}`}
              </dd>
            </div>
          </dl>

          <div
            aria-hidden="true"
            className={`mt-5 hidden items-end gap-5 border-b border-line-forte px-3 pb-2 text-[10px] font-bold tracking-[0.12em] text-steel-500 uppercase lg:grid ${GRADE}`}
          >
            <span>Moto</span>
            <span>Venda</span>
            <span>Comprador</span>
            <span className="text-right">Ações</span>
          </div>

          <ul className="mt-3 flex flex-col gap-2 lg:mt-0 lg:gap-0">
            {registros.map(({ moto, venda }) => {
              const ficha = [
                String(moto.ano),
                moto.categoria,
                moto.quilometragem != null ? formatKm(moto.quilometragem) : null,
              ].filter(Boolean)

              const comprador = venda?.comprador?.trim() || null
              const telefone = venda?.telefone?.trim() ?? ''
              const conversa = telefone
                ? linkConversa(telefone, mensagemVenda(moto, comprador))
                : null
              const data = dataDaVenda(venda?.vendidaEm)
              const valor = venda?.valor ?? moto.preco
              const lucro =
                venda && venda.custo != null ? venda.valor - venda.custo : null

              return (
                <li
                  key={moto.id}
                  className={`relative flex flex-col border border-line bg-painel-2/20 transition-colors lg:grid lg:items-center lg:gap-5 lg:border-x-0 lg:border-t-0 lg:border-b-line lg:bg-transparent lg:px-3 lg:py-3.5 lg:hover:bg-painel-2/40 lg:last:border-b-0 ${GRADE}`}
                >
                  {/* Veículo: foto, nome, ficha e o carimbo de vendida. */}
                  <div className="flex min-w-0 gap-3 pr-12 p-3 lg:items-center lg:gap-3.5 lg:p-0 lg:pr-0">
                    <div className="aspect-[4/3] w-20 shrink-0 overflow-hidden border border-line bg-painel-2 lg:w-24">
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
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p
                          className="min-w-0 truncate font-display text-[15px] leading-tight font-semibold text-paper lg:text-base"
                          title={bikeTitle(moto)}
                        >
                          {bikeTitle(moto)}
                        </p>
                        <span className="shrink-0 bg-marca px-1.5 py-0.5 text-[9px] leading-none font-bold tracking-[0.14em] text-white uppercase">
                          Vendida
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-steel-400">
                        {ficha.join(' · ')}
                      </p>
                    </div>
                  </div>

                  {/* Valor e comprador: duas colunas no celular, duas
                      colunas da grade no desktop. */}
                  <div className="grid grid-cols-2 gap-x-4 border-t border-line px-3 py-2.5 lg:contents">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold tracking-[0.12em] text-steel-500 uppercase lg:sr-only">
                        Venda
                      </p>
                      <p
                        className={`numeros mt-0.5 truncate font-display text-lg leading-tight font-bold lg:mt-0 ${
                          venda ? 'text-marca-texto' : 'text-steel-300'
                        }`}
                        title={formatPrice(valor)}
                      >
                        {formatPrice(valor)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-steel-500">
                        {venda
                          ? data
                            ? `Vendida em ${data}`
                            : 'Vendida'
                          : 'Sem venda lançada'}
                      </p>
                      {lucro != null ? (
                        <p
                          className={`mt-1 inline-flex max-w-full items-center gap-1 text-[11px] font-semibold ${
                            lucro < 0 ? 'text-marca-texto' : 'text-ok'
                          }`}
                        >
                          {lucro < 0 ? (
                            <TrendingDown className="size-3 shrink-0" aria-hidden="true" />
                          ) : (
                            <TrendingUp className="size-3 shrink-0" aria-hidden="true" />
                          )}
                          <span className="truncate">
                            {lucro < 0 ? 'Prejuízo ' : 'Lucro '}
                            {formatPrice(Math.abs(lucro))}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-bold tracking-[0.12em] text-steel-500 uppercase lg:sr-only">
                        Comprador
                      </p>
                      {comprador ? (
                        <button
                          type="button"
                          onClick={() => onRegistrarVenda(moto)}
                          aria-label={`Corrigir comprador de ${bikeTitle(moto)}`}
                          title="Corrigir comprador"
                          className="group/comprador mt-0.5 flex min-h-9 max-w-full items-center gap-1 text-left lg:mt-0"
                        >
                          <span className="truncate text-[13px] font-medium text-paper transition-colors group-hover/comprador:text-brand-300">
                            {comprador}
                          </span>
                          <Pencil
                            className="size-3 shrink-0 text-steel-500 transition-colors group-hover/comprador:text-brand-400"
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <div>
                          <p className="mt-0.5 text-[13px] text-steel-500 lg:mt-0">
                            Não informado
                          </p>
                          <button
                            type="button"
                            onClick={() => onRegistrarVenda(moto)}
                            className="mt-0.5 inline-flex min-h-8 items-center gap-1 text-[11px] font-semibold text-marca-texto transition-colors hover:text-paper"
                          >
                            <UserPlus className="size-3 shrink-0" aria-hidden="true" />
                            Registrar comprador
                          </button>
                        </div>
                      )}

                      {telefone ? (
                        conversa ? (
                          <a
                            href={conversa}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Conversar com ${comprador ?? 'o comprador'} no WhatsApp`}
                            className="mt-0.5 inline-flex max-w-full items-center gap-1 text-[11px] text-steel-400 transition-colors hover:text-brand-300"
                          >
                            <MessageCircle className="size-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{formatarTelefone(telefone)}</span>
                          </a>
                        ) : (
                          <span className="mt-0.5 inline-flex max-w-full items-center gap-1 text-[11px] text-steel-500">
                            <MessageCircle className="size-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{formatarTelefone(telefone)}</span>
                          </span>
                        )
                      ) : null}
                    </div>
                  </div>

                  {/* Ações discretas: devolver ao estoque e editar. No
                      celular moram no canto do cartão; no desktop, na
                      última coluna da grade. */}
                  <div className="absolute top-1 right-1 flex flex-col lg:static lg:flex-row lg:items-center lg:justify-end lg:gap-1">
                    <button
                      type="button"
                      onClick={() => onReativar(moto)}
                      aria-label={`Devolver ${bikeTitle(moto)} ao estoque`}
                      title="Devolver ao estoque"
                      className="grid size-10 place-items-center border border-transparent text-steel-400 transition-colors hover:border-line-forte hover:bg-painel-2 hover:text-brand-300"
                    >
                      <ArchiveRestore className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditar(moto)}
                      aria-label={`Editar ${bikeTitle(moto)}`}
                      title="Editar"
                      className="grid size-10 place-items-center border border-transparent text-steel-400 transition-colors hover:border-line-forte hover:bg-painel-2 hover:text-paper"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
