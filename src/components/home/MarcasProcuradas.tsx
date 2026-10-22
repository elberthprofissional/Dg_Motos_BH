import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { logoDaMarca } from '../../lib/marcas'

const MARCAS = [
  'BMW',
  'Dafra',
  'Ducati',
  'Gilera',
  'Harley-Davidson',
  'Honda',
  'Kawasaki',
  'KTM',
  'Motomel',
  'Royal Enfield',
  'Shineray',
  'Suzuki',
  'TVS',
  'Yamaha',
  'Zanella',
] as const

export function MarcasProcuradas() {
  return (
    <section
      data-marcas
      aria-labelledby="marcas-titulo"
      className="border-t border-borda bg-fundo"
    >
      <div className="container-site py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)] lg:items-center lg:gap-16">
          <div>
            <h2 id="marcas-titulo" className="titulo text-texto">
              Marcas mais procuradas
            </h2>
            <p className="corpo mt-4 max-w-[34ch] text-texto-2">
              Consulte a disponibilidade de cada marca no estoque da loja.
            </p>
            <Link
              to="/estoque"
              className="mt-6 inline-flex items-center gap-2 py-1 text-sm font-semibold text-marca-texto transition-colors hover:text-texto"
            >
              Ver estoque
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-8">
            {MARCAS.map((marca) => (
              <li key={marca} className="flex h-12 w-28 items-center justify-center">
                <img
                  data-marca-logo
                  src={logoDaMarca(marca)}
                  alt={`Logo ${marca}`}
                  className="h-auto max-h-9 w-full max-w-[120px] object-contain brightness-0 invert opacity-70 transition-opacity hover:opacity-100"
                  loading="lazy"
                  decoding="async"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
