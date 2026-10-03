import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gauge, GitCompare, MapPin } from 'lucide-react'
import type { Motorcycle } from '../../types'
import { formatKm, formatPrice } from '../../lib/format'
import { SITE } from '../../data/site'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { useCompare } from '../../hooks/useCompare'

interface BikeCardProps {
  bike: Motorcycle
  /** Prioriza o carregamento da primeira dobra (home). */
  priority?: boolean
}

export function BikeCard({ bike, priority = false }: BikeCardProps) {
  const title = `${bike.marca} ${bike.modelo}`
  const capa = bike.imagens[0]
  const { toggle, isSelected, MAX } = useCompare()
  const selecionada = isSelected(bike.slug)
  const [aviso, setAviso] = useState<string | null>(null)

  function comparar() {
    const ok = toggle(bike.slug)
    setAviso(
      ok
        ? null
        : `Você já tem ${MAX} motos na comparação. Remova uma para adicionar esta.`,
    )
    if (!ok) window.setTimeout(() => setAviso(null), 4000)
  }

  return (
    <article className="group surface flex flex-col overflow-hidden rounded-lg transition-colors duration-300 hover:border-white/25">
      <div className="relative">
        <Link
          to={`/moto/${bike.slug}`}
          className="block aspect-[3/2] overflow-hidden bg-night-800"
          aria-label={`Ver detalhes de ${title} ${bike.ano}`}
        >
          <img
            src={capa?.src ?? PLACEHOLDER_CARD}
            alt={capa?.alt ?? `${title} ${bike.ano}`}
            loading={priority ? 'eager' : 'lazy'}
            width={640}
            height={420}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Botão de comparação */}
        <button
          type="button"
          onClick={comparar}
          aria-pressed={selecionada}
          aria-label={
            selecionada
              ? `Remover ${title} da comparação`
              : `Adicionar ${title} à comparação`
          }
          title={selecionada ? 'Remover da comparação' : 'Comparar'}
          className={`absolute top-3 right-3 grid size-9 place-items-center rounded-full border transition-all ${
            selecionada
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-white/25 bg-night-950/70 text-steel-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-paper'
          }`}
        >
          <GitCompare className="size-4" aria-hidden="true" />
        </button>

        {/* Aviso ao atingir o limite do comparador */}
        {aviso && (
          <p
            role="status"
            className="absolute inset-x-3 bottom-3 rounded bg-night-950/95 px-3 py-2 text-[11px] leading-snug text-steel-300"
          >
            {aviso}
          </p>
        )}

        <span
          className={`absolute top-3 left-3 rounded px-2 py-1 font-display text-[10px] font-semibold tracking-[0.14em] uppercase ${
            bike.disponibilidade === 'disponivel'
              ? 'bg-white/10 text-paper'
              : 'bg-steel-600/80 text-paper'
          }`}
        >
          {bike.disponibilidade === 'disponivel' ? 'Disponível' : 'Reservada'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold uppercase">
              <Link to={`/moto/${bike.slug}`} className="transition-colors hover:text-brand-500">
                {title}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-steel-400">
              {bike.ano} · {bike.cilindrada ? `${bike.cilindrada} cc` : 'cc a confirmar'}
            </p>
          </div>
          <p className="font-display text-lg font-semibold whitespace-nowrap text-paper">
            {formatPrice(bike.preco)}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-steel-400">
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="size-3.5" aria-hidden="true" />
            {formatKm(bike.quilometragem)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {SITE.cidade}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs font-medium tracking-[0.14em] text-steel-400 uppercase">
            {bike.categoria}
          </span>
          <Link
            to={`/moto/${bike.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
          >
            Ver detalhes
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
