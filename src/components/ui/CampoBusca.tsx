import { Search, X } from 'lucide-react'

interface CampoBuscaProps {
  value: string
  onChange: (valor: string) => void
  placeholder: string
  /** Rótulo acessível: o placeholder some quando há texto digitado. */
  rotulo: string
  className?: string
  autoFocus?: boolean
}

/**
 * Campo de busca do painel.
 *
 * Antes cada tela reescrevia o input com a lupa e o padding à mão
 * (topbar, estoque e leads tinham três cópias divergentes). Aqui o
 * botão de limpar é explícito: `type="search"` só mostra o ✕ nativo em
 * alguns navegadores, e o dono não pode ficar preso num filtro sem
 * notar por quê.
 */
export function CampoBusca({
  value,
  onChange,
  placeholder,
  rotulo,
  className = '',
  autoFocus,
}: CampoBuscaProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel-500"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={rotulo}
        className="input h-10 pr-9 pl-9"
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={`Limpar ${rotulo.toLowerCase()}`}
          className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded text-steel-500 transition-colors hover:bg-white/5 hover:text-paper"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}