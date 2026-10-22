import { Link } from 'react-router-dom'
import { Calendar, Gauge, MessageCircle } from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { buildBikeMessage, formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'

interface BikeCardProps {
  bike: Motorcycle
  priority?: boolean
  /**
   * Formato do card: `grade` (colunas de folha, como no estoque e na
   * home) ou `lista` (linha horizontal, um registro por linha).
   * O visitante alterna no estoque; a home e a ficha usam a grade.
   */
  variante?: 'grade' | 'lista'
}

/**
 * Estado da moto, em texto.
 *
 * Só aparece quando a moto não está à venda. Um carimbo de cor
 * sobre a foto seria enfeite; a palavra resolve a dúvida na hora.
 */
const ESTADO: Partial<Record<MotorcycleStatus, string>> = {
  indisponivel: 'Indisponível',
  vendida: 'Vendida',
}

/**
 * Ficha do pátio.
 *
 * Não é cartão: é uma folha com a foto em cima e os dados embaixo,
 * como a ficha de vistoria de verdade. Sem moldura, sem fundo, sem
 * etiqueta — a foto é o bloco, o texto fica embaixo dela e o preço é
 * o único vermelho.
 *
 * Um link só: o título estica a área clicável sobre a ficha inteira
 * (também sobre a foto), o que dá um alvo grande para o dedo sem
 * duplicar link para quem navega por teclado ou leitor de tela.
 */
export function BikeCard({ bike, priority = false, variante = 'grade' }: BikeCardProps) {
  const titulo = `${bike.marca} ${bike.modelo}`
  const capa = bike.imagens[0]
  const estado = ESTADO[bike.status]
  const selo = bike.destaque && bike.status === 'disponivel'
  const waLink = useWhatsappLink(buildBikeMessage(bike.marca, bike.modelo, bike.ano))

  const foto = (
    <>
      <img
        src={capa?.src ?? PLACEHOLDER_CARD}
        alt={capa?.alt ?? titulo}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        width={1200}
        height={900}
        className={`w-full object-cover ${
          variante === 'lista' ? 'h-full' : 'aspect-[4/3]'
        }`}
      />

      {selo ? (
        <span className="pointer-events-none absolute top-2 left-2 bg-fundo/80 px-2 py-0.5 text-[11px] font-semibold tracking-[0.12em] text-texto uppercase backdrop-blur-sm">
          DESTAQUE
        </span>
      ) : null}

      {estado ? (
        <span className="pointer-events-none absolute top-0 right-0 bg-fundo px-3 py-1.5 text-sm font-semibold text-texto">
          {estado}
        </span>
      ) : null}
    </>
  )

  const kmTexto = formatKm(bike.quilometragem)
  const kmConfirmar = bike.quilometragem == null

  const cta =
    bike.status === 'disponivel' ? (
      waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn btn-secondary btn-sm gap-2 border-borda-forte bg-claro/5 hover:border-texto hover:bg-claro/10 hover:text-texto ${
            variante === 'grade' ? 'w-full justify-center' : 'w-fit'
          }`}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Tenho interesse
        </a>
      ) : (
        <Link
          to="/contato"
          className={`btn btn-secondary btn-sm gap-2 border-borda-forte bg-claro/5 hover:border-texto hover:bg-claro/10 hover:text-texto ${
            variante === 'grade' ? 'w-full justify-center' : 'w-fit'
          }`}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Tenho interesse
        </Link>
      )
    ) : null

  if (variante === 'lista') {
    return (
      <article className="group relative border border-borda bg-painel transition-colors hover:border-borda-forte">
        <Link
          to={`/moto/${bike.slug}`}
          aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
          className="block focus-visible:outline-none"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full overflow-hidden bg-painel-2 sm:w-60 sm:shrink-0">
              {foto}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5 pb-0 sm:p-4 sm:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="pequeno text-texto-3">{bike.marca}</p>
                  <h3 className="mt-0.5 font-display text-xl font-semibold leading-tight tracking-[-0.01em] text-texto transition-colors group-hover:text-marca-texto truncate sm:text-2xl">
                    {bike.modelo} <span className="text-texto-3">· {bike.ano}</span>
                  </h3>
                </div>
                <p className="preco mt-1 text-2xl whitespace-nowrap">
                  {formatPrice(bike.preco)}
                </p>
              </div>

              <p className="pequeno flex flex-wrap items-center gap-x-5 gap-y-1 text-texto-2">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar aria-hidden="true" className="size-3.5" />
                  {bike.ano}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    kmConfirmar ? 'text-texto-3' : ''
                  }`}
                >
                  <Gauge aria-hidden="true" className="size-3.5" />
                  {kmTexto}
                </span>
                {bike.cilindrada ? <span>{bike.cilindrada} cc</span> : null}
                {bike.categoria ? <span>{bike.categoria}</span> : null}
              </p>
            </div>
          </div>
        </Link>

        {cta ? <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">{cta}</div> : null}
      </article>
    )
  }

  return (
    <article className="group relative">
      <Link
        to={`/moto/${bike.slug}`}
        aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
        className="block focus-visible:outline-none"
      >
        <div className="relative overflow-hidden bg-painel-2">{foto}</div>

        <div className="mt-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-texto-3">{bike.marca}</p>
              <h3 className="mt-0.5 font-display text-lg font-semibold leading-tight tracking-[-0.01em] text-texto transition-colors group-hover:text-marca-texto truncate">
                {bike.modelo} <span className="text-texto-3">· {bike.ano}</span>
              </h3>
            </div>
            <p className="preco mt-0.5 text-2xl whitespace-nowrap sm:text-[1.75rem]">
              {formatPrice(bike.preco)}
            </p>
          </div>

          <p className="pequeno mt-1.5 flex items-center gap-4 text-texto-2">
            <span className="inline-flex items-center gap-1.5">
              <Calendar aria-hidden="true" className="size-3.5" />
              {bike.ano}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 ${
                kmConfirmar ? 'text-texto-3' : ''
              }`}
            >
              <Gauge aria-hidden="true" className="size-3.5" />
              {kmTexto}
            </span>
          </p>
        </div>
      </Link>

      {cta ? <div className="mt-3">{cta}</div> : null}
    </article>
  )
}
