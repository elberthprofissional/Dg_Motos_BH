import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

export function Campo({
  id,
  rotulo,
  dica,
  erro,
  children,
}: {
  id: string
  rotulo: string
  dica?: ReactNode
  erro?: string | null
  children: ReactNode
}) {
  return (
    <div className="mesa-campo">
      <label htmlFor={id} className="mesa-campo-rotulo">
        {rotulo}
      </label>
      {children}
      {dica ? (
        <p id={`${id}-dica`} className="mesa-campo-dica">
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mesa-campo-erro">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {erro}
        </p>
      ) : null}
    </div>
  )
}
