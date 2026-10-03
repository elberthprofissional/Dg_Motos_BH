import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, ClipboardCheck, FileCheck, MapPin, MessageSquare } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/useNavigation'
import { buildDefaultMessage } from '../lib/format'
import { buildMapsRouteUrl } from '../lib/maps'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { MapaLoja } from '../components/ui/MapaLoja'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'

/** Foto real do showroom (convertida de img/hero-showroom.jpg via npm run convert-images). */
const HERO_BG = '/hero/showroom.webp'

const ETAPAS = [
  {
    numero: '01',
    titulo: 'Escolha a moto',
    texto: 'Navegue pelo estoque e encontre a cilindrada e o preço que cabem no seu plano.',
  },
  {
    numero: '02',
    titulo: 'Converse com a gente',
    texto: 'Pelo WhatsApp ou na loja: condições reais, sem promessa que a gente não pode cumprir.',
  },
  {
    numero: '03',
    titulo: 'Documentação em dia',
    texto: 'Transferência e procedência conferidas com acompanhamento da loja.',
  },
]

const DIFERENCIAIS = [
  {
    icon: ClipboardCheck,
    titulo: 'Procedência conferida',
    texto: 'Documentação, revisão e histórico verificados antes do anúncio.',
  },
  {
    icon: MessageSquare,
    titulo: 'Negociação direta',
    texto: 'Atendimento pelo WhatsApp ou na loja, sem formulário perdido.',
  },
  {
    icon: FileCheck,
    titulo: 'Financiamento orientado',
    texto: 'A gente conduz a análise de crédito com você, etapa por etapa.',
  },
]

