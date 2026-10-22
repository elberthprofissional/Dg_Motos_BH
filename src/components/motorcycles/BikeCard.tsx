import { Link } from 'react-router-dom'
import { Calendar, Fuel, Gauge } from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { buildBikeMessage, formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

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
 * Ficha do pátio — a vitrine da moto.
 *
 * A foto é a peça principal: ocupa toda a largura do card no
 * enquadramento 4:3, sem moldura interna. Marca, modelo, ano,
 * quilometragem e combustível descem em hierarquia clara; o preço
 * fecha o bloco em vermelho e o contato vira a única ação do card.
 *
 * O card inteiro leva à ficha (um link só, com alvo grande para o
 * dedo); o botão "Tenho interesse" fica fora desse link porque leva
 * a outra ação, o contato direto pelo WhatsApp.
 */
export function BikeCard({ bike, priority = false, variante = 'grade' }: BikeCardProps) {
  const titulo = `${bike.marca} ${bike.modelo}`
  // O card usa a segunda foto (lateral, mais larga) quando existe: ela
  // enquadra melhor no 4:3 e costuma ser a imagem limpa do anúncio. A
  // galeria da ficha continua com todas as fotos cadastradas.
  const capa = bike.imagens[1] ?? bike.imagens[0]
  const estado = ESTADO[bike.status]
  const selo = bike.destaque && bike.status === 'disponivel'
  const waLink = useWhatsappLink(buildBikeMessage(bike.marca, bike.modelo, bike.ano))

  const kmTexto = formatKm(bike.quilometragem)
  const kmConfirmar = bike.quilometragem == null
  // O combustível não é um campo próprio no catálogo: quando a ficha
  // traz essa especificação, ela vira badge ao lado do ano e da km.
  const combustivel = bike.especificacoes.find((e) => /combust/i.test(e.label))?.value

  const foto = (
    <>
      <img
        src={capa?.src ?? PLACEHOLDER_CARD}
        alt={capa?.alt ?? titulo}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-105"
      />

      {selo ? (
        <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-fundo/90 px-2.5 py-1.5 font-sans text-[10px] leading-none font-bold tracking-[0.14em] text-texto uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-marca" />
          Destaque
        </span>
      ) : null}

      {estado ? (
        <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-fundo/90 px-2.5 py-1.5 font-sans text-xs font-semibold text-texto-2">
          {estado}
        </span>
      ) : null}

      {bike.categoria && !estado ? (
        <span className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-fundo/90 px-2.5 py-1 font-sans text-[11px] font-medium text-texto-2">
          {bike.categoria}
        </span>
      ) : null}
    </>
  )

  const informacoes = (
    <>
      <p className="font-sans text-[13px] leading-none font-medium text-texto-3">
        {bike.marca}
      </p>

      <h3
        className={`mt-2 font-display font-bold leading-tight tracking-[-0.02em] text-white transition-colors group-hover:text-marca-texto ${
          variante === 'lista' ? 'text-xl sm:text-2xl' : 'text-lg'
        }`}
      >
        {bike.modelo}
      </h3>

      <div className="mt-3 mb-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-painel-3/60 px-2.5 py-1 text-xs text-texto-2">
          <Calendar aria-hidden="true" className="size-3.5 text-texto-3" />
          {bike.ano}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-painel-3/60 px-2.5 py-1 text-xs ${
            kmConfirmar ? 'text-texto-3' : 'text-texto-2'
          }`}
        >
          <Gauge aria-hidden="true" className="size-3.5 text-texto-3" />
          {kmTexto}
        </span>
        {combustivel ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-painel-3/60 px-2.5 py-1 text-xs text-texto-2">
            <Fuel aria-hidden="true" className="size-3.5 text-texto-3" />
            {combustivel}
          </span>
        ) : null}
      </div>

      <p className="preco numeros mt-auto whitespace-nowrap pt-2 text-xl leading-none font-extrabold">
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marca px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-marca-viva"
        >
          <IconeWhatsapp className="size-4" />
          Tenho interesse
        </a>
      ) : (
        <Link
          to="/contato"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marca px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-marca-viva"
        >
          <IconeWhatsapp className="size-4" />
          Tenho interesse
        </Link>
      )
    ) : null

  const artigo =
    'card-vitrine group h-full rounded-2xl bg-painel/90 transition-all duration-300 hover:border-marca/50 hover:shadow-xl hover:shadow-marca/10'

  if (variante === 'lista') {
    return (
      <article className={artigo}>
        <Link
          to={`/moto/${bike.slug}`}
          aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
          className="block flex-1 focus-visible:outline-offset-[-4px]"
        >
          <div className="flex h-full flex-col sm:flex-row">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-fundo sm:aspect-auto sm:w-60">
              {foto}
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">{informacoes}</div>
          </div>
        </Link>

        {cta ? <div className="px-4 pb-4 sm:px-5 sm:pb-5">{cta}</div> : null}
      </article>
    )
  }

  return (
    <article className={artigo}>
      <Link
        to={`/moto/${bike.slug}`}
        aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
        className="flex flex-1 flex-col focus-visible:outline-offset-[-4px]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-fundo">{foto}</div>

        <div className="flex flex-1 flex-col p-5">{informacoes}</div>
      </Link>

      {cta ? <div className="px-5 pb-5">{cta}</div> : null}
    </article>
  )
}
