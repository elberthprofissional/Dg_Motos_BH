import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'

interface WhatsAppCTAProps {
  message: string
  label?: string
  variant?: 'solid' | 'outline'
  className?: string
}

const styles = {
  solid:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
  outline:
    'border border-line-forte bg-transparent text-paper hover:border-white/40 hover:bg-white/5',
}

/**
 * Botão de WhatsApp. Enquanto o dono não configurar o número
 * (Configurações no painel, ou src/data/site.ts), cai para /contato.
 */
export function WhatsAppCTA({
  message,
  label = 'Negociar pelo WhatsApp',
  variant = 'solid',
  className = '',
}: WhatsAppCTAProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 font-display text-xs font-semibold tracking-[0.18em] uppercase transition-colors duration-200 ${styles[variant]} ${className}`

  const href = useWhatsappLink(message)

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
