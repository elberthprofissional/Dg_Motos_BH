import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { useCatalogo } from '../../hooks/useCatalogo'
import { formatPrice } from '../../lib/format'
import { JUROS_MENSAL_ESTIMADO, PARCELAS, simularFinanciamento } from '../../lib/finance'
import type { Parcela } from '../../lib/finance'
import { WhatsAppCTA } from '../motorcycles/WhatsAppCTA'

export function SimuladorParcelas() {
  const { motos } = useCatalogo()
  const disponiveis = motos.filter((m) => m.disponibilidade === 'disponivel')

  const [motoSlug, setMotoSlug] = useState(disponiveis[0]?.slug ?? '')
  const [entradaPct, setEntradaPct] = useState(20)
  const [parcelas, setParcelas] = useState<Parcela>(48)

  const moto = disponiveis.find((m) => m.slug === motoSlug) ?? disponiveis[0]
  if (!moto) return null

  const sim = simularFinanciamento(moto.preco, entradaPct, parcelas)

  const msg = `Olá! Simulei no site da DG Motos: ${moto.marca} ${moto.modelo} ${moto.ano} (${formatPrice(moto.preco)}), entrada de ${formatPrice(sim.entrada)} em ${parcelas}x de ~${formatPrice(sim.parcela)}. Gostaria de condições reais de financiamento.`

  return (
    <div className="surface rounded-lg p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Calculator className="size-5 text-brand-500" aria-hidden="true" />
        <h2 className="font-display text-xl font-semibold uppercase">Simule suas parcelas</h2>
      </div>
      <p className="mt-2 text-sm text-steel-400">
        Estimativa ilustrativa para você se planejar. A condição real sai da
        análise de crédito das instituições parceiras.
      </p>

      {/* Moto */}
      <div className="mt-6">
        <label htmlFor="sim-moto" className="field-label">Motocicleta</label>
        <select
          id="sim-moto"
          value={motoSlug}
          onChange={(e) => setMotoSlug(e.target.value)}
          className="input"
        >
          {disponiveis.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.marca} {m.modelo} {m.ano} — {formatPrice(m.preco)}
            </option>
          ))}
        </select>
      </div>

      {/* Entrada */}
      <div className="mt-6">
        <label htmlFor="sim-entrada" className="field-label">
          Entrada: <span className="text-paper">{entradaPct}% ({formatPrice(sim.entrada)})</span>
        </label>
        <input
          id="sim-entrada"
          type="range"
          min={0}
          max={80}
          step={5}
          value={entradaPct}
          onChange={(e) => setEntradaPct(Number(e.target.value))}
          className="w-full accent-[#E21B23]"
        />
        <div className="mt-1 flex justify-between text-[11px] text-steel-500">
          <span>0%</span>
          <span>80%</span>
        </div>
      </div>

      {/* Parcelas */}
      <div className="mt-6" role="group" aria-label="Número de parcelas">
        <span className="field-label">Parcelas</span>
        <div className="flex flex-wrap gap-2">
          {PARCELAS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setParcelas(n)}
              aria-pressed={parcelas === n}
              className={`rounded border px-4 py-2 font-display text-sm font-semibold transition-colors ${
                parcelas === n
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-white/15 text-steel-300 hover:border-white/30 hover:text-paper'
              }`}
            >
              {n}x
            </button>
          ))}
        </div>
      </div>

      {/* Resultado */}
      <div
        className="mt-8 rounded-lg border border-white/10 bg-night-950 p-5"
        aria-live="polite"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-steel-400 uppercase">
          Parcela estimada
        </p>
        <p className="mt-1 font-display text-4xl font-semibold text-paper">
          {formatPrice(sim.parcela)}
          <span className="text-base font-medium text-steel-400"> /mês</span>
        </p>
        <dl className="mt-4 space-y-1.5 text-sm text-steel-400">
          <div className="flex justify-between gap-4">
            <dt>Entrada</dt>
            <dd className="text-paper">{formatPrice(sim.entrada)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Valor financiado</dt>
            <dd className="text-paper">{formatPrice(sim.financiado)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Total estimado ({parcelas}x)</dt>
            <dd className="text-paper">{formatPrice(sim.total)}</dd>
          </div>
        </dl>
      </div>

      <WhatsAppCTA message={msg} label="Quero condição real dessa simulação" className="w-full" />

      <p className="mt-4 text-[11px] leading-relaxed text-steel-500">
        Simulação meramente ilustrativa, com taxa estimada de{' '}
        {(JUROS_MENSAL_ESTIMADO * 100).toFixed(2).replace('.', ',')}% a.m. Não
        constitui oferta de crédito. Aprovação e condições finais dependem da
        análise da instituição financeira.
      </p>
    </div>
  )
}
