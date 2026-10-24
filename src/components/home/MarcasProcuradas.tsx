import { logoDaMarca } from '../../lib/marcas'

/** Curadoria curta: uma linha só de logos, como na referência — 15
    marcas voltavam a linha e viravam tapete. */
const MARCAS = [
  'Honda',
  'Yamaha',
  'Suzuki',
  'Kawasaki',
  'Ducati',
  'Harley-Davidson',
  'BMW',
  'KTM',
  'Royal Enfield',
  'Shineray',
] as const

export function MarcasProcuradas() {
  return (
    <section
      data-marcas
      aria-labelledby="marcas-titulo"
      className="border-t border-borda bg-fundo"
    >
      <div className="container-site py-12 sm:py-14">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-12">
          {/* Título modesto com filete vertical à direita (só no
              desktop), como a referência — sem texto de apoio. */}
          <h2
            id="marcas-titulo"
            className="text-lg leading-snug font-semibold text-texto max-lg:max-w-64 lg:border-r lg:border-borda lg:pr-12"
          >
            Marcas mais procuradas
          </h2>

          {/* Celular: esteira — as marcas passam sozinhas, como esteira de
              loja. A lista se duplica uma vez e a animação `.esteira` desloca
              a banda em loop contínuo; a segunda passagem é decorativa. */}
          <ul className="esteira flex w-max max-w-full items-center gap-6 overflow-hidden py-2 sm:hidden">
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

          {/* Desktop: linha única, logos centrais com respiro — a seção
              inteira conversa pouco e mostra as marcas. */}
          <ul className="hidden flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:flex">
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
