import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BikeGallery } from '../../components/motorcycles/BikeGallery'
import { resumoDaUnidade } from '../../lib/ficha'
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
          className="absolute top-3 left-7 z-10 grid size-10 place-items-center bg-noite/85 text-white transition-colors hover:bg-marca focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
      </div>

      <h1 className="mt-4 px-4 font-display text-[1.75rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-texto">
        {titulo}
      </h1>

      <dl className="mx-4 mt-4 grid grid-cols-2 gap-px border border-borda bg-borda">
        {resumoDaUnidade(bike).map((item) => (
          <div key={item.label} className="bg-painel p-3">
            <dt className="text-xs leading-none font-medium text-texto-3">{item.label}</dt>
            <dd className="numeros mt-1.5 text-sm leading-none font-semibold text-texto">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Sem texto da loja e sem ficha da linha, o bloco nem existe:
          nada no lugar de um sobre que ninguém escreveu. */}
      {paragrafos.length > 0 ? (
        <section
          aria-labelledby="sobre-mobile-titulo"
          className="mx-4 mt-6 border-t border-borda pt-4"
        >
          <h2 id="sobre-mobile-titulo" className="font-display text-lg font-bold text-texto">
            {usandoReferencia && referencia ? `Sobre a ${referencia.modelo}` : 'Sobre esta moto'}
          </h2>
          <div className="mt-2 space-y-3">
            {paragrafos.map((paragrafo, indice) => (
              <p
                key={`mobile-${indice}-${paragrafo.slice(0, 24)}`}
                className="text-sm leading-relaxed text-texto-2"
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
