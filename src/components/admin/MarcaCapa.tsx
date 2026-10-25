interface MarcaCapaProps {
  className?: string
}

/**
 * ============================================================
 * MARCA DE CAPA
 * ============================================================
 * O círculo de lápis graxa da prova de contato: nos negativos, o
 * fotógrafo marcava assim a imagem que ia ampliar. Aqui ele marca a
 * foto que abre o mural — o único lugar do painel em que o vermelho
 * da casa é sinal de escolha, não de alerta.
 */
export function MarcaCapa({ className = '' }: MarcaCapaProps) {
  return (
    <svg
      viewBox="0 0 100 125"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M50 6C74 6 95 28 94 55c-1 28-18 58-44 63C25 123 6 98 6 66 6 32 26 6 50 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
