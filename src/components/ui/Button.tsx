import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'outline' | 'ghost'

/**
 * Botão do site e do painel.
 *
 * Retangular e sem brilho: a forma de um botão de oficina. A
 * hierarquia vem da variante, não do raio — `primary` é a chapa de
 * sinal, `outline` é contorno, `ghost` é só o texto.
 *
 * As classes vêm do sistema (`.btn` e variantes) em vez de serem
 * reescritas aqui: assim o botão do site e o do painel do dono são
 * literalmente o mesmo objeto, e mexer no sistema muda os dois.
 */
const variants: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-secondary',
  ghost: 'btn-ghost',
}

const sizes = {
  md: 'h-11 px-5',
  lg: 'h-12 px-6 text-sm',
}

interface CommonProps {
  variant?: Variant
  size?: keyof typeof sizes
  className?: string
  children: React.ReactNode
}

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined; href?: undefined }

type ButtonAsLink = CommonProps & { to: string; href?: undefined }

/** Variante `<a>`: aceita os atributos de âncora (target, rel, download...). */
type ButtonAsAnchor = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; to?: undefined }

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref,
) {
  const cls = ['btn', variants[variant], sizes[size], className].filter(Boolean).join(' ')

  if ('to' in rest && rest.to) {
    const { to, ...linkRest } = rest as ButtonAsLink
    return (
      <Link to={to} className={cls} {...(linkRest as object)}>
        {children}
      </Link>
    )
  }

  if ('href' in rest && rest.href) {
    const { href, ...anchorRest } = rest as ButtonAsAnchor
    return (
      <a href={href} className={cls} {...(anchorRest as object)}>
        {children}
      </a>
    )
  }

  return (
    <button
      ref={ref}
      className={cls}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )
})
