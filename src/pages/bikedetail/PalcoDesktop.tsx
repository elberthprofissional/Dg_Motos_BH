import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft } from 'lucide-react'
import { BikeGallery } from '../../components/motorcycles/BikeGallery'
import { IconeWhatsapp } from '../../components/ui/IconeWhatsapp'
import { formatKm, formatPrice } from '../../lib/format'
import type { Motorcycle, MotorcycleStatus } from '../../types'

/**
 * ============================================================
 * PALCO PARTIDO — desktop
 * ============================================================
 * No desktop a foto vira a peça grande à esquerda e o painel de
 * compra acompanha a rolagem à direita, os dois na mesma bancada.
 */
interface PalcoDesktopProps {
  bike: Motorcycle
  titulo: string
  valor: string
  desconto: number | null
  precoIncompleto: boolean
  precoParaConfirmar: boolean
  /** `null` quando a loja ainda não tem número de WhatsApp no cadastro. */
  waHref: string | null
  temFicha: boolean
}

function rotuloStatus(status: MotorcycleStatus): string {
  if (status === 'disponivel') return 'No pátio'
  if (status === 'vendida') return 'Vendida'
  return 'Indisponível'
}

export function PalcoDesktop({
  bike,
  titulo,
  valor,
  desconto,
  precoIncompleto,
  precoParaConfirmar,
  waHref,
  temFicha,
}: PalcoDesktopProps) {
  const disponivel = bike.status === 'disponivel'
  const botaoWhatsapp =
    'btn btn-primary h-[3.25rem] flex-1 gap-2.5 px-5 text-sm lg:h-auto lg:w-full lg:rounded-xl lg:bg-emerald-600 lg:py-4 lg:text-lg lg:font-bold lg:text-white lg:shadow-lg lg:shadow-emerald-950/40 lg:hover:bg-emerald-500 lg:hover:text-white'

  return (
    <div className="hidden flex-col sm:flex lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-12 lg:items-start lg:gap-10 lg:px-6 lg:py-8">
      <div className="contents lg:sticky lg:top-24 lg:col-span-5 lg:flex lg:min-w-0 lg:flex-col lg:self-start">
        <header className="order-1 px-4 pt-5 sm:pt-8 lg:order-none lg:px-0 lg:pt-0">
          <div className="max-w-[42rem]">
            <div>
              <Link
                to="/estoque"
                aria-label="Voltar ao estoque"
                title="Voltar ao estoque"
                className="grid size-11 -ml-2 place-items-center text-texto-2 transition-colors hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </Link>
            </div>

            <h1 className="mt-8 max-w-full font-display text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.94] font-bold tracking-[-0.045em] break-words text-balance text-texto sm:mt-10 lg:mt-6 lg:text-4xl lg:leading-[0.98] lg:font-extrabold lg:tracking-[-0.02em] lg:uppercase xl:text-5xl">
              {titulo}
            </h1>

            <div className="mt-7 lg:mt-5 lg:border-t lg:border-borda lg:pt-5">
              {desconto != null ? (
                <p className="numeros mb-1.5 text-sm text-texto-3">
                  de {formatPrice(bike.precoAntes ?? bike.preco)}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <p
                  className={`font-display text-[clamp(2rem,3vw,2.5rem)] leading-none font-bold tracking-[-0.03em] lg:text-[3rem] lg:font-black xl:text-[3.25rem] ${
                    precoIncompleto ? 'text-texto' : 'numeros text-marca-viva'
                  }`}
                >
                  {valor}
                </p>

                {desconto != null ? (
                  <span className="numeros bg-marca px-2.5 py-1 font-sans text-sm font-bold text-white">
                    −{desconto}%
                  </span>
                ) : null}

                <p
                  className={`inline-flex h-8 items-center px-3 text-sm font-semibold lg:hidden ${
                    disponivel ? 'bg-marca text-white' : 'bg-painel-3 text-texto-2'
                  }`}
                >
                  {rotuloStatus(bike.status)}
                </p>
              </div>

              {precoIncompleto ? (
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-texto-2">
                  O preço desta moto está em conferência na loja. Fale com a equipe para confirmar.
                </p>
              ) : precoParaConfirmar ? (
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-texto-2">
                  Confirme o preço com a loja antes de negociar.
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <dl className="order-4 mt-8 mb-6 grid grid-cols-2 gap-x-6 gap-y-5 px-4 sm:mb-8 sm:grid-cols-4 lg:order-none lg:mt-6 lg:mb-0 lg:grid-cols-2 lg:gap-3 lg:rounded-xl lg:border lg:border-borda lg:bg-painel/60 lg:p-4 lg:backdrop-blur-md">
          {[
            ['Ano', String(bike.ano)],
            ['Quilometragem', formatKm(bike.quilometragem)],
            ['Cilindrada', bike.cilindrada ? `${bike.cilindrada} cc` : 'A confirmar'],
          ].map(([rotulo, valorItem]) => (
            <div
              key={rotulo}
              className="lg:min-w-0 lg:rounded-lg lg:border lg:border-borda/70 lg:bg-fundo/40 lg:px-3.5 lg:py-3"
            >
              <dt className="text-sm leading-none text-texto-3">{rotulo}</dt>
              <dd className="numeros mt-2 text-[1.0625rem] leading-none font-semibold text-texto">
                {valorItem}
              </dd>
            </div>
          ))}
        </dl>

        <div className="order-2 mt-5 flex flex-col gap-3 px-4 sm:flex-row lg:order-none lg:mt-6 lg:flex-col lg:gap-2.5 lg:px-0">
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={botaoWhatsapp}
            >
              <IconeWhatsapp className="size-[18px] shrink-0" />
              Falar no WhatsApp
            </a>
          ) : (
            <Link to="/contato" className={botaoWhatsapp}>
              <IconeWhatsapp className="size-[18px] shrink-0" />
              Falar com a loja
            </Link>
          )}

          {temFicha ? (
            <a
              href="#ficha"
              className="btn btn-secondary h-[3.25rem] flex-1 gap-2.5 px-5 text-sm lg:h-12 lg:w-full lg:rounded-xl lg:border-borda lg:text-texto-2"
            >
              Ver ficha técnica
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <aside
          aria-label={`Fotos de ${titulo} ${bike.ano}`}
          className="order-3 mt-8 px-4 lg:order-first lg:col-span-7 lg:mt-0 lg:w-full lg:px-0"
        >
          <BikeGallery key={bike.id} imagens={bike.imagens} titulo={`${titulo} ${bike.ano}`} />
        </aside>
      </div>
    </div>
  )
}
