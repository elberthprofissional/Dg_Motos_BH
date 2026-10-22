import { ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { useScrolled } from '../../hooks/useScroll'

/** Depois de quantos px rolados a seta "voltar ao topo" aparece. */
const LIMIAR_ROLAGEM = 480

/**
 * Glifo oficial do WhatsApp.
 *
 * O lucide abandonou os ícones de marca, então o balão com fone é um
 * SVG inline (caminho do Simple Icons) — nada de ícone genérico de
 * mensagem no lugar errado.
 */
function IconeWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.940 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

/**
 * Botões flutuantes no canto inferior direito: contato sempre à mão e a
 * seta para voltar ao topo depois que a página já rolou.
 *
 * Chapa reta, como o resto da casa: o contato é um bloco vermelho
 * (vermelho é sinal, não enfeite) e a seta é uma placa de painel.
 * Nada arredondado aqui — e nada de sombra: sombra é enfeite de
 * interface, e este site não usa.
 *
 * Sem número configurado, o botão cai para /contato — mesma régua
 * dos demais CTAs de WhatsApp do site (ver WhatsAppCTA.tsx).
 */
export function BotoesFlutuantes() {
  const wa = useWhatsappLink(buildDefaultMessage())
  const rolada = useScrolled(LIMIAR_ROLAGEM)

  const voltarAoTopo = () => {
    // Quem pede menos movimento no sistema não recebe a rolagem animada.
    const reduzMovimento = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    window.scrollTo({ top: 0, behavior: reduzMovimento ? 'auto' : 'smooth' })
  }

  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col-reverse items-end gap-2.5 sm:right-5">
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Conversar no WhatsApp"
          className="grid size-14 place-items-center bg-whatsapp text-fundo transition-[filter] hover:brightness-95"
        >
          <IconeWhatsapp className="size-7" />
        </a>
      ) : (
        <Link
          to="/contato"
          aria-label="Falar com a loja"
          className="grid size-14 place-items-center bg-whatsapp text-fundo transition-[filter] hover:brightness-95"
        >
          <IconeWhatsapp className="size-7" />
        </Link>
      )}

      <button
        type="button"
        onClick={voltarAoTopo}
        aria-label="Voltar ao topo"
        aria-hidden={!rolada}
        inert={!rolada}
        className={`grid size-11 place-items-center border border-borda-forte bg-painel-2 text-texto transition-[opacity,transform] duration-300 hover:text-marca-texto ${
          rolada ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        <ArrowUp className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}
