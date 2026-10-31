import { Revelar } from '../../components/ui/Revelar'
import type { GrupoFicha } from '../../data/fichasModelo'

/**
 * ============================================================
 * FICHA DE PAPEL
 * ============================================================
 * O bloco rompe o palco e ocupa a página inteira, como uma ficha
 * impressa apoiada na bancada. Primeiro o que é desta unidade;
 * depois, quando existe, a referência pública da linha.
 *
 * A página só monta este bloco quando `temFicha` — sem ficha e sem
 * especificações cadastradas, ele nem entra no DOM.
 */
interface FichaTecnicaProps {
  titulo: string
  ano: number
  introFicha: string
  gradeGrupos: string
  grupos: GrupoFicha[]
  notaFicha: string
}

export function FichaTecnica({
  titulo,
  ano,
  introFicha,
  gradeGrupos,
  grupos,
  notaFicha,
}: FichaTecnicaProps) {
  return (
    <section
      id="ficha"
      aria-labelledby="ficha-titulo"
      className="scroll-mt-20 border-t-2 border-marca bg-[#f1f2f3] text-[#161513] sm:scroll-mt-[4.25rem] lg:mt-12"
    >
      <div className="container-site px-4 py-16 lg:max-w-7xl lg:px-6 lg:py-24">
        <Revelar>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2
              id="ficha-titulo"
              className="font-display text-[3rem] leading-none font-bold tracking-[-0.04em]"
            >
              Ficha técnica
            </h2>
            <p className="numeros pb-1 text-sm font-semibold text-[#5d5952]">
              {titulo} · {ano}
            </p>
          </div>
          <p className="mt-5 max-w-[54ch] text-[1.0625rem] leading-relaxed text-[#4f4b44]">
            {introFicha}
          </p>
        </Revelar>

        <div className={`mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 ${gradeGrupos}`}>
          {grupos.map((grupo, indiceGrupo) => {
            const itens = grupo.itens.filter((item) => item?.label?.trim() && item?.value?.trim())
            if (itens.length === 0) return null

            return (
              <Revelar key={grupo.titulo} atraso={indiceGrupo * 70}>
                <div className="border-t-2 border-[#161513]/80 pt-4">
                  <h3 className="font-display text-[1.0625rem] font-bold text-[#161513]">
                    {grupo.titulo}
                  </h3>

                  <dl className="mt-4">
                    {itens.map((item) => (
                      <div key={item.label} className="py-2.5">
                        <dt className="text-sm leading-snug text-[#6a655c]">{item.label}</dt>
                        <dd className="numeros mt-1 text-[1.0625rem] leading-snug font-medium text-[#161513]">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Revelar>
            )
          })}
        </div>

        <Revelar>
          <p className="mt-14 max-w-[80ch] border-t-2 border-[#9e211b]/40 pt-5 text-sm leading-relaxed text-[#5d5952]">
            {notaFicha}
          </p>
        </Revelar>
      </div>
    </section>
  )
}
