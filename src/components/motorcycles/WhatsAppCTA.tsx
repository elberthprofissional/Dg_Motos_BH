import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWhatsappLink } from '../../lib/format'

interface WhatsAppCTAProps {
  message: string
  label?: string
  variant?: 'solid' | 'outline'
  className?: string
}

const styles = {
  solid:
    'bg-brand-500 text-white hover:bg-brand-600',
  outline:
    'border border-white/25 bg-transparent text-paper hover:border-white/40 hover:bg-white/5',
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
  const cls = `inline-flex items-center justify-center gap-2 rounded px-5 py-2.5 font-display text-sm font-semibold tracking-[0.08em] uppercase transition-colors ${styles[variant]} ${className}`

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
