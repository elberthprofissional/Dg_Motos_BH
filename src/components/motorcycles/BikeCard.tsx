import { Link } from 'react-router-dom'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { buildBikeMessage, formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

interface BikeCardProps {
  bike: Motorcycle
  priority?: boolean
  variante?: 'grade' | 'lista'
}

const ESTADO: Partial<Record<MotorcycleStatus, string>> = {
  indisponivel: 'Indisponível',
  vendida: 'Vendida',
}

export function BikeCard({ bike, priority = false, variante = 'grade' }: BikeCardProps) {
  const titulo = `${bike.marca} ${bike.modelo}`
  const capa = bike.imagens[0] ?? bike.imagens[1]
  const estado = ESTADO[bike.status]
  const waLink = useWhatsappLink(buildBikeMessage(bike.marca, bike.modelo, bike.ano))
  const detalhes = [String(bike.ano), bike.categoria]

  if (bike.quilometragem != null) detalhes.push(formatKm(bike.quilometragem))
  if (estado) detalhes.push(estado)

  const foto = (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-fundo">
      <img
        src={capa?.src ?? PLACEHOLDER_CARD}
        alt={capa?.alt ?? titulo}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className="size-full object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
      />
    </div>
  )

  const informacoes = (
    <>
      <p className="text-[13px] leading-none text-texto-3">{bike.marca}</p>
      <h3 className="mt-1.5 font-display text-lg leading-tight font-semibold tracking-[-0.02em] text-texto">
        {bike.modelo}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-texto-2">
        {detalhes.join(' · ')}
      </p>
      <p className="numeros mt-auto pt-4 font-display text-lg leading-none font-semibold text-texto">
        {formatPrice(bike.preco)}
      </p>
    </>
  )

  const cta =
    bike.status === 'disponivel' ? (
      waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-6 items-center gap-1.5 text-[13px] font-medium text-marca-texto transition-colors hover:text-texto"
        >
          <IconeWhatsapp className="size-3.5 shrink-0" />
          Tenho interesse
        </a>
      ) : (
        <Link
          to="/contato"
          className="inline-flex min-h-6 items-center gap-1.5 text-[13px] font-medium text-marca-texto transition-colors hover:text-texto"
        >
          <IconeWhatsapp className="size-3.5 shrink-0" />
          Tenho interesse
        </Link>
      )
    ) : null

  const artigo =
    'group flex h-full flex-col overflow-hidden bg-painel transition-colors duration-300 hover:bg-painel-2'

  if (variante === 'lista') {
    return (
      <article className={artigo}>
        <Link
          to={`/moto/${bike.slug}`}
          aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
          className="flex flex-1 flex-col sm:flex-row"
        >
          <div className="w-full shrink-0 sm:w-44">{foto}</div>
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
            {informacoes}
          </div>
        </Link>

        {cta ? <div className="px-4 pt-1 pb-4 sm:px-5">{cta}</div> : null}
      </article>
    )
  }

  return (
    <article className={artigo}>
      <Link
        to={`/moto/${bike.slug}`}
        aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
        className="flex flex-1 flex-col"
      >
        {foto}
        <div className="flex flex-1 flex-col p-4">{informacoes}</div>
      </Link>

      {cta ? <div className="px-4 pt-1 pb-4">{cta}</div> : null}
    </article>
  )
}
