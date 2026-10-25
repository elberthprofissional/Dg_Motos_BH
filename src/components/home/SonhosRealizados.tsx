import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { EntregaPublicada } from '../../data/entregas'
import { EsteiraFotos } from '../entregas/EsteiraFotos'
import { GaleriaEntregasDesktop } from './GaleriaEntregasDesktop'

interface SonhosRealizadosProps {
  entregas: EntregaPublicada[]
}

/**
 * Quantas entregas entram na vitrine da Home. A galeria completa fica
 * atrás do link; a esteira mostra o restante no celular.
 */
export const LIMITE_MURAL = 6

/**
 * ============================================================
 * SONHOS REALIZADOS
 * ============================================================
 * Duas composições com o mesmo conteúdo real:
 *
 * - No celular, a esteira aprovada continua igual: as fotos passam
 *   como uma escada rolante e pausam ao toque.
 * - No desktop, a galeria vira uma história presa: o título fica
 *   parado, as fotos trocam conforme o scroll e qualquer foto abre
 *   ampliada. Uma entrega por cliente, sem repetir imagem.
 */
export function SonhosRealizados({ entregas }: SonhosRealizadosProps) {
  // A vitrine pública só existe quando há ao menos uma entrega publicada.
  // Rascunhos e registros privados já são filtrados pela consulta de origem.
  if (entregas.length === 0) return null

  const visiveis = entregas.slice(0, LIMITE_MURAL)
  const fotos = visiveis.flatMap((entrega) => entrega.imagens)

  return (
    <section
      id="sonhos"
      aria-label="Sonhos realizados"
      className="bg-painel lg:bg-[#0b0a09]"
    >
      <div className="lg:hidden">
        <div className="container-site py-14 sm:py-16">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <h2 id="sonhos-titulo" className="titulo text-texto">
                Sonhos realizados
              </h2>
              <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-texto-2 sm:text-base">
                Entregas reais com autorização de quem comprou.
              </p>
            </div>

            <Link
              to="/sonhos"
              className="link-acao group inline-flex min-h-11 shrink-0 items-center gap-2 self-start sm:self-auto"
            >
              Ver galeria completa
              <ArrowRight
                className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </header>

          <div data-vitrine className="mt-8 sm:mt-10">
            <EsteiraFotos imagens={fotos} controlePausa={false} />
          </div>
        </div>
      </div>

      <GaleriaEntregasDesktop entregas={visiveis} />
    </section>
  )
}
