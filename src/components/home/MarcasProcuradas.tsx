import { logoDaMarca } from '../../lib/marcas'

// Faixa parada: só as marcas que qualquer pessoa reconhece. A esteira
// antiga escondia metade dos logos a cada instante e competia com a
// esteira de entregas.
const MARCAS = [
  'Honda',
  'Yamaha',
  'Suzuki',
  'BMW',
  'Kawasaki',
  'Ducati',
  'Harley-Davidson',
  'KTM',
] as const

export function Marcas() {
  return (
    <section
      aria-labelledby="marcas-titulo"
      className="border-y border-borda bg-painel py-8 sm:py-9 lg:border-y-0 lg:py-12"
    >
      <div className="container-site">
        {/* O título não aparece, mas dá nome à faixa no leitor de tela. */}
        <h2 id="marcas-titulo" className="sr-only">
          Marcas
        </h2>
        <ul
          data-marcas
          className="grid grid-cols-4 items-center gap-x-3 gap-y-7 sm:gap-x-6 sm:gap-y-8 lg:flex lg:justify-between lg:gap-x-6"
        >
          {MARCAS.map((marca) => (
            <li key={marca} className="flex items-center justify-center">
              <img
                src={logoDaMarca(marca)}
                alt={marca}
                width={144}
                height={40}
                className="block h-8 w-16 object-contain opacity-90 sm:h-9 sm:w-24 lg:h-10 lg:w-28 xl:h-11 xl:w-32"
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
