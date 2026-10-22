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

/**
 * Ficha da moto.
 *
 * A página é a própria ficha de vistoria: o nome e o preço primeiro
 * (é o que o cliente procura), a foto ao lado no desktop e as
 * especificações descendo como lista de linha — um documento, não um
 * anúncio.
 *
 * No celular a ordem se inverte: o h1 e o preço abrem a página, e a
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
  const temEspecificacoes = bike.especificacoes.length > 0

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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16">
          <div className="order-2 lg:order-none">
            <BikeGallery imagens={bike.imagens} titulo={`${titulo} ${bike.ano}`} />
          </div>

          <div className="contents lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-5">
            <div className="order-1 lg:order-none">
              <p className="text-sm uppercase tracking-[0.18em] text-texto-3">
                {bike.marca}
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.01] tracking-[-0.025em] text-texto sm:text-5xl xl:text-6xl">
                {bike.modelo} <span className="text-texto-3">{bike.ano}</span>
              </h1>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                <p className="text-4xl font-semibold tracking-[-0.02em] text-marca-texto numeros sm:text-5xl xl:text-6xl">
                  {formatPrice(bike.preco)}
                </p>
                <p
                  className={`inline-flex items-center gap-2 border px-2.5 py-1 text-xs font-medium ${
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
            </div>

            <div className="order-3 grid grid-cols-3 divide-x divide-borda border-y border-borda py-4 lg:order-none">
              {bike.ano ? (
                <div className="px-4 first:pl-0 last:pr-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-texto-3">Ano</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-texto numeros">
                    {bike.ano}
                  </p>
                </div>
              ) : null}
              <div className="px-4 first:pl-0 last:pr-0">
                <p className="text-xs uppercase tracking-[0.14em] text-texto-3">Quilometragem</p>
                <p className="mt-1.5 font-display text-lg font-semibold text-texto numeros">
                  {formatKm(bike.quilometragem)}
                </p>
              </div>
              {bike.cilindrada ? (
                <div className="px-4 first:pl-0 last:pr-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-texto-3">Cilindrada</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-texto numeros">
                    {bike.cilindrada} cc
                  </p>
                </div>
              ) : null}
            </div>

            <div className="order-3 lg:order-none">
              <WhatsAppCTA
                message={buildBikeMessage(bike.marca, bike.modelo, bike.ano)}
                glifoWhatsapp
                label="Negociar pelo WhatsApp"
                className="h-12 w-full"
              />
              <p className="mt-4 flex items-start gap-2 text-sm text-texto-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-marca-texto" aria-hidden="true" />
                {config.enderecoRua} — {config.enderecoCidadeUf}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="section border-t border-borda bg-fundo pt-10 sm:pt-12">
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
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {motos
              .filter((m) => m.id !== bike.id && m.status === 'disponivel')
              .slice(0, 4)
              .map((m) => (
                <BikeCard key={m.id} bike={m} />
              ))}
          </div>
        </div>
      </section>
      {temDescricao || temEspecificacoes ? (
        <section className="section bg-painel">
          <div className="container-site">
            <div className="mb-10">
              <h2 className="titulo text-2xl text-texto sm:text-3xl">
                Informações da moto
              </h2>
            </div>
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              {temEspecificacoes ? (
                <div className="lg:col-span-7">
                  <h3 className="font-display text-xl font-semibold text-texto">
                    Especificações
                  </h3>
                  <div className="mt-6 grid grid-cols-1 gap-y-4 sm:grid-cols-2">
                    {[
                      { label: 'Marca', value: bike.marca },
                      { label: 'Modelo', value: bike.modelo },
                      { label: 'Ano', value: String(bike.ano) },
                      bike.cilindrada
                        ? { label: 'Cilindrada', value: `${bike.cilindrada} cc` }
                        : null,
                      { label: 'Quilometragem', value: formatKm(bike.quilometragem) },
                      bike.categoria ? { label: 'Categoria', value: bike.categoria } : null,
                      ...(bike.especificacoes || []),
                    ]
                      .filter(Boolean)
                      .map((spec: any) => (
                        <div key={spec.label} className="border-b border-borda pb-4">
                          <p className="text-xs uppercase tracking-[0.14em] text-texto-3">
                            {spec.label}
                          </p>
                          <p className="mt-2 font-display text-base font-semibold text-texto">
                            {spec.value}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
              {temDescricao ? (
                <div className={temEspecificacoes ? 'lg:col-span-5' : 'lg:col-span-8'}>
                  <h3 className="font-display text-xl font-semibold text-texto">
                    Descrição
                  </h3>
                  <p className="mt-6 max-w-[64ch] whitespace-pre-line text-base leading-relaxed text-texto-2">
                    {bike.descricao}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
