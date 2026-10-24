import { Link } from 'react-router-dom'
import { Calendar, Gauge } from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { buildBikeMessage, descontoPercentual, formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

interface BikeCardProps {
  bike: Motorcycle
  priority?: boolean
  /** 'lista' (horizontal) não é mais usado, mas continua atendendo. */
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
  const desconto = descontoPercentual(bike)
  const disponivel = bike.status === 'disponivel'

  const foto = (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-fundo">
      <img
        src={capa?.src ?? PLACEHOLDER_CARD}
        alt={capa?.alt ?? titulo}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className="size-full object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
      />
      {/* Selo circular da promoção: percentual de desconto. Fora da
          promoção o card não desenha nada aqui. */}
      {desconto != null ? (
        <span className="absolute top-3 left-3 grid size-12 place-items-center rounded-full bg-marca font-display text-[13px] leading-none font-bold text-white shadow-lg shadow-black/40 ring-1 ring-white/25">
          <span className="sr-only">Promoção: </span>
          -{desconto}%
        </span>
      ) : null}

      {/* Desktop: os botões moram DENTRO da foto e só aparecem quando o
          mouse entra no card — em repouso a vitrine é limpa, só imagem.
          O teclado também revela (focus-within). Mobile não desenha. */}
      <div
        className="absolute inset-x-0 bottom-0 hidden translate-y-2 gap-2 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent p-3 pt-12 opacity-0 transition-all duration-300 focus-within:translate-y-0 focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 lg:flex"
      >
        <Link
          to={`/moto/${bike.slug}`}
          className={`grid place-items-center rounded-xl bg-white py-2.5 font-sans text-[13px] font-bold text-black transition-colors hover:bg-neutral-200 ${disponivel ? 'flex-1' : 'w-full'}`}
        >
          Ver detalhes
        </Link>
        {disponivel && waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-40 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-500/70 bg-black/30 py-2.5 font-sans text-[13px] font-semibold text-neutral-100 transition-colors backdrop-blur-sm hover:border-white/70 hover:text-white"
          >
            <IconeWhatsapp className="size-4 shrink-0" />
            WhatsApp
          </a>
        ) : null}
        {disponivel && !waLink ? (
          <Link
            to="/contato"
            className="inline-flex w-40 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-500/70 bg-black/30 py-2.5 font-sans text-[13px] font-semibold text-neutral-100 transition-colors backdrop-blur-sm hover:border-white/70 hover:text-white"
          >
            <IconeWhatsapp className="size-4 shrink-0" />
            Falar com a loja
          </Link>
        ) : null}
      </div>
    </div>
  )

  // Título e preço na mesma linha: o preço é a segunda informação que o
  // visitante busca (foto → moto → preço) e não pode morar no fim do card.
  const preco = (
    <div className="shrink-0 text-right">
      {desconto != null ? (
        <>
          <p className="numeros text-[11px] leading-none text-texto-3">
            <span className="line-through">de {formatPrice(bike.precoAntes ?? bike.preco)}</span>
          </p>
          <p className="numeros mt-1 font-display text-lg leading-none font-semibold text-marca-texto">
            {formatPrice(bike.preco)}
          </p>
        </>
      ) : (
        <p className="numeros font-display text-lg leading-none font-semibold text-texto">
          {formatPrice(bike.preco)}
        </p>
      )}
    </div>
  )

  const informacoes = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[17px] leading-tight font-semibold tracking-[-0.02em] text-texto">
          {titulo}
        </h3>
        {preco}
      </div>

      {/* Meta compacta com ícone: lê em um relance, como na referência. */}
      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-none text-texto-3">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="numeros">{bike.ano}</span>
        </span>
        {bike.quilometragem != null ? (
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="numeros">{formatKm(bike.quilometragem)}</span>
          </span>
        ) : null}
        {estado ? <span>{estado}</span> : null}
      </p>
    </>
  )

  // Mobile: os botões ficam no rodapé do card, sempre visíveis — touch
  // não tem hover, então o overlay do desktop não serve aqui.
  const acoesMobile = (
    <div
      className={`grid gap-2 px-4 pt-3 pb-4 sm:px-5 lg:hidden ${disponivel ? 'grid-cols-2' : 'grid-cols-1'}`}
    >
      <Link
        to={`/moto/${bike.slug}`}
        aria-label={`Ver os detalhes de ${titulo} ${bike.ano}`}
        className={`grid min-h-10 place-items-center rounded-xl bg-white py-2.5 font-sans text-[13px] font-bold text-black transition-colors hover:bg-neutral-200 ${
          disponivel ? '' : 'col-span-2'
        }`}
      >
        Ver detalhes
      </Link>

      {disponivel && waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-borda-forte py-2.5 font-sans text-[13px] font-semibold text-texto-2 transition-colors hover:border-marca hover:text-marca-texto"
        >
          <IconeWhatsapp className="size-4 shrink-0" />
          WhatsApp
        </a>
      ) : null}

      {disponivel && !waLink ? (
        <Link
          to="/contato"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-borda-forte py-2.5 font-sans text-[13px] font-semibold text-texto-2 transition-colors hover:border-marca hover:text-marca-texto"
        >
          <IconeWhatsapp className="size-4 shrink-0" />
          Falar com a loja
        </Link>
      ) : null}
    </div>
  )

  const artigo =
    'group flex h-full flex-col overflow-hidden bg-painel transition-colors duration-300 hover:bg-painel-2'

  if (variante === 'lista') {
    return (
      <article className={artigo}>
        <Link
          to={`/moto/${bike.slug}`}
          aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
          className="flex flex-1 sm:flex-row"
        >
          <div className="w-full shrink-0 sm:w-48">{foto}</div>
          <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
            {informacoes}
          </div>
        </Link>
        {acoesMobile}
      </article>
    )
  }

  return (
    <article className={artigo}>
      {foto}
      <div className="flex flex-1 flex-col p-4 pb-2 sm:px-5">
        {informacoes}
      </div>
      {acoesMobile}
    </article>
  )
}
