import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, FileCheck, KeyRound, MessageSquare } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/useNavigation'
import { buildDefaultMessage } from '../lib/format'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'

/** Foto real do showroom (convertida de img/hero-showroom.jpg via npm run convert-images). */
const HERO_BG = '/hero/showroom.webp'

export function Home() {
  const { motos } = useCatalogo()
  const { config } = useSiteConfig()

  usePageMeta(
    'DG Motos — Realizando Sonhos | Motocicletas seminovas em Belo Horizonte',
    'Motos com qualidade, procedência e atendimento que faz a diferença em Belo Horizonte, MG. Seminovas selecionadas, financiamento, avaliação de troca e negociação direta pelo WhatsApp.',
  )
  useJsonLd(autoDealerSchema(config))

  const destaques = motos
    .filter((m) => m.destaque && m.disponibilidade !== 'vendida')
    .slice(0, 3)

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative flex min-h-[88svh] items-end overflow-hidden pt-16">
        <img
          src={HERO_BG}
          alt="Showroom da DG Motos em Belo Horizonte"
          className="absolute inset-0 size-full object-cover"
          fetchPriority="high"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/55 to-night-950/25"
        />

        <div className="container-site relative pb-20 sm:pb-24">
          <p className="eyebrow">DG Motos — Belo Horizonte, MG</p>
          <h1 className="h-display mt-4 max-w-3xl text-4xl sm:text-5xl lg:text-6xl">
            Seu próximo destino começa sobre duas rodas.
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-steel-300 sm:text-lg">
            Motos com qualidade, procedência e atendimento que faz a diferença.
            Seminovas selecionadas e negociação sem complicação.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button to="/estoque" size="lg">
              Explorar estoque
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <WhatsAppCTA
              message={buildDefaultMessage()}
              label="Negociar pelo WhatsApp"
              variant="outline"
            />
          </div>
        </div>
        <p className="absolute right-5 bottom-4 hidden font-display text-[10px] tracking-[0.3em] text-steel-600 uppercase sm:block">
          The Riding Experience
        </p>
      </section>

      {/* ============ DESTAQUES DO ESTOQUE ============ */}
      <section className="section border-t border-white/10">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Do pátio direto para você"
              title="Destaques do estoque"
              description="Uma seleção do que está disponível agora. O catálogo completo mostra tudo, com filtros por preço, ano e categoria."
            />
            <Link
              to="/estoque"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-paper transition-colors hover:text-brand-500"
            >
              Ver estoque completo
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          <div className="reveal mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((bike) => (
              <BikeCard key={bike.id} bike={bike} priority />
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section className="section border-t border-white/10 bg-night-900">
        <div className="container-site">
          <SectionHeading
            eyebrow="Processo"
            title="Comprar na DG Motos é direto"
            description="Sem enrolação: você escolhe, conversa com a gente e resolve a documentação com acompanhamento."
          />

          <ol className="reveal mt-12 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              {
                icon: KeyRound,
                titulo: 'Escolha a moto',
                texto:
                  'Navegue pelo estoque e encontre a cilindrada e o preço que cabem no seu plano.',
              },
              {
                icon: MessageSquare,
                titulo: 'Converse com a gente',
                texto:
                  'Pelo WhatsApp ou na loja: condições reais, sem promessa que a gente não pode cumprir.',
              },
              {
                icon: FileCheck,
                titulo: 'Documentação em dia',
                texto:
                  'Transferência e procedência conferidas com acompanhamento da loja.',
              },
            ].map(({ icon: Icon, titulo, texto }, i) => (
              <li key={titulo} className="bg-night-900 p-6 sm:p-8">
                <span className="font-display text-sm text-brand-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon className="mt-4 size-5 text-paper" aria-hidden="true" />
                <h3 className="mt-3 font-display text-lg font-semibold uppercase">{titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-400">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ DIFERENCIAIS ============ */}
      <section className="section border-t border-white/10">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="reveal">
            <SectionHeading
              eyebrow="Por que a DG Motos"
              title="Procedência e atendimento de gente"
              description="Cada motocicleta passa por conferência antes de entrar no pátio. Você negocia com quem responde, não com robô."
            />
          </div>
          <ul className="reveal divide-y divide-white/10 border-y border-white/10">
            {[
              {
                icon: ClipboardCheck,
                titulo: 'Procedência conferida',
                texto: 'Documentação, revisão e histórico verificados antes do anúncio.',
              },
              {
                icon: MessageSquare,
                titulo: 'Negociação humana',
                texto: 'Atendimento direto pelo WhatsApp ou na loja, sem formulário perdido.',
              },
              {
                icon: FileCheck,
                titulo: 'Financiamento orientado',
                texto: 'A gente conduz a análise de crédito com você, etapa por etapa.',
              },
            ].map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="flex gap-4 py-5">
                <Icon className="mt-0.5 size-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-steel-400">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="border-t border-white/10 bg-night-900">
        <div className="container-site flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="h-display text-3xl sm:text-4xl">
              Achei sua próxima moto. <span className="text-brand-500">E agora?</span>
            </h2>
            <p className="mt-2 text-steel-400">
              Chame no WhatsApp ou passe na loja: {config.enderecoRua} — {config.enderecoCidadeUf}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <WhatsAppCTA message={buildDefaultMessage()} />
            <Button to="/troca" variant="outline">
              Avaliar minha moto
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
