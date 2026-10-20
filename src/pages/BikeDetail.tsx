import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Gauge, MapPin, Settings2 } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useJsonLd } from '../hooks/useJsonLd'
import { vehicleSchema } from '../lib/schema'
import { SITE } from '../data/site'
import { buildBikeMessage, formatKm, formatPrice } from '../lib/format'
import { usePageMeta } from '../hooks/usePageMeta'
import { BikeGallery } from '../components/motorcycles/BikeGallery'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { Button } from '../components/ui/Button'

export function BikeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { motos, carregando } = useCatalogo()
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
      <div className="flex min-h-[70vh] items-center justify-center pt-16" role="status">
        <span className="sr-only">Carregando</span>
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-500"
        />
      </div>
    )
  }

  if (!bike) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-16 text-center">
        <p className="eyebrow">Erro 404</p>
        <h1 className="h-display mt-3 text-3xl sm:text-4xl">
          Motocicleta não encontrada
        </h1>
        <p className="mt-3 max-w-md text-steel-400">
          Esse anúncio pode ter sido vendido ou o endereço está incorreto.
        </p>
        <Button to="/estoque" className="mt-8">
          Voltar ao estoque
        </Button>
      </div>
    )
  }

  const titulo = `${bike.marca} ${bike.modelo}`
  const disponivel = bike.status === 'disponivel'
  const temDescricao = bike.descricao.trim().length > 0
  const temEspecificacoes = bike.especificacoes.length > 0

  return (
    <div className="pt-16">
      <div className="container-site py-8 sm:py-10">
        <Link
          to="/estoque"
          className="inline-flex items-center gap-2 text-sm text-steel-400 transition-colors hover:text-paper"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao estoque
        </Link>
      </div>

      <div className="container-site grid gap-10 pb-16 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* Galeria */}
        <div>
          <BikeGallery imagens={bike.imagens} titulo={`${titulo} ${bike.ano}`} />
        </div>

        {/* Painel comercial */}
        <aside className="lg:sticky lg:top-24">
          <p className="eyebrow">{bike.categoria}</p>
          <h1 className="h-display mt-2 text-3xl sm:text-4xl">
            {titulo} <span className="text-steel-400">{bike.ano}</span>
          </h1>

          <p className="mt-4 font-display text-4xl font-semibold text-paper">
            {formatPrice(bike.preco)}
          </p>

          <span
            className={`mt-4 inline-block rounded px-2.5 py-1 font-display text-[11px] font-semibold tracking-[0.14em] uppercase ${
              disponivel ? 'bg-white/10 text-paper' : 'bg-steel-600/70 text-paper'
            }`}
          >
            {disponivel ? 'Disponível' : 'Indisponível'}
          </span>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
            <div className="bg-night-900 p-4">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-steel-400 uppercase">
                <Calendar className="size-3.5" aria-hidden="true" /> Ano
              </dt>
              <dd className="mt-1.5 font-display text-lg font-semibold">{bike.ano}</dd>
            </div>
            <div className="bg-night-900 p-4">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-steel-400 uppercase">
                <Gauge className="size-3.5" aria-hidden="true" /> Quilometragem
              </dt>
              <dd className="mt-1.5 font-display text-lg font-semibold">
                {formatKm(bike.quilometragem)}
              </dd>
            </div>
            <div className="col-span-2 bg-night-900 p-4">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-steel-400 uppercase">
                <Settings2 className="size-3.5" aria-hidden="true" /> Cilindrada
              </dt>
              <dd className="mt-1.5 font-display text-lg font-semibold">
                {bike.cilindrada ? `${bike.cilindrada} cc` : 'A confirmar'}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3">
            <WhatsAppCTA
              message={buildBikeMessage(bike.marca, bike.modelo, bike.ano)}
              label="Negociar pelo WhatsApp"
              className="w-full"
            />
            <Button to="/estoque" variant="outline" className="w-full">
              Ver outras motos
            </Button>
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-steel-500">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {SITE.endereco.rua} — {SITE.endereco.cidadeUf}. Visite a loja para
            conferir o veículo pessoalmente.
          </p>
        </aside>
      </div>

      {/* Descrição e especificações */}
      {temDescricao || temEspecificacoes ? (
        <section className="border-t border-line bg-night-900">
          <div
            className={`container-site grid gap-10 py-14 ${
              temDescricao && temEspecificacoes ? 'lg:grid-cols-2' : ''
            }`}
          >
            {temDescricao ? (
              <div>
                <h2 className="h-display text-2xl">Sobre esta moto</h2>
                <p className="mt-4 leading-relaxed text-steel-300">{bike.descricao}</p>
              </div>
            ) : null}
            {temEspecificacoes ? (
              <div>
                <h2 className="h-display text-2xl">Especificações</h2>
                <dl className="mt-4 divide-y divide-white/10 border-y border-white/10">
                  {bike.especificacoes.map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm text-steel-400">{spec.label}</dt>
                      <dd className="text-sm font-medium text-paper">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}