export function Home() {
  const { motos } = useCatalogo()
  const { config } = useSiteConfig()

  usePageMeta(
    'DG Motos — Realizando Sonhos | Motocicletas seminovas em Belo Horizonte',
    'Loja de motocicletas seminovas em Belo Horizonte, MG. Estoque conferido, financiamento, avaliação de troca e negociação direta pelo WhatsApp.',
  )
  useJsonLd(autoDealerSchema(config))

  const destaques = motos
    .filter((m) => m.destaque && m.disponibilidade !== 'vendida')
    .slice(0, 3)

  return (
    <>
      {/* ============ HERO ============ */}
      {/* Só a foto, sem texto nem botão: a vitrine é o primeiro contato
          visual e o bloco de marca (logo + frase + CTAs) fica no meio da
          página. O degradê na base existe para a foto dissolver na seção
          seguinte em vez de terminar em corte reto. */}
      <section className="relative min-h-[92svh] overflow-hidden pt-16 lg:min-h-[86svh]">
        <img
          src={HERO_BG}
          alt="Showroom da DG Motos em Belo Horizonte"
          className="absolute inset-0 size-full object-cover object-center"
          fetchPriority="high"
          decoding="sync"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/25 to-night-950/45"
        />

        {/* Indicador de rolagem: sem texto, o hero precisa mostrar que há
            conteúdo abaixo. Sem animação em loop — a seta só reage ao
            hover, para não competir com a foto. */}
        <a
          href="#conteudo"
          aria-label="Rolar para o conteúdo"
          className="group absolute inset-x-0 bottom-8 z-10 mx-auto flex w-fit flex-col items-center gap-3 text-steel-400 transition-colors hover:text-paper"
        >
          <span className="font-display text-[10px] font-semibold tracking-[0.28em] uppercase">
            Deslize
          </span>
          <ChevronDown
            className="size-4 transition-transform duration-300 group-hover:translate-y-1"
            aria-hidden="true"
          />
        </a>
      </section>

      {/* ============ DESTAQUES DO ESTOQUE ============ */}
      <section className="section border-t border-line">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="No pátio agora"
              title="Destaques do estoque"
              description="Uma parte do que está disponível. O catálogo completo mostra tudo, com filtro por preço, ano e categoria."
            />
            <Link
              to="/estoque"
              className="group/link inline-flex items-center gap-2 pb-1 text-sm font-semibold text-paper"
            >
              <span className="link-editorial">Ver estoque completo</span>
              <ArrowRight
                className="size-4 text-brand-500 transition-transform duration-300 group-hover/link:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="reveal mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {destaques.map((bike) => (
              <BikeCard key={bike.id} bike={bike} priority />
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      {/* Sem caixas: a coluna é separada por um fio vertical e o número
          carrega a hierarquia. No celular os mesmos itens viram uma
          sequência vertical com fio à esquerda. */}
      <section className="section border-t border-line">
        <div className="container-site">
          <SectionHeading
            eyebrow="Como funciona"
            title="Comprar na DG Motos é direto"
            description="Você escolhe, conversa com a gente e resolve a documentação com acompanhamento."
          />

          <ol className="reveal mt-10 grid gap-y-8 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-0 lg:mt-14">
            {ETAPAS.map(({ numero, titulo, texto }) => (
              <li key={numero} className="sm:border-l sm:border-line sm:pl-8">
                <span className="font-display text-4xl leading-none font-semibold text-brand-500">
                  {numero}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-wide uppercase">
                  {titulo}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-steel-400">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ BLOCO DE MARCA ============ */}
      {/* Fica no meio da home, entre duas seções de texto, para o olho
          respirar. Ordem: logo, selo de cidade, frase, apoio e CTAs. A frase
          aparece uma única vez no site inteiro. */}
      <section className="section border-b border-line" aria-label="Nosso compromisso">
        <div className="container-site flex flex-col items-center text-center">
          <img
            src="/logo.webp"
            alt=""
            aria-hidden="true"
            width={88}
            height={88}
            className="size-20 object-contain lg:size-24"
          />

          {/* Selo flanqueado por fios: marca o bloco sem precisar de caixa. */}
          <div aria-hidden="true" className="mt-7 flex w-full max-w-sm items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="size-1.5 shrink-0 rotate-45 bg-brand-500" />
            <span className="h-px flex-1 bg-line" />
          </div>
          <p className="mt-5 font-display text-[11px] font-semibold tracking-[0.22em] text-steel-400 uppercase">
            DG Motos — Belo Horizonte, MG
          </p>

          <h1 className="h-display mt-6 max-w-3xl text-3xl text-paper sm:text-5xl lg:text-6xl">
            Seu próximo destino começa sobre duas rodas.
          </h1>

          <p className="mt-6 max-w-2xl leading-relaxed text-steel-300 text-pretty">
            Motos com qualidade, procedência e atendimento que faz a diferença.
            Seminovas selecionadas e negociação sem complicação.
          </p>

          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button to="/estoque" size="lg">
              Explorar estoque
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <WhatsAppCTA
              message={buildDefaultMessage()}
              label="Falar com a loja"
              variant="outline"
            />
          </div>
        </div>
      </section>

      {/* ============ DIFERENCIAIS ============ */}
      {/* Assimetria proposital: o texto institucional ocupa menos coluna que
          a lista, e a lista resolve o espaço com peso. */}
      <section className="section border-t border-line bg-night-900">
        <div className="container-site grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="reveal">
            <SectionHeading
              eyebrow="O que a gente garante"
              title="Procedência conferida antes do anúncio"
              description="Documentação, revisão e histórico verificados antes da moto entrar no pátio. E a negociação é com quem vende."
            />
          </div>
          <ul className="reveal border-t border-line">
            {DIFERENCIAIS.map(({ icon: Icon, titulo, texto }) => (
              <li
                key={titulo}
                className="flex gap-4 border-b border-line py-6 sm:gap-5 sm:py-7"
              >
                <Icon className="mt-1 size-5 shrink-0 text-brand-500" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-base font-semibold tracking-wide uppercase">
                    {titulo}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-steel-400">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ LOCALIZAÇÃO ============ */}
      {/* O mapa é a ponte entre o site e a visita. Endereço, horário (só se
          existir na config) e rota à esquerda; o mapa à direita no desktop e
          embaixo, com largura total, no celular. */}
      <section className="section border-t border-line">
        <div className="container-site">
          <SectionHeading
            eyebrow="Onde estamos"
            title="Nos encontre na rua"
            description="Conheça nosso espaço, veja as motocicletas de perto e converse pessoalmente com nossa equipe."
          />

          <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
            <div>
              <p className="font-display text-2xl font-semibold tracking-wide uppercase">
                DG Motos
              </p>
              <address className="mt-4 flex items-start gap-3 not-italic text-steel-300">
                <MapPin className="mt-1 size-5 shrink-0 text-brand-500" aria-hidden="true" />
                <span>
                  {config.enderecoRua}
                  <br />
                  {config.enderecoCidadeUf}
                </span>
              </address>

              {config.horarios.length > 0 && (
                <dl className="mt-7 border-t border-line">
                  {config.horarios.map((h) => (
                    <div
                      key={h.dias}
                      className="flex items-baseline justify-between gap-4 border-b border-line py-3 text-sm"
                    >
                      <dt className="text-steel-400">{h.dias}</dt>
                      <dd className="font-medium text-paper">{h.horas}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button
                  href={buildMapsRouteUrl(config.mapsUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto lg:w-full"
                >
                  Como chegar
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                <WhatsAppCTA
                  message={buildDefaultMessage()}
                  variant="outline"
                  className="w-full sm:w-auto lg:w-full"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-line">
              <MapaLoja
                rotulo={`${config.enderecoRua}, ${config.enderecoCidadeUf}`}
                className="h-[300px] sm:h-[360px] lg:h-[420px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="border-t border-line bg-night-900">
        <div className="container-site grid gap-8 py-16 sm:py-20 lg:grid-cols-[1.2fr_auto] lg:items-center">
          <div>
            <h2 className="h-display text-3xl sm:text-4xl">
              Encontro marcado com sua próxima moto.
            </h2>
            <p className="mt-3 max-w-lg text-steel-400">
              Fale com nossa equipe e consulte as condições disponíveis.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <WhatsAppCTA message={buildDefaultMessage()} label="Falar com a DG Motos" />
            <Button to="/troca" variant="outline">
              Avaliar minha moto
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}