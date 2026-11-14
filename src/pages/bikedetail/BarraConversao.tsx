import { Link } from 'react-router-dom'
import { IconeWhatsapp } from '../../components/ui/IconeWhatsapp'

/**
 * ============================================================
 * BARRA DE CONVERSÃO — celular
 * ============================================================
 * Preço e WhatsApp sempre à mão, sem empurrar o conteúdo: a página
 * ganha respiro inferior (pb-24) para a última vitrine não ficar
 * escondida atrás da barra.
 */
interface BarraConversaoProps {
  valor: string
  precoIncompleto: boolean
  /** `null` quando a loja ainda não tem número de WhatsApp no cadastro. */
  waHref: string | null
}

export function BarraConversao({ valor, precoIncompleto, waHref }: BarraConversaoProps) {
  const botao =
    'flex h-11 shrink-0 items-center gap-2 bg-marca px-5 text-sm font-semibold text-white transition-colors hover:bg-marca-forte focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco'

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-borda bg-painel px-4 py-3 sm:hidden">
      <p
        className={`numeros min-w-0 truncate font-display font-extrabold tracking-[-0.02em] text-marca-texto ${
          precoIncompleto ? 'text-base' : 'text-xl'
        }`}
      >
        {valor}
      </p>

      {waHref ? (
        <a href={waHref} target="_blank" rel="noopener noreferrer" className={botao}>
          <IconeWhatsapp className="size-[18px] shrink-0" />
          WhatsApp
        </a>
      ) : (
        <Link to="/contato" className={botao}>
          <IconeWhatsapp className="size-[18px] shrink-0" />
          Falar com a loja
        </Link>
      )}
    </div>
  )
}
