import { Images } from 'lucide-react'
import type { EntregaPublicada } from '../../data/entregas'
import { mesDaEntrega } from '../../lib/format'

interface CartaoEntregaProps {
  entrega: EntregaPublicada
  /** Sem `onVer` o cartão é só imagem e texto (a grade da Home). */
  onVer?: (entrega: EntregaPublicada) => void
}

/**
 * ============================================================
 * CARTÃO DE POST DO MURAL
 * ============================================================
 * Recorte 4:5 — proporção de post, não de anúncio de moto. É o que
 * separa "Sonhos realizados" da vitrine: aqui a foto é a lembrança da
 * entrega, não o produto à venda.
 */
export function CartaoEntrega({ entrega, onVer }: CartaoEntregaProps) {
  const mes = mesDaEntrega(entrega.entregueEm)
  // Na grade da Home o cartão é conteúdo: o título é título de verdade.
  // No mural com leitor ele vira botão, e botão só aceita conteúdo de
  // frase — daí o span.
  const Titulo = onVer ? 'span' : 'h3'

  const conteudo = (
    <>
      <span className="relative block aspect-[4/5] w-full overflow-hidden bg-painel-2">
        <img
          src={entrega.imagens[0]}
          alt={`Entrega da ${entrega.moto} pela DG Motos`}
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

      <span className="block py-4">
        {mes ? (
          <span className="block text-[11px] font-semibold tracking-[0.12em] text-texto-3 uppercase">
            {mes}
          </span>
        ) : null}
        <Titulo className="mt-1.5 block font-display text-xl font-semibold text-texto">
          {entrega.moto}
        </Titulo>
        {entrega.nomeCliente ? (
          <span className="mt-1 block text-sm text-texto-2">{entrega.nomeCliente}</span>
        ) : null}
        {entrega.depoimento ? (
          <span className="mt-3 line-clamp-3 block text-sm leading-relaxed text-texto-2">
            {entrega.depoimento}
          </span>
        ) : null}
      </span>
    </>
  )

  if (!onVer) {
    return <article className="group h-full bg-fundo">{conteudo}</article>
  }

  return (
    <button
      type="button"
      onClick={() => onVer(entrega)}
      className="group block h-full w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca"
    >
      {conteudo}
    </button>
  )
}
