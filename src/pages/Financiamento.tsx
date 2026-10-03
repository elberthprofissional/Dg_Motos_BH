import { Calculator, FileText, HandCoins, ShieldCheck } from 'lucide-react'
import { usePageMeta } from '../hooks/useNavigation'
import { FinanciamentoForm } from '../components/forms/FinanciamentoForm'
import { SimuladorParcelas } from '../components/forms/SimuladorParcelas'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { buildDefaultMessage } from '../lib/format'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useSiteConfig } from '../hooks/siteConfigContexto'

/**
 * Página de financiamento.
 *
 * O conteúdo textual (título, subtítulo, etapas e transparência) vem da
 * config da loja (`config_loja.financiamento`), editável pelo dono em
 * /admin -> Configurações. Campo vazio/ausente cai no texto padrão
 * (src/lib/financiamento.ts) — a página nunca fica sem texto.
 *
 * Ordem pensada para o visitante: simulador o quanto antes (o motivo
 * real de alguém abrir esta página), depois o processo e a transparência.
 */
const ICONES_ETAPA = [FileText, Calculator, HandCoins, ShieldCheck] as const

export function Financiamento() {
  const { config } = useSiteConfig()
  const fin = config.financiamento

  usePageMeta(
    'Financiamento | DG Motos',
    'Financie sua motocicleta com orientação da DG Motos: análise de crédito conduzida, condições reais e atendimento humano em Belo Horizonte.',
  )

  return (
    <div className="pt-16">
      <section className="border-b border-white/10 bg-night-900">
        <div className="container-site py-12 sm:py-16">
          <p className="eyebrow">Financiamento</p>
          <h1 className="h-display mt-3 max-w-2xl text-4xl sm:text-5xl">{fin.titulo}</h1>
          <p className="mt-4 max-w-xl text-steel-400">{fin.subtitulo}</p>
        </div>
      </section>

      {/* Simulador — primeiro de tudo: é por isso que o visitante chegou aqui */}
      <section className="section">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <SectionHeading
              eyebrow="Sem compromisso"
              title="Quanto ficaria por mês?"
              description="Escolha a moto, a entrada e o número de parcelas para ter uma estimativa na hora. Depois é só mandar a simulação pro WhatsApp e a gente busca a condição real."
            />
          </div>
          <SimuladorParcelas />
        </div>
      </section>

      {/* Formulário — quem já decidiu simular e quer seguir */}
      <section className="section border-t border-white/10">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <SectionHeading
              eyebrow="Formulário"
              title="Comece pelo interesse"
              description="Preencha os dados e a gente abre a conversa pronta no WhatsApp. Se preferir, fale direto com um atendente."
            />
            <div className="mt-6">
              <WhatsAppCTA message={buildDefaultMessage()} label="Atendimento humano agora" />
            </div>
          </div>
          <div className="surface rounded-lg p-6 sm:p-8">
            <FinanciamentoForm />
          </div>
        </div>
      </section>

      {/* Etapas */}
      <section className="section border-t border-white/10">
        <div className="container-site">
          <SectionHeading eyebrow="Como funciona" title={fin.etapasTitulo} />
          <ol className="reveal mt-10 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {fin.etapas.map(({ titulo, texto }, i) => {
              const Icon = ICONES_ETAPA[i] ?? FileText
              return (
                <li key={titulo} className="bg-night-950 p-6">
                  <span className="font-display text-sm text-brand-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon className="mt-4 size-5" aria-hidden="true" />
                  <h3 className="mt-3 font-display text-lg font-semibold uppercase">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel-400">{texto}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Análise de crédito — transparência */}
      <section className="border-t border-white/10 bg-night-900">
        <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Transparência" title={fin.transparenciaTitulo} />
          <ul className="space-y-4 text-steel-300">
            {fin.transparenciaItens.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
