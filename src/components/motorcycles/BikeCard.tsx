import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import { buildBikeMessage, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'

interface BikeCardProps {
  bike: Motorcycle
  priority?: boolean
}

/**
 * Selo de status na foto — só para os estados negativos.
 *
 * "Disponível" não ganha selo: o card só existe pra vender, e o selo
 * verde em toda foto virava ruído. "Indisponível"/"Vendida" ficam em
 * grafite apagado com fundo sólido — a moto ainda aparece, mas avisa
 * que não está à venda sem competir com as que estão.
 */
const SELO: Partial<Record<MotorcycleStatus, { texto: string; classe: string }>> = {
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
  const selo = SELO[bike.status]
  const whats = useWhatsappLink(
    buildBikeMessage(bike.marca, bike.modelo, bike.ano),
  )

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-line bg-night-900 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-line-forte hover:shadow-[0_24px_48px_-28px_rgba(0,0,0,0.9)]">
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
        {selo && (
          <span
            className={`pointer-events-none absolute top-3 left-3 px-2.5 py-1 font-display text-[10px] font-semibold tracking-[0.16em] uppercase ${selo.classe}`}
          >
            {selo.texto}
          </span>
        )}

        {/* Faixa de ações no pé da foto. No Android/tela de toque ela
            fica sempre visível (não existe hover). Em desktop
            (`hover: hover`) some por padrão e aparece quando o mouse
            entra no card — `invisible` também tira os botões do clique
            e da navegação por teclado enquanto escondida. Só os
            botões recebem clique (pointer-events-auto); o resto do véu
            deixa o clique atravessar pro Link da foto. Fica dentro da
            imagem, acima do corpo do card — a marca nunca é coberta. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night-950/95 via-night-950/55 to-transparent p-3 opacity-100 transition-all duration-300 sm:p-3.5 [@media(hover:hover)]:invisible [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:visible [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex gap-1.5">
            <Link
              to={`/moto/${bike.slug}`}
              className="pointer-events-auto inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap border border-line-forte bg-night-950/85 px-2.5 py-2 font-display text-[9px] font-semibold tracking-[0.1em] text-paper uppercase backdrop-blur-sm transition-colors duration-200 hover:border-brand-500 hover:text-brand-500 sm:px-3 sm:text-[10px] sm:tracking-[0.12em]"
            >
              Ver detalhes
              <span aria-hidden="true">→</span>
            </Link>
            {whats ? (
              <a
                href={whats}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap bg-brand-500 px-2.5 py-2 font-display text-[9px] font-semibold tracking-[0.1em] text-white uppercase transition-colors duration-200 hover:bg-brand-600 sm:px-3 sm:text-[10px] sm:tracking-[0.12em]"
              >
                <MessageCircle
                  aria-hidden="true"
                  className="hidden size-3.5 min-[400px]:inline"
                />
                Entrar em contato
              </a>
            ) : (
              <Link
                to="/contato"
                className="pointer-events-auto inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap bg-brand-500 px-2.5 py-2 font-display text-[9px] font-semibold tracking-[0.1em] text-white uppercase transition-colors duration-200 hover:bg-brand-600 sm:px-3 sm:text-[10px] sm:tracking-[0.12em]"
              >
                <MessageCircle
                  aria-hidden="true"
                  className="hidden size-3.5 min-[400px]:inline"
                />
                Entrar em contato
              </Link>
            )}
          </div>
        </div>
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
