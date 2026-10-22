import type { ReactNode } from 'react'

interface SectionHeadingProps {
  title: string
  description?: string
  /** Conteúdo à direita do título (link de ação, contador...). */
  acao?: ReactNode
  className?: string
}

/**
 * Cabeçalho de seção.
 *
 * Sem eyebrow e sem filete: o rótulo miúdo e a régua de 1 px eram
 * exatamente os enfeites que a direção da casa proíbe. O que fica é
 * o que organiza a leitura — o título, a frase que o segura e, quando
 * existe, a ação.
 */
export function SectionHeading({
  title,
  description,
  acao,
  className = '',
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="max-w-2xl">
        <h2 className="titulo text-texto">{title}</h2>
        {description ? (
          <p className="corpo mt-4 text-texto-2">{description}</p>
        ) : null}
      </div>

      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  )
}
