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
          </div>

          {/* Celular: esteira — as marcas passam sozinhas, como esteira de
              loja. A lista se duplica uma vez e a animação `.esteira` desloca
              a banda em loop contínuo; a segunda passagem é decorativa. */}
          <ul className="esteira flex w-max max-w-full items-center gap-6 overflow-hidden py-4 sm:hidden">
            {MARCAS.map((marca) => (
              <li key={`a-${marca}`} className="flex shrink-0 items-center justify-center">
                <img
                  data-marca-logo
                  src={logoDaMarca(marca)}
                  alt={`Logo ${marca}`}
                  className="h-7 w-auto shrink-0 object-contain opacity-80"
                  loading="lazy"
                  decoding="async"
                />
              </li>
            ))}
            {MARCAS.map((marca) => (
              <li
                key={`b-${marca}`}
                aria-hidden="true"
                className="marcas-clonagem flex shrink-0 items-center justify-center"
              >
                <img
                  data-marca-logo
                  src={logoDaMarca(marca)}
                  alt=""
                  className="h-7 w-auto shrink-0 object-contain opacity-80"
                  loading="lazy"
                  decoding="async"
                />
              </li>
            ))}
          </ul>

          {/* Desktop: linha horizontal centralizada. */}
          <ul className="hidden flex-wrap items-center justify-center gap-8 sm:flex">
            {MARCAS.map((marca) => (
              <li key={marca} className="flex items-center justify-center">
                <img
                  data-marca-logo
                  src={logoDaMarca(marca)}
                  alt={`Logo ${marca}`}
                  className="h-8 w-auto object-contain opacity-70 transition-opacity hover:opacity-100"
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
