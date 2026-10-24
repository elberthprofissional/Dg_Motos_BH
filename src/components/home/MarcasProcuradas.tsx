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

export function Marcas() {
  return (
    <section aria-labelledby="marcas-titulo" className="border-y border-borda bg-painel">
      <div className="container-site grid gap-6 py-8 sm:py-9 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-center lg:gap-10">
        <h2 id="marcas-titulo" className="font-display text-lg font-semibold text-texto">
          Marcas
        </h2>
        <ul className="grid grid-cols-3 items-center gap-x-5 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-9">
          {MARCAS.map((marca) => (
            <li key={marca} className="flex min-h-11 items-center justify-center sm:justify-start">
              <img
                src={logoDaMarca(marca)}
                alt={marca}
                className="h-6 max-w-20 object-contain opacity-80 sm:h-8 sm:max-w-28"
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
