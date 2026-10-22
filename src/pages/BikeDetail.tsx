import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, MapPin } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useJsonLd } from '../hooks/useJsonLd'
import { vehicleSchema } from '../lib/schema'
import { buildBikeMessage, formatKm, formatPrice } from '../lib/format'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { BikeGallery } from '../components/motorcycles/BikeGallery'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { Button } from '../components/ui/Button'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { Revelar } from '../components/ui/Revelar'

/**
 * Ficha da moto.
 *
 * A página é a própria ficha de vistoria, mas organizada como uma
 * vitrine: no topo ficam a galeria, o nome, o preço e o contato; logo
 * abaixo vem a ficha técnica completa; e as motos recomendadas fecham
 * a página, imediatamente antes do rodapé.
 *
 * No celular a ordem se mantém: o h1 e o preço abrem a página e a
 * foto vem logo abaixo. Não existe barra fixa de preço: uma barra
 * cobria o próprio título, e o que escondia a informação era
 * justamente a parte mais importante da página.
 */
export function BikeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { motos, carregando } = useCatalogo()
  const { config } = useSiteConfig()
  const bike = motos.find((m) => m.slug === slug)

  // JSON-LD precisa estar antes do early-return do 404
  useJsonLd(bike ? vehicleSchema(bike) : {})

  usePageMeta(
    bike
      ? `${bike.marca} ${bike.modelo} ${bike.ano} | DG Motos`
      : 'Motocicleta não encontrada | DG Motos',
    bike
      ? `${bike.marca} ${bike.modelo} ${bike.ano} seminova na DG Motos, Belo Horizonte. ${formatPrice(bike.preco)}.`
      : 'Esta motocicleta não está mais no catálogo da DG Motos.',
  )

  // Enquanto o banco não responde, a página fica em branco em vez de
  // mostrar "não encontrada" — senão o Google indexaria um 404 falso.
  if (!bike && carregando) {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center pt-cabecalho"
        role="status"
      >
        <span className="sr-only">Carregando</span>
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-2 border-borda-forte border-t-marca"
        />
      </div>
    )
  }

  if (!bike) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-cabecalho text-center">
        <h1 className="titulo mt-4 text-3xl text-texto sm:text-4xl">
          Motocicleta não encontrada
        </h1>
        <p className="corpo mt-4 max-w-md text-texto-2">
          Essa moto pode já ter sido vendida, ou o endereço do link está errado.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button to="/estoque">Ver as outras motos do estoque</Button>
          <Button to="/contato" variant="outline">
            Falar com a loja
          </Button>
        </div>
      </div>
    )
  }

  const titulo = `${bike.marca} ${bike.modelo}`
  const disponivel = bike.status === 'disponivel'
  const temDescricao = bike.descricao.trim().length > 0

  const especificacoes: { label: string; value: string }[] = [
    { label: 'Marca', value: bike.marca },
    { label: 'Modelo', value: bike.modelo },
    { label: 'Ano', value: String(bike.ano) },
    bike.cilindrada
      ? { label: 'Cilindrada', value: `${bike.cilindrada} cc` }
      : null,
    { label: 'Quilometragem', value: formatKm(bike.quilometragem) },
    bike.categoria ? { label: 'Categoria', value: bike.categoria } : null,
    ...(bike.especificacoes || []),
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec))

  const recomendadas = motos
    .filter((m) => m.id !== bike.id && m.status === 'disponivel')
    .slice(0, 4)

  return (
    <div className="pt-cabecalho">
      <div className="container-site py-8 lg:py-12">
        <nav
          aria-label="Navegação estrutural"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-texto-3"
        >
          <Link
            to="/"
            className="inline-flex min-h-6 items-center transition-colors hover:text-texto"
          >
            Início
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <Link
            to="/estoque"
            className="inline-flex min-h-6 items-center transition-colors hover:text-texto"
          >
            Estoque
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="text-texto-2">{bike.modelo} {bike.ano}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16">
          <div className="order-2 lg:order-none">
            <BikeGallery imagens={bike.imagens} titulo={`${titulo} ${bike.ano}`} />
          </div>

          <div className="contents lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-6">
            <div className="order-1 lg:order-none">
              <p className="text-sm uppercase tracking-[0.18em] text-texto-3">
                {bike.marca}
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.01] tracking-[-0.025em] text-texto sm:text-5xl xl:text-6xl">
                {bike.modelo} <span className="text-texto-3">{bike.ano}</span>
              </h1>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                <p className="numeros text-4xl font-semibold tracking-[-0.02em] text-marca-texto sm:text-5xl xl:text-6xl">
                  {formatPrice(bike.preco)}
                </p>
                <p
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    disponivel
                      ? 'border-borda-forte text-texto-2'
                      : 'border-borda text-texto-3'
                  }`}
                >
                  {disponivel ? (
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-marca"
                    />
                  ) : null}
                  <span>
                    {disponivel ? 'Disponível' : 'Indisponível no momento'}
                  </span>
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {bike.ano ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-borda bg-painel/70 px-3 py-1.5 text-xs">
                    <span className="text-texto-3">Ano</span>
                    <span className="numeros font-semibold text-texto">{bike.ano}</span>
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2 rounded-full border border-borda bg-painel/70 px-3 py-1.5 text-xs">
                  <span className="text-texto-3">KM</span>
                  <span className="numeros font-semibold text-texto">
                    {formatKm(bike.quilometragem)}
                  </span>
                </span>
                {bike.cilindrada ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-borda bg-painel/70 px-3 py-1.5 text-xs">
                    <span className="text-texto-3">Cilindrada</span>
                    <span className="numeros font-semibold text-texto">
                      {bike.cilindrada} cc
                    </span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="order-3 lg:order-none">
              <WhatsAppCTA
                message={buildBikeMessage(bike.marca, bike.modelo, bike.ano)}
                glifoWhatsapp
                label="Negociar pelo WhatsApp"
                className="h-12 w-full rounded-xl"
              />
              <p className="mt-4 flex items-start gap-2 text-sm text-texto-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-marca-texto" aria-hidden="true" />
                {config.enderecoRua} — {config.enderecoCidadeUf}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="border-t border-borda bg-fundo py-12 sm:py-16">
        <div className="container-site">
          <div className="max-w-2xl">
            <h2 className="titulo text-2xl text-texto sm:text-3xl">
              Informações da moto
            </h2>
            <p className="mt-3 text-texto-2">
              Ficha técnica da unidade e observações da loja sobre esta moto.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {especificacoes.map((spec) => (
              <div
                key={spec.label}
                className="rounded-xl border border-borda bg-painel/80 p-4"
              >
                <p className="text-[11px] font-medium tracking-[0.12em] text-texto-3 uppercase">
                  {spec.label}
                </p>
                <p className="mt-2 font-display text-sm font-semibold text-white sm:text-base">
                  {spec.value}
                </p>
              </div>
            ))}
          </div>

          {temDescricao ? (
            <div className="mt-4 rounded-2xl border border-borda bg-painel/80 p-6 sm:p-8">
              <h3 className="font-display text-lg font-semibold text-texto">
                Descrição
              </h3>
              <p className="mt-4 max-w-[80ch] whitespace-pre-line text-base leading-relaxed text-texto-2">
                {bike.descricao}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {recomendadas.length > 0 ? (
        <section className="border-t border-borda bg-fundo py-14 sm:py-20">
          <div className="container-site">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="titulo text-2xl text-texto sm:text-3xl">
                  Você também pode gostar
                </h2>
                <p className="mt-3 text-texto-2">
                  Outras motos disponíveis no estoque da DG Motos.
                </p>
              </div>
              <Link to="/estoque" className="link-acao">
                <span>Ver todo o estoque</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {recomendadas.map((m, i) => (
                <Revelar key={m.id} atraso={i * 60}>
                  <BikeCard bike={m} />
                </Revelar>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
