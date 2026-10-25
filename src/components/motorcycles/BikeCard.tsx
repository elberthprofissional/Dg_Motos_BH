import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
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

  /* ============================================================
     VITRINE (variante 'grade')

     A hierarquia é a da placa de vidraça: o nome da moto em cima à
     esquerda, o preço em cima à direita — são as duas coisas que o
     cliente cruza antes de tudo. O resto é uma linha quieta de
     ficha. Sem ícones nos metadados: dado com ponto corrido lê-se
     de relance; ícone aí é ruído de planilha.
     ============================================================ */

  const foto = (
    <div className="relative h-48 w-full overflow-hidden rounded-t-2xl bg-painel-2">
      {capa ? (
        <img
          src={capa.src}
          alt={capa.alt || titulo}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          width={1200}
          height={1600}
          className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
        />
      ) : (
        <p className="px-5 text-center text-sm text-texto-2">Foto ainda não disponível</p>
      )}
      {desconto != null ? (
        <span className="absolute top-3 left-3 flex items-center gap-2 bg-marca px-2.5 py-1.5 font-display text-xs font-bold tracking-[0.04em] text-white uppercase">
          <span className="sr-only">Promoção: </span>
          Oferta · −{desconto}%
        </span>
      ) : null}
      {estado ? (
        <span className="absolute bottom-3 left-3 bg-fundo/85 px-2.5 py-1.5 font-sans text-xs font-semibold text-texto">
          {estado}
        </span>
      ) : null}
    </div>
  )

  /* ============================================================
     A FICHA

     Nome, ficha corrida e preço numa coluna só, com altura curta:
     o card é uma peça de catálogo, não um pôster. O preço vermelho
     fecha o rodapé e o WhatsApp fica discreto ao lado, sem competir
     com ele.
     ============================================================ */
  const ficha = (
    <div className="flex flex-1 flex-col p-4">
      <h3 className="truncate font-display text-sm leading-tight font-bold text-texto lg:text-base">
        {titulo}
      </h3>

      <p className="numeros mt-1 truncate text-xs leading-snug text-texto-3">
        {[
          bike.ano,
          bike.categoria,
          bike.quilometragem != null ? formatKm(bike.quilometragem) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      {precoRequerConfirmacao(bike.preco) ? (
        <p className="mt-2 text-[11px] leading-snug text-texto-2">
          Valor cadastrado. Confirme com a loja antes de negociar.
        </p>
      ) : null}

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="min-w-0">
          {desconto != null ? (
            <p className="numeros text-[11px] leading-none text-texto-3 line-through">
              de {formatPrice(bike.precoAntes ?? bike.preco)}
            </p>
          ) : null}
          <p className="numeros mt-1 font-display text-lg leading-none font-black tracking-[-0.01em] text-marca-viva">
            {formatPrice(bike.preco)}
          </p>
        </div>

        {/* A única ação do cartão. O fundo transparente e o contorno
            fino deixam o preço ser o que chama atenção aqui. */}
        {disponivel ? (
          waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Falar no WhatsApp sobre a ${titulo} ${bike.ano}`}
              className="relative z-20 grid size-11 shrink-0 place-items-center rounded-full border border-borda-forte text-texto-2 transition-colors hover:border-texto-3 hover:bg-painel-3 hover:text-texto"
            >
              <IconeWhatsapp className="size-[18px]" />
            </a>
          ) : (
            <Link
              to="/contato"
              aria-label={`Falar com a loja sobre a ${titulo} ${bike.ano}`}
              className="relative z-20 grid size-11 shrink-0 place-items-center rounded-full border border-borda-forte text-texto-2 transition-colors hover:border-texto-3 hover:bg-painel-3 hover:text-texto"
            >
              <IconeWhatsapp className="size-[18px]" />
            </Link>
          )
        ) : null}
      </div>
    </div>
  )

  // O cartão inteiro é o link da ficha; o “Ver detalhes” de chapa
  // dupla saiu — era um segundo botão para a mesma página.
  const artigo =
    'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-borda bg-painel/70 backdrop-blur-md transition-colors hover:border-borda-forte'


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
      {/* Camada de clique: o cartão todo abre a ficha. Fica abaixo do
          conteúdo mas acima do fundo, e o botão do zap sobe com z-10. */}
      <Link
        to={`/moto/${bike.slug}`}
        aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-marca"
      />
      {foto}
      {ficha}
    </article>
  )
}
