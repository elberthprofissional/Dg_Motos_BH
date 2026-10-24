import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { EntregaPublicada } from '../../data/entregas'

interface SonhosRealizadosProps {
  entregas: EntregaPublicada[]
}

function dataDaEntrega(valor?: string): string | null {
  if (!valor) return null
  const data = new Date(`${valor}T12:00:00`)
  if (Number.isNaN(data.valueOf())) return null
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(data)
}

export function SonhosRealizados({ entregas }: SonhosRealizadosProps) {
  // A vitrine pública só existe quando há ao menos uma entrega publicada.
  // Rascunhos e registros privados já são filtrados pela consulta de origem.
  if (entregas.length === 0) return null

  const principal = entregas[0]
  const outras = entregas.slice(1)

  return (
    <section
      id="sonhos"
      aria-labelledby="sonhos-titulo"
      className="bg-painel py-14 sm:py-20 lg:py-24"
    >
      <div className="container-site">
        <header className="mb-8 grid gap-5 sm:mb-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.55fr)] lg:items-end lg:gap-12">
          <h2 id="sonhos-titulo" className="titulo max-w-[13ch] text-4xl text-texto sm:text-6xl">
            Sonhos realizados
          </h2>
          <p className="corpo max-w-[38ch] text-texto-2 lg:justify-self-end">
            Entregas da DG Motos.
          </p>
        </header>

        {principal ? (
          <>
            <article className="grid bg-fundo lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
              <figure className="relative aspect-[4/3] overflow-hidden bg-painel-2 lg:aspect-auto lg:min-h-[34rem]">
                <img
                  src={principal.imagem}
                  alt={`Entrega da ${principal.moto} pela DG Motos`}
                  className="absolute inset-0 size-full object-cover"
                  width={1200}
                  height={900}
                  fetchPriority="high"
                  decoding="async"
                />
                {dataDaEntrega(principal.entregueEm) ? (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-black/75 px-5 py-4 text-sm text-white sm:px-7 sm:py-5">
                    <span className="block font-display text-xl font-semibold sm:text-2xl">
                      {principal.moto}
                    </span>
                    <span className="mt-1 block text-sm text-white/80">
                      {dataDaEntrega(principal.entregueEm)}
                    </span>
                  </figcaption>
                ) : null}
              </figure>

              <div className="flex flex-col justify-between gap-8 p-5 sm:p-8 lg:p-10">
                <div>
                  <h3 className="font-display text-2xl leading-snug font-semibold tracking-[-0.02em] text-texto sm:text-3xl">
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
              <ul className="mt-6 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {outras.map((entrega) => (
                  <li key={entrega.id}>
                    <article className="h-full bg-fundo">
                      <img
                        src={entrega.imagem}
                        alt={`Entrega da ${entrega.moto} pela DG Motos`}
                        className="aspect-[4/3] w-full object-cover"
                        width={960}
                        height={720}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="py-4">
                        <h3 className="font-display text-xl font-semibold text-texto">
                          {entrega.moto}
                        </h3>
                        {dataDaEntrega(entrega.entregueEm) ? (
                          <p className="mt-1 text-sm text-texto-3">{dataDaEntrega(entrega.entregueEm)}</p>
                        ) : null}
                        {entrega.nomeCliente ? (
                          <p className="mt-1 text-sm text-texto-2">{entrega.nomeCliente}</p>
                        ) : null}
                        {entrega.depoimento ? (
                          <p className="mt-3 text-sm leading-relaxed text-texto-2">
                            {entrega.depoimento}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  )
}
