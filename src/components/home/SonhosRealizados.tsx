import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { EntregaRealizada } from '../../data/entregas'

interface SonhosRealizadosProps {
  entregas: EntregaRealizada[]
}

export function SonhosRealizados({ entregas }: SonhosRealizadosProps) {
  // Imagens de referência ficam fora da página pública até serem trocadas
  // por registros reais com autorização de uso.
  const publicadas = entregas.filter((entrega) => !entrega.previaTemporaria)
  const principal = publicadas[0]
  const outras = publicadas.slice(1, 4)

  return (
    <section
      id="sonhos"
      aria-labelledby="sonhos-titulo"
      className="bg-painel py-14 sm:py-20 lg:py-24"
    >
      <div className="container-site">
        <header className="mb-8 grid gap-5 sm:mb-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.55fr)] lg:items-end lg:gap-12">
          <h2
            id="sonhos-titulo"
            className="titulo max-w-[13ch] text-4xl text-texto sm:text-6xl"
          >
            Sonhos realizados
          </h2>
          <p className="corpo max-w-[38ch] text-texto-2 lg:justify-self-end">
            Registros de clientes que levaram uma moto da DG Motos para casa.
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
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/75 px-5 py-4 text-sm text-white sm:px-7 sm:py-5">
                  <span className="block font-display text-xl font-semibold sm:text-2xl">
                    {principal.moto}
                  </span>
                  {principal.entregueEm ? (
                    <span className="mt-1 block text-sm text-white/80">{principal.entregueEm}</span>
                  ) : null}
                </figcaption>
              </figure>

              <div className="flex flex-col justify-between gap-8 p-5 sm:p-8 lg:p-10">
                <div>
                  {principal.depoimento ? (
                    <blockquote className="font-display text-2xl leading-snug font-semibold tracking-[-0.02em] text-texto sm:text-3xl">
                      “{principal.depoimento}”
                    </blockquote>
                  ) : (
                    <p className="corpo text-texto-2">
                      Uma entrega registrada com autorização do cliente.
                    </p>
                  )}
                  {principal.nomeCliente ? (
                    <p className="mt-5 text-sm text-texto-2">{principal.nomeCliente}</p>
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
                        {entrega.nomeCliente ? (
                          <p className="mt-1 text-sm text-texto-2">{entrega.nomeCliente}</p>
                        ) : null}
                        {entrega.depoimento ? (
                          <p className="mt-3 text-sm leading-relaxed text-texto-2">
                            “{entrega.depoimento}”
                          </p>
                        ) : null}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <div className="grid overflow-hidden bg-fundo sm:grid-cols-[minmax(12rem,0.68fr)_minmax(0,1.32fr)]">
            <div className="relative flex min-h-52 items-center justify-center bg-painel-2 p-8 sm:min-h-72">
              <span className="absolute inset-y-8 left-0 w-1 bg-marca" aria-hidden="true" />
              <img
                src="/logo.webp"
                alt=""
                aria-hidden="true"
                width={160}
                height={160}
                className="w-28 object-contain opacity-90 sm:w-36"
              />
            </div>
            <div className="flex flex-col items-start justify-between gap-8 p-6 sm:p-9 lg:p-12">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-marca-texto uppercase">
                  Arquivo de entregas
                </p>
                <h3 className="titulo mt-4 max-w-[17ch] text-2xl text-texto sm:text-3xl">
                  Momentos reais, registrados com autorização.
                </h3>
                <p className="corpo mt-4 max-w-2xl text-texto-2">
                  Ainda não há fotos de entrega autorizadas para exibir. Quando houver, cada momento será publicado com o contexto confirmado.
                </p>
              </div>
              <Link to="/estoque" className="btn btn-secondary min-h-12 w-fit gap-2 px-5">
                Ver motos disponíveis
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
