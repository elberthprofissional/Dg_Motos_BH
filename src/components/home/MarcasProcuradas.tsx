import type { CSSProperties } from 'react'
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

// Slot + intervalo entre marcas. O tempo cresce com a lista para manter
// uma velocidade visual semelhante quando novas marcas forem adicionadas.
const DURACAO_MOBILE = `${(MARCAS.length * 140) / 32}s`
const DURACAO_LARGA = `${(MARCAS.length * 192) / 32}s`

function ListaDeMarcas({ clonagem = false }: { clonagem?: boolean }) {
  return (
    <ul
      className={`flex shrink-0 items-center gap-7 pr-7 sm:gap-12 sm:pr-12${
        clonagem ? ' marcas-clonagem' : ''
      }`}
      aria-hidden={clonagem || undefined}
    >
      {MARCAS.map((marca) => (
        <li key={`${clonagem ? 'clone-' : ''}${marca}`} className="flex w-28 shrink-0 items-center justify-center sm:w-36">
          <img
            src={logoDaMarca(marca)}
            alt={clonagem ? '' : marca}
            width={144}
            height={40}
            className="block h-9 w-28 object-contain opacity-85 sm:h-10 sm:w-36"
            loading="lazy"
            decoding="async"
          />
        </li>
      ))}
    </ul>
  )
}

export function Marcas() {
  const duracoes = {
    '--marcas-duracao-mobile': DURACAO_MOBILE,
    '--marcas-duracao-larga': DURACAO_LARGA,
  } as CSSProperties

  return (
    <section aria-labelledby="marcas-titulo" className="border-y border-borda bg-painel py-5 sm:py-6">
      {/* O título saiu da tela mas continua no sumário do leitor de
          tela: sem ele a faixa vira um bloco de imagens sem nome. */}
      <h2 id="marcas-titulo" className="sr-only">
        Marcas
      </h2>
      <div
        className="marcas-viewport no-scrollbar w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca"
        role="group"
        aria-label="Esteira de marcas. O movimento pausa quando recebe foco."
        tabIndex={0}
      >
        <div className="esteira flex w-max items-center" style={duracoes}>
          <ListaDeMarcas />
          <ListaDeMarcas clonagem />
        </div>
      </div>
    </section>
  )
}
