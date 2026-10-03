import { useMemo } from 'react'
import { Wallet } from 'lucide-react'
import type { Motorcycle } from '../../types'
import { formatPrice } from '../../lib/format'
import { resumoFinanceiro, ticketMedio } from '../../lib/painel'
import { EstadoVazio } from '../ui/EstadoVazio'
import { EsqueletoSecao } from '../ui/Esqueleto'

/**
 * Financeiro da loja a partir do próprio estoque.
 *
 * Quando o dono marca uma moto como vendida, o painel guarda a data
 * (`vendido_em`) — e se ele informou o preço de compra no cadastro,
 * cada mês ganha custo e lucro além do faturamento. Sem preço de
 * compra, a coluna de lucro simplesmente não aparece: melhor mostrar
 * menos do que mostrar um número enganoso.
 *
 * ============================================================
 * HISTÓRICO: TABELA NO DESKTOP, PILHA NO CELULAR
 * ============================================================
 * Com cinco colunas (mês, vendas, faturamento, custo, lucro) a tabela
 * mínima legível passava de 500px. Em 360px isso significava rolagem
 * horizontal dentro do card — e o dono rolando a tela na horizontal
 * para ler um número monetário desiste.
 *
 * No celular cada mês vira um bloco empilhado: mês no topo, e os
 * valores em pares rótulo/valor. Nenhuma rolagem lateral, nenhum
 * número cortado. A tabela continua intacta a partir de `sm`, onde a
 * comparação coluna a coluna é o que importa.
 */
export function FinanceiroTab({
  motos,
  carregando,
}: {
  motos: Motorcycle[] | null
  carregando: boolean
}) {
  const meses = useMemo(() => resumoFinanceiro(motos ?? []), [motos])
  const ticket = useMemo(() => ticketMedio(motos ?? []), [motos])

  /** Tem pelo menos uma moto vendida com custo informado? */
  const comCusto = useMemo(
    () => (motos ?? []).some((m) => m.disponibilidade === 'vendida' && m.precoCompra != null),
    [motos],
  )

  const totalVendas = meses.reduce((s, m) => s + m.vendas, 0)
  const totalFaturamento = meses.reduce((s, m) => s + m.faturamento, 0)
  const totalLucro = meses.reduce((s, m) => s + m.lucro, 0)

  const rotuloMes = (mes: string) => {
    const [ano, m] = mes.split('-')
    const data = new Date(Number(ano), Number(m) - 1, 1)
    return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  /** Par rótulo/valor usado na pilha do celular. */
  const campo = (rotulo: string, valor: string, destaque?: 'ok' | 'perda') => (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] tracking-[0.12em] text-steel-500 uppercase">{rotulo}</dt>
      <dd
        className={`valor-moeda text-sm font-semibold ${
          destaque === 'ok' ? 'text-ok' : destaque === 'perda' ? 'text-warn' : 'text-steel-200'
        }`}
      >
        {valor}
      </dd>
    </div>
  )

  return (
    <div className="space-y-5">
      <header className="hidden sm:block">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-paper uppercase">
          Financeiro
        </h2>
        <p className="mt-1 text-sm text-steel-500">
          Vendas registradas pelo painel. Informe o preço de compra no cadastro da moto para
          acompanhar o lucro.
        </p>
      </header>

      {carregando ? (
        <EsqueletoSecao linhas={4} />
      ) : meses.length === 0 ? (
        <div className="card">
          <EstadoVazio
            compacto
            icone={<Wallet className="size-4" aria-hidden="true" />}
            titulo="Nenhuma venda registrada"
            descricao="Quando você marca uma moto como vendida (no estoque ou ao fechar um cliente), ela entra aqui por mês de venda."
          />
        </div>
      ) : (
        <>
          {/* Indicadores: coluna única até 380px, três colunas depois.
              `text-2xl` no mobile porque "R$ 1.234.567,00" em text-3xl
              não cabe em meia tela. */}
          <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-3 sm:gap-3">
            <div className="card p-4 sm:p-5">
              <p className="text-[10px] font-medium tracking-[0.14em] text-steel-400 uppercase sm:text-[11px]">
                Vendas
              </p>
              <p className="valor-moeda mt-1.5 font-display text-2xl font-semibold text-paper sm:mt-2 sm:text-3xl">
                {totalVendas}
              </p>
            </div>
            <div className="card p-4 sm:p-5">
              <p className="text-[10px] font-medium tracking-[0.14em] text-steel-400 uppercase sm:text-[11px]">
                Faturamento
              </p>
              <p className="valor-moeda mt-1.5 font-display text-2xl font-semibold text-paper sm:mt-2 sm:text-3xl">
                {formatPrice(totalFaturamento)}
              </p>
            </div>
            <div className="card p-4 sm:p-5">
              <p className="text-[10px] font-medium tracking-[0.14em] text-steel-400 uppercase sm:text-[11px]">
                {comCusto ? 'Lucro' : 'Ticket médio'}
              </p>
              <p
                className={`valor-moeda mt-1.5 font-display text-2xl font-semibold sm:mt-2 sm:text-3xl ${
                  comCusto ? (totalLucro >= 0 ? 'text-ok' : 'text-warn') : 'text-paper'
                }`}
              >
                {comCusto ? formatPrice(totalLucro) : formatPrice(ticket)}
              </p>
            </div>
          </div>

          {/* Pilha — celular */}
          <ul className="space-y-2.5 sm:hidden">
            {[...meses].reverse().map((linha) => (
              <li key={linha.mes} className="card p-4">
                <p className="font-display text-sm font-semibold tracking-wide text-paper uppercase">
                  {rotuloMes(linha.mes)}
                </p>
                <dl className="mt-3 space-y-2">
                  {campo('Vendas', String(linha.vendas))}
                  {campo('Faturamento', formatPrice(linha.faturamento))}
                  {comCusto && campo('Custo', formatPrice(linha.custo))}
                  {comCusto &&
                    campo(
                      'Lucro',
                      formatPrice(linha.lucro),
                      linha.lucro >= 0 ? 'ok' : 'perda',
                    )}
                </dl>
              </li>
            ))}
          </ul>

          {/* Tabela — desktop */}
          <div className="card hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] tracking-[0.12em] text-steel-500 uppercase">
                  <th className="px-5 py-3 font-medium">Mês</th>
                  <th className="px-5 py-3 text-right font-medium">Vendas</th>
                  <th className="px-5 py-3 text-right font-medium">Faturamento</th>
                  {comCusto && (
                    <>
                      <th className="px-5 py-3 text-right font-medium">Custo</th>
                      <th className="px-5 py-3 text-right font-medium">Lucro</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...meses].reverse().map((linha) => (
                  <tr key={linha.mes}>
                    <td className="px-5 py-3 text-steel-200 capitalize">{rotuloMes(linha.mes)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-steel-300">
                      {linha.vendas}
                    </td>
                    <td className="valor-moeda px-5 py-3 text-right text-steel-200">
                      {formatPrice(linha.faturamento)}
                    </td>
                    {comCusto && (
                      <>
                        <td className="valor-moeda px-5 py-3 text-right text-steel-400">
                          {formatPrice(linha.custo)}
                        </td>
                        <td
                          className={`valor-moeda px-5 py-3 text-right font-semibold ${
                            linha.lucro >= 0 ? 'text-ok' : 'text-warn'
                          }`}
                        >
                          {formatPrice(linha.lucro)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}