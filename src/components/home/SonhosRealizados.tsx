import type { EntregaPublicada } from '../../data/entregas'
import { EsteiraFotos } from '../entregas/EsteiraFotos'
import { GaleriaEntregasDesktop } from './GaleriaEntregasDesktop'

interface SonhosRealizadosProps {
  entregas: EntregaPublicada[]
}

/**
 * Quantas entregas entram na vitrine da Home. A esteira mostra o
 * restante no celular.
 */
export const LIMITE_MURAL = 6

/** No celular a esteira mostra só algumas fotos — o mural completo é
 * do desktop; quem quiser mais, rola a página no tablet. */
const FOTOS_ESTEIRA_MOBILE = 8

/**
 * ============================================================
 * SONHOS REALIZADOS
 * ============================================================
 * Duas composições com o mesmo conteúdo real:
 *
 * - No celular, a esteira aprovada continua igual: as fotos passam
 *   como uma escada rolante e pausam ao toque.
 * - No desktop, a galeria vira um carrossel editorial: texto à
 *   esquerda, retrato 4:5 à direita e barras de navegação abaixo.
 *   Uma entrega por cliente, sem repetir imagem.
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
      className="border-t border-borda bg-fundo text-noite-texto"
    >
      <div className="lg:hidden">
        <div className="container-site py-12 sm:py-16">
          <div className="secao-titulo">
            <h2 id="sonhos-titulo" className="titulo text-texto">
              Sonhos realizados
            </h2>
            <p className="hidden max-w-[30ch] text-right text-sm text-texto-2 sm:block">
              Clientes que já saíram da loja com a moto na mão.
            </p>
          </div>

          <div data-vitrine className="mt-8 sm:mt-10">
            <EsteiraFotos imagens={fotos.slice(0, FOTOS_ESTEIRA_MOBILE)} controlePausa={false} />
          </div>
        </div>
      </div>

      <GaleriaEntregasDesktop entregas={visiveis} />
    </section>
  )
}
