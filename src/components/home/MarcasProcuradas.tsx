import { Link } from 'react-router-dom'
import { logoDaMarca } from '../../lib/marcas'

const MARCAS_COM_LOGO = new Set([
  'BMW',
  'Dafra',
  'Ducati',
  'Harley-Davidson',
  'Honda',
  'Kawasaki',
  'KTM',
  'Royal Enfield',
  'Shineray',
  'Suzuki',
  'Yamaha',
])

interface MarcasProcuradasProps {
  marcas: string[]
}

export function MarcasNoPatio({ marcas }: MarcasProcuradasProps) {
  if (marcas.length === 0) return null

  return (
    <section
      aria-labelledby="marcas-titulo"
      className="border-y border-borda bg-painel"
    >
      <div className="container-site grid gap-6 py-8 sm:py-9 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-center lg:gap-10">
        <h2
          id="marcas-titulo"
          className="font-display text-lg font-semibold text-texto"
        >
          Marcas no pátio
        </h2>
        <ul className="flex flex-wrap items-center gap-x-7 gap-y-5 sm:gap-x-10">
          {marcas.map((marca) => (
            <li key={marca}>
              <Link
                to={`/estoque?marca=${encodeURIComponent(marca)}`}
                aria-label={`Ver motos ${marca} no estoque`}
                className="inline-flex min-h-11 min-w-16 items-center justify-center opacity-80 transition-opacity hover:opacity-100 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foco"
              >
                {MARCAS_COM_LOGO.has(marca) ? (
                  <img
                    src={logoDaMarca(marca)}
                    alt={marca}
                    className="h-7 max-w-28 object-contain sm:h-8"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="font-display text-sm font-semibold tracking-[0.06em] text-texto-2">
                    {marca}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
