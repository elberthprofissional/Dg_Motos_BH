import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, Gauge } from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { bikeTitle, buildBikeMessage, descontoPercentual, formatKm, formatPrice, precoRequerConfirmacao } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

interface BikeCardProps {
  bike: Motorcycle
  priority?: boolean
  /** 'lista' mostra a moto emfileirada — uma abaixo da outra, no
   *  catálogo do celular (Estoque e Home). 'grade' é a vitrine. */
  variante?: 'grade' | 'lista'
}

const ESTADO: Partial<Record<MotorcycleStatus, string>> = {
  indisponivel: 'Indisponível',
  vendida: 'Vendida',
}

export function BikeCard({ bike, priority = false, variante = 'grade' }: BikeCardProps) {
  const titulo = bikeTitle(bike)
  const lateral = bike.imagens.find((imagem) => /vista lateral/i.test(imagem.alt))
  const capa = lateral ?? bike.imagens[0]
  const estado = ESTADO[bike.status]
  const waLink = useWhatsappLink(buildBikeMessage(bike.marca, bike.modelo, bike.ano))
  const desconto = descontoPercentual(bike)
  const disponivel = bike.status === 'disponivel'

  const foto = (
    <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-painel-2">
      {capa ? (
        <img
          src={capa.src}
          alt={capa.alt || titulo}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          width={1200}
          height={1600}
          className={`size-full transition-transform duration-300 motion-safe:group-hover:scale-[1.02] ${lateral ? 'object-cover' : 'object-contain p-3 sm:p-4'}`}
        />
      ) : (
        <p className="px-5 text-center text-sm text-texto-2">Foto ainda não disponível</p>
      )}
      {desconto != null ? (
        <span className="absolute top-3 left-3 grid min-h-8 place-items-center bg-marca px-2.5 font-sans text-xs font-bold text-white">
          <span className="sr-only">Promoção: </span>
          -{desconto}%
        </span>
      ) : null}
    </div>
  )

  // Dados e preço ficam em linhas próprias para modelos longos não
  // comprimirem o valor em telas menores.
  const preco = (
      <div className="mt-4">
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
      {precoRequerConfirmacao(bike.preco) ? (
        <p className="mt-2 text-xs leading-relaxed text-texto-2">
          Valor cadastrado. Confirme com a loja antes de negociar.
        </p>
      ) : null}
    </div>
  )

  const informacoes = (
    <>
      <h3 className="font-display text-lg leading-tight font-semibold tracking-[-0.02em] text-texto">
        {titulo}
      </h3>

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
        <span>{bike.categoria}</span>
        {estado ? <span>{estado}</span> : null}
      </p>
      {preco}
    </>
  )

  // Ações permanecem visíveis em qualquer tela; nenhuma depende de hover.
  const acoesMobile = (
    <div
      className={`grid gap-2 px-4 pt-2 pb-4 sm:px-5 ${disponivel ? 'grid-cols-2' : 'grid-cols-1'}`}
    >
      <Link
        to={`/moto/${bike.slug}`}
        aria-label={`Ver os detalhes de ${titulo} ${bike.ano}`}
        className={`grid min-h-11 place-items-center bg-white py-2.5 font-sans text-[13px] font-bold text-black transition-colors hover:bg-neutral-200 ${
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
          className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-borda-forte py-2.5 font-sans text-[13px] font-semibold text-texto-2 transition-colors hover:border-marca hover:text-marca-texto"
        >
          <IconeWhatsapp className="size-4 shrink-0" />
          WhatsApp
        </a>
      ) : null}

      {disponivel && !waLink ? (
        <Link
          to="/contato"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-borda-forte py-2.5 font-sans text-[13px] font-semibold text-texto-2 transition-colors hover:border-marca hover:text-marca-texto"
        >
          <IconeWhatsapp className="size-4 shrink-0" />
          Falar com a loja
        </Link>
      ) : null}
    </div>
  )

  const artigo =
    'group flex h-full flex-col overflow-hidden bg-painel transition-colors duration-200 hover:bg-painel-2'

  if (variante === 'lista') {
    /* Linha de catálogo compacta: foto miúda, ficha de uma linha e
       preço à direita. A linha inteira é um único toque pro detalhe
       — os botões de ação moram na ficha, não aqui. */
    return (
      <li className="transition-colors hover:bg-painel-2">
        <Link
          to={`/moto/${bike.slug}`}
          aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
          className={`flex items-center gap-3 px-2 py-2.5 ${disponivel ? '' : 'opacity-55'}`}
        >
          <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden bg-painel">
            {capa ? (
              <img
                src={capa.src}
                alt={capa.alt || titulo}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                decoding="async"
                width={1200}
                height={1600}
                className="size-full object-contain p-1"
              />
            ) : (
              <span className="sr-only">Foto ainda não disponível</span>
            )}
            {desconto != null ? (
              <span className="absolute top-1 left-1 bg-marca px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                <span className="sr-only">Promoção: </span>
                -{desconto}%
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-texto">{titulo}</h3>
            <p className="mt-0.5 text-xs text-texto-3">
              <span className="numeros">{bike.ano}</span>
              {bike.quilometragem != null && (
                <>
                  {' · '}
                  <span className="numeros">{formatKm(bike.quilometragem)}</span>
                </>
              )}
              {estado ? ` · ${estado}` : ''}
            </p>
          </div>

          <div className="shrink-0 text-right">
            {desconto != null ? (
              <>
                <p className="numeros text-[11px] leading-none text-texto-3 line-through">
                  {formatPrice(bike.precoAntes ?? bike.preco)}
                </p>
                <p className="numeros mt-1 text-base leading-none font-semibold text-marca-texto">
                  {formatPrice(bike.preco)}
                </p>
              </>
            ) : (
              <p className="numeros text-base leading-none font-semibold text-texto">
                {formatPrice(bike.preco)}
              </p>
            )}
            {precoRequerConfirmacao(bike.preco) ? (
              <p className="mt-2 max-w-36 text-left text-[11px] leading-snug text-texto-2">
                Valor cadastrado. Confirme com a loja.
              </p>
            ) : null}
          </div>

          <ChevronRight className="size-4 shrink-0 text-texto-3" aria-hidden="true" />
        </Link>
      </li>
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
