import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import type { Motorcycle } from '../../types'
import type { Lead } from '../../lib/leads'
import {
  conversaoLeads,
  leadsPorSemana,
  tempoMedioVenda,
  vendasPorCategoria,
} from '../../lib/painel'
import { EstadoVazio } from '../ui/EstadoVazio'
import { EsqueletoSecao } from '../ui/Esqueleto'

/**
 * Relatórios: o que os números do painel contam quando organizados.
 *
 * O gráfico de leads é SVG desenhado na mão — sem biblioteca de chart,
 * sem dependência nova. A altura das barras é proporcional ao máximo da
 * série, então mesmo uma semana fraca fica legível.
 */
export function RelatoriosTab({
  leads,
  motos,
  carregando,
}: {
  leads: Lead[] | null
  motos: Motorcycle[] | null
  carregando: boolean
}) {
  const semanas = useMemo(() => leadsPorSemana(leads ?? [], 8), [leads])
  const tempoMedio = useMemo(() => tempoMedioVenda(motos ?? []), [motos])
  const categorias = useMemo(() => vendasPorCategoria(motos ?? []), [motos])
  const conversao = useMemo(() => conversaoLeads(leads ?? []), [leads])

  const maxSemanal = Math.max(1, ...semanas.map((s) => s.leads))
  const maxCategoria = Math.max(1, ...categorias.map((c) => c.vendas))
  const totalSemanas = semanas.reduce((s, p) => s + p.leads, 0)

  if (carregando) {
    return (
      <div className="space-y-5">
        <EsqueletoSecao linhas={5} />
      </div>
    )
  }

  const semDados = (leads ?? []).length === 0 && (motos ?? []).length === 0

  if (semDados) {
    return (
      <div className="space-y-5">
        <header className="hidden sm:block">
          <h2 className="font-display text-2xl font-semibold tracking-wide text-paper uppercase">
            Relatórios
          </h2>
        </header>
        <div className="card">
          <EstadoVazio
            icone={<TrendingUp className="size-5" aria-hidden="true" />}
            titulo="Sem dados para relatar"
            descricao="Assim que chegarem os primeiros contatos e vendas, os números aparecem aqui."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* `h2` e não `h1`: o `h1` da página é o título fixo do painel (ver
          Admin.tsx), e repetir um segundo `h1` aqui quebraria a ordem de
          títulos para leitor de tela. No celular o cabeçalho fixo já mostra
          "Relatórios", então repetir o texto aqui só gastaria altura. */}
      <header className="hidden sm:block">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-paper uppercase">
          Relatórios
        </h2>
        <p className="mt-1 text-sm text-steel-500">
          Movimento das últimas semanas e histórico de vendas.
        </p>
      </header>

      {/* Leads por semana — SVG puro, sem lib de chart.
          Rótulos alternados no celular: oito colunas de "dd/mm" em ~250px
          não cabem (cada rótulo tem ~28px e a coluna ficaria com ~24px), e
          números espremidos fazem o dono ler a semana errada. Mostrar uma
          a cada duas mantém a escala legível sem deslocar o rótulo da barra
          que ele descreve — o valor da semana continua em cima da barra. */}
      <section className="card" aria-labelledby="rel-semanas">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-white/10 px-4 py-4 sm:px-5">
          <h3
            id="rel-semanas"
            className="font-display text-base font-semibold tracking-wide text-paper uppercase"
          >
            Leads por semana
          </h3>
          <span className="text-xs text-steel-500">
            {totalSemanas} nas últimas 8 semanas
          </span>
        </div>
        <div className="px-3 pt-6 pb-3 sm:px-5">
          <div
            className="flex h-36 items-end gap-1.5 sm:gap-2"
            role="img"
            aria-label={`Leads por semana: ${semanas.map((s) => `${s.rotulo} com ${s.leads}`).join(', ')}`}
          >
            {semanas.map((p) => (
              <div key={p.iso} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-steel-400 tabular-nums">
                  {p.leads > 0 ? p.leads : ''}
                </span>
                <div
                  className={`w-full max-w-10 rounded-t ${p.leads > 0 ? 'bg-brand-500/80' : 'bg-white/5'}`}
                  style={{ height: `${Math.max(4, (p.leads / maxSemanal) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 border-t border-white/10 pt-2 sm:gap-2">
            {semanas.map((p, i) => (
              <span
                key={p.iso}
                className={`min-w-0 flex-1 text-center text-[10px] whitespace-nowrap text-steel-600 tabular-nums ${
                  i % 2 === 1 ? 'hidden sm:block' : ''
                }`}
              >
                {p.rotulo}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tempo médio de venda */}
        <section className="card p-4 sm:p-5" aria-labelledby="rel-tempo">
          <h3
            id="rel-tempo"
            className="text-[11px] font-medium tracking-[0.14em] text-steel-400 uppercase"
          >
            Tempo médio até vender
          </h3>
          <p className="mt-3 font-display text-3xl font-semibold text-paper tabular-nums sm:text-4xl">
            {tempoMedio === null ? '—' : `${tempoMedio} dias`}
          </p>
          <p className="mt-2 text-xs text-steel-500">
            {tempoMedio === null
              ? 'Disponível após as primeiras vendas com data de cadastro.'
              : 'Do cadastro no estoque à marcação de venda.'}
          </p>
        </section>

        {/* Conversão de clientes */}
        <section className="card p-4 sm:p-5" aria-labelledby="rel-conversao">
          <h3
            id="rel-conversao"
            className="text-[11px] font-medium tracking-[0.14em] text-steel-400 uppercase"
          >
            Conversão de clientes
          </h3>
          <p className="mt-3 font-display text-3xl font-semibold text-paper tabular-nums sm:text-4xl">
            {conversao === null ? '—' : `${conversao}%`}
          </p>
          <p className="mt-2 text-xs text-steel-500">
            {conversao === null
              ? 'Percentual de clientes marcados como "Fechou negócio".'
              : 'Clientes que fecharam negócio sobre o total de contatos.'}
          </p>
        </section>

        {/* Vendas por categoria */}
        <section className="card p-4 sm:p-5" aria-labelledby="rel-categorias">
          <h3
            id="rel-categorias"
            className="text-[11px] font-medium tracking-[0.14em] text-steel-400 uppercase"
          >
            O que mais vende
          </h3>
          {categorias.length === 0 ? (
            <p className="mt-3 text-xs text-steel-500">
              Disponível após as primeiras vendas.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {categorias.slice(0, 4).map((c) => (
                <li key={c.categoria}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-steel-300">{c.categoria}</span>
                    <span className="text-steel-500 tabular-nums">{c.vendas}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <span
                      className="block h-full rounded-full bg-white/25"
                      style={{ width: `${(c.vendas / maxCategoria) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
