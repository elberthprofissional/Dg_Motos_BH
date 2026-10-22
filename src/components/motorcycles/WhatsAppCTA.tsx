import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'

interface WhatsAppCTAProps {
  message: string
  label?: string
  variant?: 'solid' | 'outline'
  /** Retângulo verde com o glifo oficial do WhatsApp — o único ponto
      fora da paleta, porque precisa ser reconhecido de longe como
      "chama no zap". O texto é quase preto (10,6:1 de contraste): o
      branco sobre este verde daria 1,98:1. */
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
      'inline-flex items-center justify-center gap-2.5 bg-whatsapp text-fundo font-display text-base font-semibold transition-[filter] hover:brightness-95 ' +
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
