import { useEffect, useRef, useState } from 'react'
import { useVendas } from '../../hooks/vendasContexto'
import { formatPrice } from '../../lib/format'
import {
  ROTULO_PAGAMENTO,
  type FormaPagamento,
  type Motorcycle,
  type Venda,
  type VendaParaSalvar,
} from '../../types'

const FORMAS = Object.keys(ROTULO_PAGAMENTO) as FormaPagamento[]

/**
 * Diálogo da venda — "Registrar a venda" ou "Editar a venda".
 *
 * Abre de dois jeitos: quando o dono marca uma moto como vendida (em
 * vez de trocar o status silenciosamente, o painel pergunta quem
 * comprou, como pagou e por quanto) e quando ele clica em "Comprou…"
 * na aba Vendidas para corrigir um registro já lançado.
 *
 * Cancelar nunca desfaz o status da moto: a moto já saiu do pátio antes
 * do diálogo abrir, então desistir aqui só deixa a venda sem lançamento.
 *
 * Valor já vem preenchido com o preço de anúncio (a venda costuma sair
 * pelo anunciado) e o custo com o que estiver cadastado na moto — os
 * dois seguem editáveis aqui dentro. Na correção, tudo vem da venda.
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
  const campoValorRef = useRef<HTMLInputElement>(null)

  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [comprador, setComprador] = useState('')
  const [telefone, setTelefone] = useState('')
  const [custo, setCusto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Moto nova no diálogo: campos reprovinos + abre o modal natively.
  const idAberto = moto?.id ?? null
  const idVenda = venda?.id ?? null
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (moto && !dialog.open) {
      setValor(venda ? String(venda.valor) : String(moto.preco))
      setForma(venda?.formaPagamento ?? 'pix')
      setComprador(venda?.comprador ?? '')
      setTelefone(venda?.telefone ?? '')
      setCusto(
        venda
          ? venda.custo != null
            ? String(venda.custo)
            : ''
          : moto.custoCompra
            ? String(moto.custoCompra)
            : '',
      )
      setErro(null)
      dialog.showModal()
      campoValorRef.current?.select()
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

    // Valor vem do input text para permitir vírgula decimal; tiramos
    // os pontos de milhar antes de converter. Números <= 0 não fazem
    // sentido num registro de venda.
    const parseReal = (texto: string) =>
      Number(texto.replace(/\./g, '').replace(',', '.'))
    const valorNum = parseReal(valor)
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      setErro('Informe o valor da venda (ex.: 15900 ou 15.900,00).')
      return
    }
    const custoTexto = custo.trim()
    const custoNum = custoTexto ? parseReal(custoTexto) : null
    if (custoNum != null && (!Number.isFinite(custoNum) || custoNum < 0)) {
      setErro('O custo de compra, se informado, tem que ser um valor válido.')
      return
    }

    setOcupado(true)
    const dados: VendaParaSalvar = {
      id: venda?.id,
      // Na correção o vínculo original se mantém (pode ser nulo se a
      // moto já voltou pro pátio); na criação, a própria moto.
      motoId: venda ? venda.motoId : moto.id,
      marca: moto.marca,
      modelo: moto.modelo,
      ano: moto.ano,
      valor: valorNum,
      formaPagamento: forma,
      comprador: comprador.trim() || null,
      telefone: telefone.trim() || null,
      custo: custoNum,
    }
    const erroSalvar = await salvarVenda(dados)
    setOcupado(false)

    if (erroSalvar) {
      setErro(erroSalvar)
      return
    }
    dialogRef.current?.close()
    onSalvo(
      venda
        ? 'Dados da venda atualizados.'
        : `Venda de ${moto.marca} ${moto.modelo} registrada — R$ ${valorNum.toFixed(2).replace('.', ',')}`,
    )
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialogo"
      aria-labelledby="dlg-venda-titulo"
    >
      {moto && (
        <form
          className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-6 sm:p-7"
          onSubmit={(e) => {
            e.preventDefault()
            void aoConfirmar()
          }}
        >
          <h2 id="dlg-venda-titulo" className="text-base font-semibold text-white">
            {venda ? 'Editar a venda' : 'Registrar a venda'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            {moto.marca} {motomodelo(moto)} · anunciada por {formatPrice(moto.preco)}.{' '}
            {venda
              ? 'Corrija quem comprou, o telefone, o pagamento ou o valor.'
              : 'Os dados gravados aqui aparecem na aba Vendidas e no histórico de vendas.'}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="admin-campo">
              <span className="admin-campo-rotulo">Valor da venda (R$)</span>
              <input
                ref={campoValorRef}
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="admin-campo-input"
                placeholder="15900"
                autoFocus
              />
            </label>

            <label className="admin-campo">
              <span className="admin-campo-rotulo">Forma de pagamento</span>
              <select
                value={forma}
                onChange={(e) => setForma(e.target.value as FormaPagamento)}
                className="admin-campo-input"
              >
                {FORMAS.map((f) => (
                  <option key={f} value={f}>
                    {ROTULO_PAGAMENTO[f]}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-campo">
              <span className="admin-campo-rotulo">Nome do comprador</span>
              <input
                type="text"
                value={comprador}
                onChange={(e) => setComprador(e.target.value)}
                className="admin-campo-input"
                placeholder="Quem levou a moto"
              />
            </label>

            <label className="admin-campo">
              <span className="admin-campo-rotulo">Telefone de contato</span>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="admin-campo-input"
                placeholder="(31) 9 9999-9999"
              />
            </label>

            <label className="admin-campo admin-campo-largo">
              <span className="admin-campo-rotulo">
                Custo de compra da moto ( quanto a loja pagou) — opcional
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                className="admin-campo-input"
                placeholder="Se não souber, deixe vazio: a venda entra no faturamento mas não no lucro."
              />
            </label>
          </div>

          {erro && (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {erro}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={ocupado}
              className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium text-neutral-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {venda ? 'Cancelar' : 'Cancelar — só marcar vendida sem registrar'}
            </button>
            <button
              type="submit"
              disabled={ocupado}
              className="inline-flex h-10 items-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
            >
              {ocupado ? 'Salvando…' : venda ? 'Salvar alterações' : 'Registrar venda'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}

/** "Titan 150" — pega modelo + ano p/ o subtítulo. */
function motomodelo(m: Motorcycle): string {
  return `${m.modelo} ${m.ano}`
}
