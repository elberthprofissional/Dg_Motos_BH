import { Link } from 'react-router-dom'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface BikeCardProps {
  bike: Motorcycle
  priority?: boolean
}

const SELO: Record<MotorcycleStatus, { texto: string; classe: string }> = {
  disponivel: { texto: 'Disponível', classe: 'bg-[#d91f32] text-[#f5f5f5]' },
  indisponivel: { texto: 'Indisponível', classe: 'bg-[#202020] text-[#a3a3a3]' },
  vendida: { texto: 'Vendida', classe: 'bg-[#202020] text-[#6b6b6b]' },
}

export function BikeCard({ bike, priority = false }: BikeCardProps) {
  const title = `${bike.marca} ${bike.modelo}`
  const capa = bike.imagens[0]
  const selo = SELO[bike.status] ?? SELO.disponivel

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-white/8 bg-[#181818] transition-colors duration-200 hover:border-white/14">
      <div className="relative">
        <Link
          to={`/moto/${bike.slug}`}
          className="block aspect-[16/10] overflow-hidden bg-[#101010]"
          aria-label={`Ver detalhes de ${title} ${bike.ano}`}
        >
          <img
            src={capa?.src ?? PLACEHOLDER_CARD}
            alt={capa?.alt ?? `${title} ${bike.ano}`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            width={1200}
            height={750}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </Link>
        <span
          className={`pointer-events-none absolute top-3 left-3 px-2 py-1 font-display text-[9px] font-semibold tracking-[0.18em] uppercase ${selo.classe}`}
        >
          {selo.texto}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        <div className="flex-1">
          <p className="font-display text-[10px] font-semibold tracking-[0.22em] text-[#a3a3a3] uppercase">
            {bike.marca}
          </p>
          <h3 className="mt-1 font-display text-xl leading-tight font-semibold tracking-[0.06em] text-[#f5f5f5] uppercase sm:text-2xl">
            <Link
              to={`/moto/${bike.slug}`}
              className="transition-colors duration-200 hover:text-[#d91f32]"
            >
              {bike.modelo}
            </Link>
          </h3>
          <p className="mt-2 text-sm text-[#a3a3a3]">
            {bike.ano} • {bike.cilindrada}cc
          </p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/6 pt-4">
          <div>
            <p className="font-display text-[9px] font-semibold tracking-[0.24em] text-[#8c8c8c] uppercase">
              Preço
            </p>
            <p className="valor-moeda mt-1 text-lg font-semibold text-[#f5f5f5] sm:text-xl">
              {formatPrice(bike.preco)}
            </p>
          </div>
          <Link
            to={`/moto/${bike.slug}`}
            className="inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.18em] text-[#f5f5f5] uppercase transition-colors duration-200 hover:text-[#d91f32]"
          >
            Ver detalhes
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
