import type { CSSProperties } from 'react'
import { logoDaMarca } from '../../lib/marcas'

// Só as marcas que qualquer pessoa reconhece. A faixa se move sozinha,
// como uma esteira de loja; as repetições ficam ocultas do leitor.
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

// Quatro sequências iguais: deslocar um quarto do track fecha o loop
// sem vão mesmo em monitores largos. O tempo cresce com a lista para
// manter a velocidade visual estável.
const COPIAS = 4
const DURACAO_MOBILE = `${(MARCAS.length * 140) / 32}s`
const DURACAO_LARGA = `${(MARCAS.length * 192) / 32}s`

function ListaDeMarcas({ copia }: { copia: number }) {
  const decorativa = copia > 0
  return (
    <ul
      className={`flex shrink-0 items-center gap-7 pr-7 sm:gap-12 sm:pr-12${
        decorativa ? ' marcas-clonagem' : ''
      }`}
      aria-hidden={decorativa || undefined}
    >
      {MARCAS.map((marca) => (
        <li
          key={`${copia}-${marca}`}
          className="flex w-28 shrink-0 items-center justify-center sm:w-36"
        >
          <img
            src={logoDaMarca(marca)}
            alt={decorativa ? '' : marca}
            width={144}
            height={40}
            className="block h-9 w-28 object-contain opacity-85 sm:h-10 sm:w-36"
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
    <section
      aria-labelledby="marcas-titulo"
      className="border-y border-borda bg-painel py-5 sm:py-6"
    >
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
        <div className="esteira-marcas flex w-max items-center" style={duracoes}>
          {Array.from({ length: COPIAS }, (_, copia) => (
            <ListaDeMarcas key={copia} copia={copia} />
          ))}
        </div>
      </div>
    </section>
  )
}
