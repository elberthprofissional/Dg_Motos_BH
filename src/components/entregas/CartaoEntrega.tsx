import { Images } from 'lucide-react'
import type { EntregaPublicada } from '../../data/entregas'
import { mesDaEntrega } from '../../lib/format'

interface CartaoEntregaProps {
  entrega: EntregaPublicada
}

/**
 * ============================================================
 * CARTÃO DA GALERIA
 * ============================================================
 * Recorte 4:5 — proporção de post, não de anúncio de moto. Aqui a foto
 * é a lembrança da entrega, nunca o produto à venda: sem modelo, sem
 * nome de cliente e sem legenda. Só a imagem e o mês, quando existir.
 */
export function CartaoEntrega({ entrega }: CartaoEntregaProps) {
  const mes = mesDaEntrega(entrega.entregueEm)

  return (
    <article className="group h-full bg-fundo">
      <span className="relative block aspect-[4/5] w-full overflow-hidden bg-painel-2">
        <img
          src={entrega.imagens[0]}
          alt={mes ? `Entrega realizada pela DG Motos em ${mes}` : 'Entrega realizada pela DG Motos'}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          width={960}
          height={1200}
          loading="lazy"
          decoding="async"
        />
        {entrega.imagens.length > 1 ? (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1.5 bg-black/70 px-2 py-1 text-[11px] text-white">
            <Images className="size-3" aria-hidden="true" />
            {entrega.imagens.length}
          </span>
        ) : null}
      </span>

      {mes ? (
        <span className="block py-3 text-[11px] font-semibold tracking-[0.12em] text-texto-3 uppercase">
          {mes}
        </span>
      ) : null}
    </article>
  )
}
