import { Revelar } from '../../components/ui/Revelar'
import type { DestaqueFicha, FichaModelo } from '../../data/fichasModelo'

/**
 * ============================================================
 * DESTAQUES DA LINHE + SOBRE ESTA MOTO
 * ============================================================
 * O cartão só fica de pé com matéria dentro: destaque da linha ou
 * texto da loja. Sem os dois, nem a borda aparecem — vazio ele
 * virava um retângulo órfão na página.
 */
interface SobreDestaqueProps {
  temFicha: boolean
  destaques: DestaqueFicha[]
  paragrafos: string[]
  usandoReferencia: boolean
  referencia: FichaModelo | null
}

export function SobreDestaque({
  temFicha,
  destaques,
  paragrafos,
  usandoReferencia,
  referencia,
}: SobreDestaqueProps) {
  const semDestaques = destaques.length === 0

  if (!semDestaques && paragrafos.length === 0 && !temFicha) return null

  const tituloSobre = (
    <h2
      id="sobre-titulo"
      className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-texto"
    >
      {usandoReferencia && referencia ? `Sobre a ${referencia.modelo}` : 'Sobre esta moto'}
    </h2>
  )

  const textoSobre = (
    <div
      className={`mt-6 max-w-[36rem] space-y-5 lg:max-w-[62ch] ${semDestaques ? 'lg:mt-1' : ''}`}
    >
      {paragrafos.map((paragrafo, indice) => (
        <p
          key={`${indice}-${paragrafo.slice(0, 24)}`}
          className={`text-[1.0625rem] leading-[1.7] text-texto-2 ${
            indice === 0
              ? 'first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-display first-letter:text-[3.5rem] first-letter:leading-[0.75] first-letter:font-bold first-letter:text-marca-texto lg:first-letter:float-none lg:first-letter:mt-0 lg:first-letter:mr-0 lg:first-letter:font-sans lg:first-letter:text-[1.0625rem] lg:first-letter:leading-[1.7] lg:first-letter:font-normal lg:first-letter:text-texto-2'
              : ''
          }`}
        >
          {paragrafo}
        </p>
      ))}
    </div>
  )

  const notaSobre =
    usandoReferencia && referencia ? (
      <p className="mt-6 text-sm leading-relaxed text-texto-3">
        Texto e ficha da linha {referencia.modelo}. O estado desta unidade, você confere com a loja.
      </p>
    ) : null

  return (
    <div
      className={`hidden px-4 sm:block lg:mx-auto lg:w-full lg:max-w-7xl lg:px-6 lg:pb-0 ${
        temFicha ? 'pb-16' : ''
      }`}
    >
      {destaques.length > 0 || paragrafos.length > 0 ? (
        <div className="max-w-[42rem] lg:mt-12 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-x-12 lg:rounded-2xl lg:border lg:border-borda lg:bg-painel/40 lg:p-8 xl:gap-x-16 xl:p-10">
          {destaques.length > 0 ? (
            <Revelar
              as="section"
              aria-labelledby="destaques-titulo"
              className="pt-4 sm:pt-6 lg:border-t lg:border-borda lg:pt-8"
            >
              <h2
                id="destaques-titulo"
                className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-texto"
              >
                A linha em três pontos
              </h2>

              <dl className="mt-8 space-y-8 lg:mt-6 lg:space-y-6">
                {destaques.map((destaque) => (
                  <div key={destaque.rotulo}>
                    <dt>
                      <span className="block font-display text-[1.75rem] leading-none font-semibold tracking-[-0.025em] text-texto">
                        {destaque.valor}
                      </span>
                      <span className="mt-2 block text-sm font-medium text-texto">
                        {destaque.rotulo}
                      </span>
                    </dt>
                    <dd className="mt-2 text-[1.0625rem] leading-relaxed text-texto-2">
                      {destaque.texto}
                    </dd>
                  </div>
                ))}
              </dl>
            </Revelar>
          ) : null}

          {/* Sem descrição escrita, a seção inteira sai da página: o
              título "Sobre esta moto" não dita conversa de ninguém. */}
          {paragrafos.length > 0 ? (
            <Revelar
              as="section"
              aria-labelledby="sobre-titulo"
              className={`mt-16 lg:mt-0 lg:border-t lg:border-borda lg:pt-8 ${
                semDestaques ? 'lg:col-span-2' : ''
              }`}
            >
              {semDestaques ? (
                <div className="lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-x-12 xl:gap-x-16">
                  {tituloSobre}
                  {textoSobre}
                </div>
              ) : (
                <>
                  {tituloSobre}
                  {textoSobre}
                </>
              )}

              {notaSobre}
            </Revelar>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
