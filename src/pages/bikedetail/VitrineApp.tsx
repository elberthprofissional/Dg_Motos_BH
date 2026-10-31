import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BikeGallery } from '../../components/motorcycles/BikeGallery'
import { formatKm } from '../../lib/format'
import type { FichaModelo } from '../../data/fichasModelo'
import type { Motorcycle } from '../../types'

/**
 * ============================================================
 * VITRINE DE APP — celular
 * ============================================================
 * A foto abre a página, seguida das miniaturas e do título; as
 * especificações viram cartões e a descrição fecha o bloco. O
 * preço e o WhatsApp vivem na barra fixa do rodapé.
 */
interface VitrineAppProps {
  bike: Motorcycle
  titulo: string
  paragrafos: string[]
  usandoReferencia: boolean
  referencia: FichaModelo | null
}

export function VitrineApp({
  bike,
  titulo,
  paragrafos,
  usandoReferencia,
  referencia,
}: VitrineAppProps) {
  return (
    <div className="block pb-6 sm:hidden">
      <div className="relative">
        <BikeGallery
          key={`${bike.id}-app`}
          variante="app"
          imagens={bike.imagens}
          titulo={`${titulo} ${bike.ano}`}
        />
        <Link
          to="/estoque"
          aria-label="Voltar ao estoque"
          title="Voltar ao estoque"
          className="absolute top-3 left-7 z-10 grid size-10 place-items-center rounded-full bg-neutral-950/70 text-white backdrop-blur-md transition-colors hover:bg-marca focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
      </div>

      <h1 className="mt-3 px-4 text-2xl font-black tracking-tight text-white uppercase">
        {titulo}
      </h1>

      <dl className="mt-4 grid grid-cols-2 gap-2 px-4">
        {[
          ['Ano', String(bike.ano)],
          ['Quilometragem', formatKm(bike.quilometragem)],
          ['Cilindrada', bike.cilindrada ? `${bike.cilindrada} cc` : 'A confirmar'],
        ].map(([rotulo, valorItem]) => (
          <div key={rotulo} className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3">
            <dt className="text-xs leading-none font-medium text-neutral-400">{rotulo}</dt>
            <dd className="numeros mt-1.5 text-sm leading-none font-bold text-white">
              {valorItem}
            </dd>
          </div>
        ))}
      </dl>

      {/* Sem texto da loja e sem ficha da linha, o bloco nem existe:
          nada no lugar de um sobre que ninguém escreveu. */}
      {paragrafos.length > 0 ? (
        <section
          aria-labelledby="sobre-mobile-titulo"
          className="mx-4 mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4"
        >
          <h2 id="sobre-mobile-titulo" className="text-base font-bold text-white">
            {usandoReferencia && referencia ? `Sobre a ${referencia.modelo}` : 'Sobre esta moto'}
          </h2>
          <div className="mt-2 space-y-3">
            {paragrafos.map((paragrafo, indice) => (
              <p
                key={`mobile-${indice}-${paragrafo.slice(0, 24)}`}
                className="text-sm leading-relaxed text-neutral-300"
              >
                {paragrafo}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
