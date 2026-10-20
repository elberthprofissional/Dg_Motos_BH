interface InstagramIconProps {
  className?: string
}

/**
 * Glifo inline no estilo da rede (câmera arredondada),
 * já que o Lucide não embarrega ícones de marcas.
 */
export function InstagramIcon({ className = '' }: InstagramIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

/**
 * Selo do Instagram com o gradiente da marca.
 *
 * Variante do glifo acima para quando o ícone precisa ser reconhecido de
 * longe (o cartão de perfil do painel). O traçado é branco sobre a
 * pastilha — o gradiente é a superfície, não a tinta.
 */
export function InstagramBadge({ className = '' }: InstagramIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`ig-btn-gradiente grid shrink-0 place-items-center rounded-[30%] ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[68%]"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    </span>
  )
}
