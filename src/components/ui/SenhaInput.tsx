import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface SenhaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Usado no aria-label do campo e dos botões de acessibilidade. */
  rotulo: string
}

/**
 * Campo de senha com o "olhinho" para mostrar/ocultar o valor.
 * Envolve o input num relative e posiciona o botão à direita,
 * sem cobrir o texto digitado (o input ganha padding extra).
 */
export function SenhaInput({ rotulo, className, ...props }: SenhaInputProps) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visivel ? 'text' : 'password'}
        aria-label={rotulo}
        className={`input pr-10 ${className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? `Ocultar ${rotulo.toLowerCase()}` : `Mostrar ${rotulo.toLowerCase()}`}
        aria-pressed={visivel}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-steel-500 transition-colors hover:text-paper"
      >
        {visivel ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
