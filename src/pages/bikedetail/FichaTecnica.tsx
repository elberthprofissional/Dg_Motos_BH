import { ChevronDown } from 'lucide-react'
import { Revelar } from '../../components/ui/Revelar'
import type { GrupoFicha } from '../../data/fichasModelo'
import type { MotorcycleSpec } from '../../types'

/**
 * ============================================================
 * FICHA TÉCNICA — leitura rápida
 * ============================================================
 * Primeiro o que decide a visita: ano, km, cilindrada e situação numa
 * faixa de quatro células. Depois, as características escritas pela
 * loja, em etiquetas. A lista técnica completa da linha fica guardada
 * num acordeão — quem quer detalhe abre, quem não quer não tropeça.
 */
interface FichaTecnicaProps {
  titulo: string
  ano: number
  resumo: MotorcycleSpec[]
  caracteristicas: MotorcycleSpec[]
  gruposReferencia: GrupoFicha[]
  notaFicha: string
}

function itensValidos(itens: MotorcycleSpec[]): MotorcycleSpec[] {
  return itens.filter((item) => item?.label?.trim() && item?.value?.trim())
}

export function FichaTecnica({
  titulo,
  ano,
  resumo,
  caracteristicas,
  gruposReferencia,
  notaFicha,
}: FichaTecnicaProps) {
  const celulas = itensValidos(resumo)
  const etiquetas = itensValidos(caracteristicas)
  const grupos = gruposReferencia
    .map((grupo) => ({ ...grupo, itens: itensValidos(grupo.itens) }))
    .filter((grupo) => grupo.itens.length > 0)

  return (
    <section
      id="ficha"
      aria-labelledby="ficha-titulo"
      className="scroll-mt-20 border-t-2 border-marca bg-painel text-texto sm:scroll-mt-[4.25rem] lg:mt-12"
    >
      <div className="container-site px-4 py-16 lg:max-w-7xl lg:px-6 lg:py-20">
        <Revelar>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2
              id="ficha-titulo"
              className="font-display text-[3rem] leading-none font-bold tracking-[-0.04em]"
            >
              Ficha técnica
            </h2>
            <p className="numeros pb-1 text-sm font-semibold text-texto-3">
              {titulo} · {ano}
            </p>
          </div>
        </Revelar>

        {celulas.length > 0 ? (
          <Revelar>
            <dl className="mt-8 grid grid-cols-2 overflow-hidden border border-borda sm:grid-cols-4">
              {celulas.map((item) => (
                <div key={item.label} className="border-borda px-4 py-4 odd:border-r sm:border-r sm:last:border-r-0">
                  <dt className="text-xs font-medium tracking-wide text-texto-3 uppercase">
                    {item.label}
                  </dt>
                  <dd className="numeros mt-2 text-lg leading-none font-semibold text-texto">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Revelar>
        ) : null}

        {etiquetas.length > 0 ? (
          <Revelar className="mt-10">
            <h3 className="text-sm font-semibold tracking-wide text-texto-2 uppercase">
              Características
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {etiquetas.map((item) => (
                <li
                  key={item.label}
                  className="inline-flex items-baseline gap-1.5 rounded-full border border-borda bg-painel-2 px-3.5 py-1.5 text-sm"
                >
                  <span className="text-texto-3">{item.label}</span>
                  <span className="font-medium text-texto">{item.value}</span>
                </li>
              ))}
            </ul>
          </Revelar>
        ) : null}

        {grupos.length > 0 ? (
          <Revelar className="mt-10">
            <details className="group border-t border-borda pt-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-sm font-semibold text-texto-2 transition-colors hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco [&::-webkit-details-marker]:hidden">
                Ver especificações completas da linha
                <ChevronDown
                  className="size-4 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>

              <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {grupos.map((grupo) => (
                  <div key={grupo.titulo}>
                    <h3 className="font-display text-[1.0625rem] font-bold text-texto">
                      {grupo.titulo}
                    </h3>
                    <dl className="mt-3 divide-y divide-borda">
                      {grupo.itens.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-baseline justify-between gap-6 py-2.5"
                        >
                          <dt className="text-sm leading-snug text-texto-3">{item.label}</dt>
                          <dd className="max-w-[60%] text-right text-sm leading-snug font-medium text-texto">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </details>
          </Revelar>
        ) : null}

        <Revelar>
          <p className="mt-12 max-w-[80ch] border-t-2 border-marca/40 pt-5 text-sm leading-relaxed text-texto-3">
            {notaFicha}
          </p>
        </Revelar>
      </div>
    </section>
  )
}
