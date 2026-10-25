import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { EntregaPublicada } from '../../data/entregas'
import { mesDaEntrega } from '../../lib/format'
import { CarrosselFotos } from '../entregas/CarrosselFotos'
import { CartaoEntrega } from '../entregas/CartaoEntrega'

interface SonhosRealizadosProps {
  entregas: EntregaPublicada[]
}

/**
 * Quantos posts cabem na Home. O primeiro ganha destaque; o resto
 * desce em grade. Sem teto, em um ano a seção vira uma parede de
 * entregas e empurra a vitrine de motos para fora da primeira tela.
 */
export const LIMITE_MURAL = 6

/**
 * ============================================================
 * SONHOS REALIZADOS — o mural da Home
 * ============================================================
 * Uma postagem, não um catálogo: foto 4:5, nome e a frase da entrega.
 * O primeiro post ocupa a seção inteira (carrossel grande ao lado do
 * texto) e os demais descem em grade, como um perfil. Quem quiser o
 * mural completo segue para /sonhos.
 */
export function SonhosRealizados({ entregas }: SonhosRealizadosProps) {
  // A vitrine pública só existe quando há ao menos uma entrega publicada.
  // Rascunhos e registros privados já são filtrados pela consulta de origem.
  if (entregas.length === 0) return null

  const visiveis = entregas.slice(0, LIMITE_MURAL)
  const principal = visiveis[0]
  const outras = visiveis.slice(1)
  const temMais = entregas.length > LIMITE_MURAL
  const mes = mesDaEntrega(principal.entregueEm)

  return (
    <section
      id="sonhos"
      aria-labelledby="sonhos-titulo"
      className="bg-painel py-10 sm:py-12 lg:py-14"
    >
      <div className="container-site">
        <header className="mb-8 grid gap-5 sm:mb-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.55fr)] lg:items-end lg:gap-12">
          <h2 id="sonhos-titulo" className="titulo max-w-[13ch] text-4xl text-texto sm:text-6xl">
            Sonhos realizados
          </h2>
          <div className="lg:justify-self-end">
            <p className="corpo max-w-[34ch] text-texto-2">Entregas da DG Motos.</p>
            {temMais ? (
              <Link to="/sonhos" className="btn btn-secondary mt-4 min-h-11 w-fit gap-2 px-4 text-sm">
                Ver todas as entregas
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </header>

        <article className="grid bg-fundo lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <figure className="relative aspect-[4/5] overflow-hidden bg-painel-2 sm:aspect-[4/3] lg:aspect-auto lg:min-h-[30rem]">
            <CarrosselFotos imagens={principal.imagens} moto={principal.moto} prioridade />
          </figure>

          <div className="flex flex-col justify-between gap-8 p-5 sm:p-8 lg:p-10">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-marca uppercase">
                {mes ? `Entrega · ${mes}` : 'Entrega realizada'}
              </p>
              <h3 className="mt-3 font-display text-2xl leading-snug font-semibold tracking-[-0.02em] text-texto sm:text-3xl">
                {principal.moto}
              </h3>
              {principal.nomeCliente ? (
                <p className="mt-3 text-sm text-texto-2">{principal.nomeCliente}</p>
              ) : null}
              {principal.depoimento ? (
                <blockquote className="mt-6 border-l border-marca pl-4 text-base leading-relaxed text-texto-2 sm:mt-8 sm:pl-5 sm:text-lg">
                  {principal.depoimento}
                </blockquote>
              ) : null}
            </div>
            <Link to="/estoque" className="btn btn-secondary min-h-12 w-fit gap-2 px-5">
              Ver motos disponíveis
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </article>

        {outras.length > 0 ? (
          <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-8 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {outras.map((entrega) => (
              <li key={entrega.id}>
                <CartaoEntrega entrega={entrega} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
