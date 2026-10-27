import { useEffect, useRef, useState } from 'react'
import { useVendas } from '../../hooks/vendasContexto'
import { buscarCustoCompra } from '../../lib/catalog'
import { bikeTitle, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { campoLinha } from './campoLinha'
import type { Motorcycle, Venda, VendaParaSalvar } from '../../types'

/**
 * Diálogo da venda — "Registrar a venda" ou "Editar a venda".
 *
 * Abre quando o dono marca uma moto como vendida e quando ele clica em
 * "Comprou…" na aba Vendidas para corrigir o registro.
 *
 * Pergunta só o que a loja ainda não sabe: quem levou e o telefone. O
 * valor é o preço do anúncio e o custo vem da ficha pela função
 * `custo_da_moto` — a coluna não sai mais no select do catálogo, que é
 * público. Pedir os dois de novo era digitar o mesmo número duas
 * vezes, e nenhuma tela mostrava faturamento para justificar o esforço.
 * Se um dia entrar um relatório de lucro, os campos continuam no banco:
 * a venda já nasce com valor e custo, só não os pergunta aqui.
 *
 * Cancelar nunca desfaz o status da moto: ela já saiu do pátio antes do
 * diálogo abrir, então desistir aqui só deixa a venda sem lançamento.
 */
export function DialogoRegistrarVenda({
  moto,
  venda,
  onFechar,
  onSalvo,
}: {
  moto: Motorcycle | null
  /** Venda já lançada para esta moto: o diálogo vira correção. */
  venda: Venda | null
  onFechar: () => void
  /** Chamado após salvar com sucesso — mostra o toast no Admin. */
  onSalvo: (msg: string) => void
}) {
  const { salvarVenda } = useVendas()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const campoNomeRef = useRef<HTMLInputElement>(null)

  const [comprador, setComprador] = useState('')
  const [telefone, setTelefone] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Moto nova no diálogo: campos reprovinos + abre o modal natively.
  const idAberto = moto?.id ?? null
  const idVenda = venda?.id ?? null
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (moto && !dialog.open) {
      setComprador(venda?.comprador ?? '')
      setTelefone(venda?.telefone ?? '')
      setErro(null)
      dialog.showModal()
      campoNomeRef.current?.focus()
    } else if (!moto && dialog.open) {
      dialog.close()
    }
  }, [moto, venda, idAberto, idVenda])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const aoFechar = () => onFechar()
    dialog.addEventListener('close', aoFechar)
    return () => dialog.removeEventListener('close', aoFechar)
  }, [onFechar])

  async function aoConfirmar() {
    if (!moto || ocupado) return
    setErro(null)

    const nome = comprador.trim()
    if (!nome) {
      setErro('Anote o nome de quem comprou — é ele que aparece na aba Vendidas.')
      return
    }

    setOcupado(true)

    // Numa venda nova o custo vem da ficha pela função do painel. Se o
    // banco ainda não tiver a migração 11, registra sem custo em vez de
    // travar o lançamento.
    let custoDaMoto: number | null = venda?.custo ?? null
    if (!venda) {
      try {
        custoDaMoto = await buscarCustoCompra(moto.id)
      } catch {
        custoDaMoto = null
      }
    }

    const dados: VendaParaSalvar = {
      id: venda?.id,
      // Na correção o vínculo original se mantém (pode ser nulo se a
      // moto já voltou pro pátio); na criação, a própria moto.
      motoId: venda ? venda.motoId : moto.id,
      marca: moto.marca,
      modelo: moto.modelo,
      ano: moto.ano,
      // Valor e pagamento não passam por aqui: na correção herdam o
      // que a venda já guardava; numa venda nova saem da ficha da moto.
      valor: venda ? venda.valor : moto.preco,
      formaPagamento: venda ? venda.formaPagamento : 'outra',
      comprador: nome,
      telefone: telefone.trim() || null,
      custo: custoDaMoto,
    }
    const erroSalvar = await salvarVenda(dados)
    setOcupado(false)

    if (erroSalvar) {
      setErro(erroSalvar)
      return
    }
    dialogRef.current?.close()
    onSalvo(
      venda ? 'Dados da venda atualizados.' : `Venda de ${bikeTitle(moto)} registrada para ${nome}.`,
    )
  }

  return (
    <dialog ref={dialogRef} className="dialogo" aria-labelledby="dlg-venda-titulo">
      {moto && (
        <form
          className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault()
            void aoConfirmar()
          }}
        >
          {/* Cabeçalho com a moto: a foto é a mesma da linha da aba
              Vendidas, então o dono confere de qual moto se trata antes
              de digitar qualquer coisa. */}
          <header className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div className="size-12 shrink-0 overflow-hidden bg-painel-2">
              <img
                src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                alt=""
                aria-hidden="true"
                className="size-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = PLACEHOLDER_CARD
                }}
              />
            </div>
            <div className="min-w-0">
              <h2
                id="dlg-venda-titulo"
                className="font-display text-lg leading-tight font-semibold text-paper"
              >
                {venda ? 'Editar a venda' : 'Registrar a venda'}
              </h2>
              <p id="dlg-venda-resumo" className="mt-1 text-sm text-steel-400 sm:truncate">
                {bikeTitle(moto)} {moto.ano} · {formatPrice(venda ? venda.valor : moto.preco)}
              </p>
            </div>
          </header>

          <div className="px-5 py-5 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="venda-comprador" className="field-label">
                  Nome de quem comprou
                </label>
                <input
                  id="venda-comprador"
                  ref={campoNomeRef}
                  type="text"
                  value={comprador}
                  onChange={(e) => setComprador(e.target.value)}
                  className={campoLinha}
                  placeholder="Quem levou a moto"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="venda-telefone" className="field-label">
                  Telefone
                </label>
                <input
                  id="venda-telefone"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className={`${campoLinha} numeros`}
                  placeholder="(31) 9 9999-9999"
                  autoComplete="tel"
                  aria-describedby="venda-telefone-ajuda"
                />
              </div>
            </div>
            {/* O retorno do telefone: sem isso não parece valer preencher. */}
            <p id="venda-telefone-ajuda" className="mt-3 text-xs leading-relaxed text-steel-500">
              O telefone vira link de WhatsApp na aba Vendidas, com a mensagem de agradecimento já
              escrita. Opcional.
            </p>

            {erro && (
              <p
                role="alert"
                className="mt-4 border-l-2 border-marca bg-night-900 px-3 py-2.5 text-sm leading-relaxed text-brand-400"
              >
                {erro}
              </p>
            )}
          </div>

          <footer className="border-t border-line px-5 py-4 sm:px-6">
            {/* Consequência do cancelar em uma linha própria: o texto
                longo no lugar do rótulo do botão esticava a barra e
                não cabia ao lado das duas ações. */}
            <p className="text-xs leading-relaxed text-steel-500">
              {venda
                ? 'Cancelar mantém a venda como está.'
                : 'Cancelar mantém a moto vendida, sem lançar a venda.'}
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                disabled={ocupado}
                className="foco-painel inline-flex h-11 items-center px-3 text-sm font-medium text-steel-400 transition-colors hover:text-paper disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ocupado}
                className="foco-painel inline-flex h-11 items-center bg-marca px-5 text-sm font-semibold text-white transition-colors hover:bg-marca-forte disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ocupado ? 'Salvando…' : venda ? 'Salvar alterações' : 'Registrar venda'}
              </button>
            </div>
          </footer>
        </form>
      )}
    </dialog>
  )
}
