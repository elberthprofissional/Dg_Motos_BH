import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'

interface WhatsAppCTAProps {
  message: string
  label?: string
  variant?: 'solid' | 'outline'
  /** Chapa vermelha da casa com o glifo oficial do WhatsApp — o
      botão da página de contato. O verde do WhatsApp fica só no
      botão flutuante, que precisa ser reconhecido de longe de fora
      do site; aqui dentro o vermelho é a identidade da DG Motos, e
      branco sobre ele dá 4,9:1 de contraste. */
  glifoWhatsapp?: boolean
  className?: string
}

/**
 * Botão de WhatsApp. Enquanto o dono não configurar o número
 * (Configurações no painel, ou src/data/site.ts), cai para /contato.
 */
export function WhatsAppCTA({
  message,
  label = 'Negociar pelo WhatsApp',
  variant = 'solid',
  glifoWhatsapp = false,
  className = '',
}: WhatsAppCTAProps) {
  const href = useWhatsappLink(message)

  if (glifoWhatsapp) {
    const cls =
      'inline-flex items-center justify-center gap-2.5 bg-marca text-white font-display text-base font-semibold transition-colors duration-150 hover:bg-marca-forte ' +
      className

    if (!href) {
      return (
        <Link to="/contato" className={cls}>
          <IconeWhatsapp className="size-5 shrink-0" />
          Falar com a loja
        </Link>
      )
    }

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        <IconeWhatsapp className="size-5 shrink-0" />
        {label}
      </a>
    )
  }

  const cls = `btn ${variant === 'solid' ? 'btn-primary' : 'btn-secondary'} ${className}`

  if (!href) {
    return (
      <Link to="/contato" className={cls}>
        <MessageCircle className="size-4" aria-hidden="true" />
        Falar com a loja
      </Link>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      <MessageCircle className="size-4" aria-hidden="true" />
      {label}
    </a>
  )
}
