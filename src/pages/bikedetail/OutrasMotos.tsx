import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { BikeCard } from '../../components/motorcycles/BikeCard'
import { Revelar } from '../../components/ui/Revelar'
import { bikeTitle, formatKm } from '../../lib/format'
import { precoDeLista } from './comum'
import type { Motorcycle } from '../../types'

/**
 * ============================================================
 * OUTRAS MOTOS
 * ============================================================
 * No desktop, a mesma vitrine do catálogo em quatro colunas; no
 * celular, a lista compacta de sempre. A página só monta o bloco
 * quando existe pelo menos uma recomendada.
 */
interface OutrasMotosProps {
  recomendadas: Motorcycle[]
}

export function OutrasMotos({ recomendadas }: OutrasMotosProps) {
  if (recomendadas.length === 0) return null

  return (
    <section aria-labelledby="outras-titulo" className="mt-12 mb-16 bg-fundo">
      <div className="container-site px-4 lg:max-w-7xl lg:px-6">
        <div className="grid gap-10 lg:block">
          <div className="flex items-end justify-between gap-6">
            <h2
              id="outras-titulo"
              className="max-w-[12ch] font-display text-[2rem] leading-[1.02] font-bold tracking-[-0.035em] text-texto lg:text-[2.5rem]"
            >
              Outras motos no pátio
            </h2>
            <Link
              to="/estoque"
              className="link-acao inline-flex shrink-0 items-center gap-1.5"
            >
              Ver estoque
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <ul className="space-y-1 lg:hidden">
            {recomendadas.map((outra, indice) => {
              const capa =
                outra.imagens.find((imagem) => /vista lateral/i.test(imagem.alt)) ??
                outra.imagens[0]

              return (
                <Revelar as="li" key={outra.id} atraso={indice * 50}>
                  <Link
                    to={`/moto/${outra.slug}`}
                    className="group -mx-3 grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-3 py-4 transition-colors hover:bg-painel-2/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:gap-x-5 lg:gap-x-8"
                  >
                    <span className="relative row-span-2 w-16 shrink-0 self-center overflow-hidden bg-painel-2 sm:row-span-1 sm:w-20">
                      {capa ? (
                        <img
                          src={capa.src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          width={1200}
                          height={1600}
                          className="aspect-[3/4] size-full object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-105"
                        />
                      ) : null}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate font-display text-[1.125rem] font-semibold text-texto sm:text-xl">
                        {bikeTitle(outra)}
                      </span>
                      <span className="numeros mt-1 block truncate text-sm text-texto-3">
                        {outra.ano}
                        {outra.quilometragem != null ? ` · ${formatKm(outra.quilometragem)}` : ''}
                      </span>
                    </span>

                    <span className="numeros col-start-2 text-base font-semibold text-texto sm:col-start-3 sm:row-start-1 sm:text-right sm:text-[1.0625rem]">
                      {precoDeLista(outra.preco)}
                    </span>
                  </Link>
                </Revelar>
              )
            })}
          </ul>

          <div className="mt-8 hidden lg:grid lg:grid-cols-4 lg:gap-6">
            {recomendadas.slice(0, 4).map((outra, indice) => (
              <Revelar key={outra.id} atraso={indice * 60} className="h-full">
                <BikeCard bike={outra} />
              </Revelar>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
