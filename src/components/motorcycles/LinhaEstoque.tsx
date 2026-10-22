import { Link } from 'react-router-dom'
import type { Motorcycle } from '../../types'
import { formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface LinhaEstoqueProps {
  bike: Motorcycle
}

/**
 * Linha do índice do pátio.
 *
 * O estoque é uma lista, não uma grade: cada moto é uma linha com
 * foto à esquerda, identificação no meio e preço à direita — o
 * formato de um livro de estoque de papel.
 *
 * Sem filete separando as linhas: o espaço entre elas é a
 * separação. Sem borda, sem cartão, sem botão — a linha inteira é o
 * link, e o que muda no hover é só o nome da moto.
 */
export function LinhaEstoque({ bike }: LinhaEstoqueProps) {
  const titulo = `${bike.marca} ${bike.modelo}`
  const capa = bike.imagens[0]

  return (
    <li className="relative">
      <Link
        to={`/moto/${bike.slug}`}
        className="group flex items-center gap-5 py-7 sm:gap-8 sm:py-9"
        aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
      >
        <img
          src={capa?.src ?? PLACEHOLDER_CARD}
          alt={capa?.alt ?? titulo}
          loading="lazy"
          decoding="async"
          width={960}
          height={1200}
          className="h-28 w-[5.25rem] shrink-0 object-cover sm:h-36 sm:w-28"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm text-texto-3">{bike.marca}</p>
          <h2 className="titulo mt-1 text-xl text-texto transition-colors group-hover:text-marca-texto sm:text-2xl">
            {bike.modelo}{' '}
            <span className="font-display text-texto-3 numeros">{bike.ano}</span>
          </h2>
          <p className="pequeno mt-2 text-texto-2">
            {bike.cilindrada ? `${bike.cilindrada} cc · ` : ''}
            {bike.quilometragem ? formatKm(bike.quilometragem) : 'Km a confirmar'}
          </p>
        </div>

        <p className="preco shrink-0 text-xl text-texto sm:text-2xl">
          {formatPrice(bike.preco)}
        </p>
      </Link>
    </li>
  )
}
