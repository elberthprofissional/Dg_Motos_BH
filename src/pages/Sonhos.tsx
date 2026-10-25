import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useEntregasPublicadas } from '../hooks/useEntregasPublicadas'
import { usePageMeta } from '../hooks/usePageMeta'
import { CarrosselFotos } from '../components/entregas/CarrosselFotos'
import { EsteiraFotos } from '../components/entregas/EsteiraFotos'

/** O carrossel manual não precisa de 100 bolinhas: a esteira cobre o resto. */
const LIMITE_DESTAQUES = 10

export function Sonhos() {
  const { entregas, carregando } = useEntregasPublicadas()

  usePageMeta(
    'Sonhos realizados | DG Motos — entregas em Belo Horizonte',
    'Galeria de entregas da DG Motos em Belo Horizonte. Fotos publicadas com autorização dos clientes.',
  )

  const imagens = entregas.flatMap((entrega) => entrega.imagens)
  const destaques = imagens.slice(0, LIMITE_DESTAQUES)

  return (
    <div className="pt-cabecalho">
      <section className="bg-fundo">
        <div className="container-site pt-10 pb-8 sm:pt-12 sm:pb-10">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-marca uppercase">
            Galeria de entregas
          </p>
          <h1 className="display mt-4 max-w-[13ch]">Sonhos realizados</h1>
          <p className="corpo mt-4 max-w-[56ch] text-texto-2">
            A DG Motos vende motos em Belo Horizonte e registra cada entrega. Uma foto vale mais
            que um anúncio: é a prova de que a moto saiu daqui e o sonho foi para a rua.
          </p>
        </div>
      </section>

      <section className="bg-painel py-10 sm:py-12">
        <div className="container-site">
          {carregando ? (
            <div aria-busy="true" aria-live="polite">
              <span className="sr-only">Carregando a galeria…</span>
              <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.55fr)] lg:gap-14">
                <div className="aspect-[4/5] w-full max-w-2xl bg-painel-2 motion-safe:animate-pulse" />
                <div className="space-y-3">
                  <div className="h-8 w-3/4 bg-painel-2 motion-safe:animate-pulse" />
                  <div className="h-4 w-full bg-painel-2 motion-safe:animate-pulse" />
                  <div className="h-4 w-5/6 bg-painel-2 motion-safe:animate-pulse" />
                  <div className="h-12 w-48 bg-painel-2 motion-safe:animate-pulse" />
                </div>
              </div>
            </div>
          ) : imagens.length === 0 ? (
            <div className="border border-borda bg-fundo px-5 py-14 text-center">
              <p className="font-display text-xl font-semibold text-texto">
                As primeiras entregas vão aparecer aqui.
              </p>
              <p className="corpo mx-auto mt-2 max-w-[46ch] text-texto-2">
                Enquanto isso, o pátio está aberto: veja as motos disponíveis e escolha a sua.
              </p>
              <Link to="/estoque" className="btn btn-secondary mt-6 min-h-11 gap-2 px-4">
                Ver motos disponíveis
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.55fr)] lg:gap-14">
              <figure className="aspect-[4/5] w-full max-w-2xl overflow-hidden bg-painel-2">
                <CarrosselFotos
                  imagens={destaques}
                  rotulo="Entrega realizada pela DG Motos"
                  prioridade
                />
              </figure>

              <div>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-texto sm:text-3xl">
                  Entregas de verdade, sem exposição
                </h2>
                <p className="corpo mt-4 max-w-[46ch] text-texto-2">
                  As fotos são publicadas com autorização de cada cliente. O visitante vê a
                  entrega; o nome de quem comprou e o modelo da moto ficam só entre a loja e o
                  cliente.
                </p>
                <Link to="/estoque" className="btn btn-secondary mt-6 min-h-12 w-fit gap-2 px-5">
                  Ver motos disponíveis
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {imagens.length > 0 ? (
        <section className="bg-fundo py-10 sm:py-12">
          <div className="container-site">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="titulo text-3xl sm:text-4xl">Cada foto, uma entrega</h2>
                <p className="corpo mt-2 max-w-[52ch] text-texto-2">
                  A esteira pausa ao passar o mouse, ao focar a faixa ou no botão.
                </p>
              </div>
              <Link to="/estoque" className="btn btn-secondary min-h-11 w-fit gap-2 px-4 text-sm">
                Quero a minha
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </header>

            <EsteiraFotos imagens={imagens} />
          </div>
        </section>
      ) : null}
    </div>
  )
}
