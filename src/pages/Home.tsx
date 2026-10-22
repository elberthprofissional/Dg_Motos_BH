import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  FileCheck2,
  Handshake,
  RefreshCw,
  Wrench,
} from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { usePageMeta } from '../hooks/usePageMeta'
import { useJsonLd } from '../hooks/useJsonLd'
import { autoDealerSchema } from '../lib/schema'
import { buildMapsRouteUrl } from '../lib/maps'
import { SectionHeading } from '../components/ui/SectionHeading'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { Revelar } from '../components/ui/Revelar'
import { useWhatsappLink } from '../hooks/useWhatsappLink'
import { buildDefaultMessage } from '../lib/format'

const HERO_BG = '/hero/showroom-2026-07-hd.webp'

/**
 * Página inicial — a bancada da loja.
 *
 * O preto é o chão e a folha de papel é o que pousa sobre ele: a
 * vitrine de motos é uma folha inteira de papel, a vistoria é o
 * registro em texto e o fechamento volta ao preto, onde a logo
 * (traço branco) funciona.
 *
 * O texto é o mesmo que o dono aprovou: nada de promessa de origem
 * ou garantia que não possa ser comprovada (ver
 * docs/RELATORIO-REDESIGN.md).
 */
export function Home() {
  const { motos } = useCatalogo()
  const { config } = useSiteConfig()
  const waLink = useWhatsappLink(buildDefaultMessage())

  usePageMeta(
    'DG Motos — Seminovas inspecionadas em Belo Horizonte',
    'Loja de motocicletas seminovas em Belo Horizonte, MG. Inspeção mecânica e ciclística, laudo cautelar aprovado e negociação direta pelo WhatsApp.',
  )
  useJsonLd(autoDealerSchema(config))

  const disponiveis = useMemo(
    () => motos.filter((m) => m.status === 'disponivel'),
    [motos],
  )

  // A vitrine mostra o patio inteiro: a moto marcada como destaque
  // primeiro, depois as demais. Sem mais que isso — a página mostra
  // o que existe, e o estoque completo tem a lista.
  const patio = useMemo(() => {
    const comDestaque = disponiveis.filter((m) => m.destaque)
    const semDestaque = disponiveis.filter((m) => !m.destaque)
    return [...comDestaque, ...semDestaque].slice(0, 6)
  }, [disponiveis])

  const marcasNoPatio = useMemo(() => {
    const set = new Set(disponiveis.map((m) => m.marca))
    return Array.from(set).sort()
  }, [disponiveis])

  return (
    <>
      {/* ============================================================
          1. HERO — banner com identidade e CTAs
          ============================================================ */}
      <h1 className="sr-only">DG Motos - Motos seminovas com inspeção mecânica e laudo cautelar</h1>
      <section className="bg-fundo pt-cabecalho">
        <div className="relative overflow-hidden">
          <img
            src={HERO_BG}
            alt="Banner da DG Motos: motocicleta esportiva e a marca Realizando Sonhos"
            className="respira w-full"
            fetchPriority="high"
            decoding="sync"
            width={1920}
            height={814}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-fundo to-transparent"
          />
        </div>
        <div className="container-site flex flex-col items-center pt-6 pb-8 text-center sm:pt-10 sm:pb-12">
          <h2 className="titulo max-w-[20ch] text-texto">Motos seminovas inspecionadas em Belo Horizonte</h2>
          <p className="mt-4 max-w-[44ch] text-base text-texto-2 sm:text-lg">
            Inspeção mecânica e ciclística • Laudo cautelar • Negociação direta
          </p>
          <div className="mt-6 hidden sm:flex flex-wrap items-center justify-center gap-3">
            <Link to="/estoque" className="btn btn-primary h-12 px-7 font-bold">
              Ver estoque
            </Link>
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary h-12 px-7 font-bold"
              >
                Conversar no WhatsApp
              </a>
            ) : (
              <Link to="/contato" className="btn btn-secondary h-12 px-7 font-bold">
                Conversar no WhatsApp
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          2. PATIO — as fichas no pátio
          ============================================================ */}
      <section id="acervo" className="section bg-fundo">
        <div className="container-site">
          <SectionHeading
            title="Motos disponíveis"
            acao={
              <Link to="/estoque" className="link-acao">
                <span>Ver todo o estoque</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            }
          />

          {patio.length > 0 ? (
            <>
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {patio.map((bike, i) => (
                  <Revelar key={bike.id} atraso={i * 60}>
                    <BikeCard bike={bike} priority={i < 3} />
                  </Revelar>
                ))}
              </div>

          {marcasNoPatio.length > 0 ? (
            <div className="mt-12">
              <p className="text-sm uppercase tracking-[0.16em] text-texto-3">Marcas no pátio</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                {marcasNoPatio.map((marca) => (
                  <Link
                    key={marca}
                    to={`/estoque?marca=${encodeURIComponent(marca)}`}
                    className="font-display text-2xl text-texto transition-colors hover:text-marca-texto sm:text-3xl"
                  >
                    {marca}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
            </>
          ) : (
            <div className="mt-12">
              <p className="titulo text-2xl text-texto">Estoque em atualização</p>
              <p className="corpo mt-3 text-texto-2">
                Estamos preparando as próximas unidades. Enquanto isso, fale com a
                equipe para saber o que está chegando.
              </p>
              <Link to="/contato" className="btn btn-primary mt-6 h-11 px-5">
                Falar com a loja
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          3. DIFERENCIAIS — a vistoria em registro
          É a única vez que os diferenciais aparecem: uma linha,
          uma palavra, e nada repetindo o que já foi dito. O
          número ser ordinal (01, 02…) é o registro de vistoria.
          ============================================================ */}
      <section className="section bg-painel">
        <div className="container-site">
          <SectionHeading
            title="Confiança em cada moto"
            description="O que já fazemos hoje: inspeção, documentação e negociação direta."
          />

          <div className="mt-12 border-t border-borda">
            <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-5">
              {[
                {
                  numero: '01',
                  icone: Wrench,
                  titulo: 'Inspeção mecânica e ciclística',
                  texto: 'Cada moto passa pela vistoria antes de ir para o pátio.',
                },
                {
                  numero: '02',
                  icone: FileCheck2,
                  titulo: 'Laudo cautelar',
                  texto: 'Verificação da documentação antes da venda.',
                },
                {
                  numero: '03',
                  icone: RefreshCw,
                  titulo: 'Avaliação de troca',
                  texto: 'Aceitamos sua moto usada como parte do pagamento.',
                },
                {
                  numero: '04',
                  icone: Handshake,
                  titulo: 'Negociação direta',
                  texto: 'Sem intermediários. Atendimento direto na loja.',
                },
              ].map(({ icone: Icone, ...item }) => (
                <article key={item.titulo} className="border-b border-borda py-7 lg:border-b-0">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-9 place-items-center border border-borda text-texto-3">
                      <Icone className="size-4" />
                    </span>
                    <span aria-hidden="true" className="numeros font-display text-sm font-bold text-marca-texto">
                      {item.numero}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-texto">
                    {item.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-texto-2">
                    {item.texto}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. FECHAMENTO — troca, showroom e pedido específico
          ============================================================ */}
      {/* O verso da folha: o que encerra a leitura é o que pede ação —
          trazer a moto usada, encontrar a loja, pedir um modelo.
          Uma seção só, com as três ações em leitura vertical — não
          algo thrown junto. O texto duplicado dos diferenciais saiu:
          repetir não é reforçar, é ruído. */}
      <section className="section bg-fundo">
        <div className="container-site grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <h2 className="titulo text-texto">Sua moto usada entra na troca</h2>
            <p className="corpo mt-6 max-w-[46ch] text-texto-2">
              Aceitamos sua moto usada como parte do pagamento. A avaliação é feita
              na loja, com a documentação orientada.
            </p>
            <Link to="/contato" className="btn btn-primary mt-8 h-12 px-6">
              Falar com a loja
            </Link>

            <div className="mt-14 border-t border-borda pt-10">
              <h2 className="titulo text-texto">Procurando algo específico?</h2>
              <p className="corpo mt-4 max-w-[46ch] text-texto-2">
                Se você não encontrou o modelo que queria, fala com a gente. A gente
                procura e avisa quando chegar.
              </p>
            </div>
          </div>

          <div>
            <p className="etiqueta">Showroom</p>
            <address className="mt-4 not-italic">
              <p className="font-display text-3xl leading-tight font-bold text-texto">
                {config.enderecoRua}
              </p>
              <p className="corpo mt-2 text-texto-2">{config.enderecoCidadeUf}</p>
            </address>
            <a
              href={buildMapsRouteUrl(config)}
              target="_blank"
              rel="noopener noreferrer"
              className="link-acao mt-6"
            >
              <span>Traçar rota no Google Maps</span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
