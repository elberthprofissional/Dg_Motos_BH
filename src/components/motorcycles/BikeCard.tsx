import { Link } from 'react-router-dom'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface BikeCardProps {
  bike: Motorcycle
  priority?: boolean
}

/**
 * Selo de disponibilidade.
 *
 * Fica sobre a foto, então precisa de fundo sólido para ser legível em
 * qualquer imagem. `disponivel` é o único estado positivo (verde da
 * identidade); `indisponivel`/`vendida` ficam em grafite apagado — a
 * moto ainda aparece, mas sem competir com as que estão à venda.
 */
const SELO: Record<MotorcycleStatus, { texto: string; classe: string }> = {
  disponivel: { texto: 'Disponível', classe: 'bg-night-950/90 text-ok ring-1 ring-inset ring-ok/40' },
  indisponivel: { texto: 'Indisponível', classe: 'bg-night-950/90 text-steel-400 ring-1 ring-inset ring-line-forte' },
  vendida: { texto: 'Vendida', classe: 'bg-night-950/90 text-steel-600 ring-1 ring-inset ring-line-forte' },
}

/**
 * Card de motocicleta da vitrine.
 *
 * A foto é protagonista: proporção 4/3 mostra a moto inteira (rodas e
 * guidão dentro do quadro) sem o corte panorâmico que cortava as rodas.
 * A hierarquia de texto vai da marca (pequena, neutra) para o modelo
 * (grande, branco) e desce até ano/cc e preço — quem lê de cima para
 * baixo chega ao valor sem esforço.
 */
export function BikeCard({ bike, priority = false }: BikeCardProps) {
  const title = `${bike.marca} ${bike.modelo}`
  const capa = bike.imagens[0]
  const selo = SELO[bike.status] ?? SELO.disponivel

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-line bg-night-900 transition-colors duration-200 hover:border-line-forte">
      <div className="relative">
        <Link
          to={`/moto/${bike.slug}`}
          className="block aspect-[4/3] overflow-hidden bg-night-950"
          aria-label={`Ver detalhes de ${title} ${bike.ano}`}
        >
          <img
            src={capa?.src ?? PLACEHOLDER_CARD}
            alt={capa?.alt ?? `${title} ${bike.ano}`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            width={1200}
            height={900}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <span
          className={`pointer-events-none absolute top-3 left-3 px-2.5 py-1 font-display text-[10px] font-semibold tracking-[0.16em] uppercase ${selo.classe}`}
        >
          {selo.texto}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        <div className="flex-1">
          <p className="text-[11px] font-medium tracking-[0.14em] text-steel-500 uppercase">
            {bike.marca}
          </p>
          <h3 className="mt-1.5 font-display text-xl leading-tight font-semibold tracking-[0.03em] text-paper uppercase sm:text-2xl">
            <Link
              to={`/moto/${bike.slug}`}
              className="transition-colors duration-200 hover:text-brand-500"
            >
              {bike.modelo}
            </Link>
          </h3>
          <p className="mt-2 text-sm text-steel-400">
            <span className="tabular-nums">{bike.ano}</span>
            {bike.cilindrada ? ` · ${bike.cilindrada} cc` : ''}
          </p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-4">
          <p className="etiqueta-preco text-lg leading-none group-hover:brightness-110 sm:text-xl">
            <span>{formatPrice(bike.preco)}</span>
          </p>
          <Link
            to={`/moto/${bike.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 pb-0.5 text-xs font-semibold tracking-[0.1em] text-steel-400 uppercase transition-colors duration-200 group-hover:text-brand-500"
          >
            Detalhes
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
