import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'outline' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-display text-xs font-semibold tracking-[0.18em] uppercase transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'border border-[#d91f32] bg-[#d91f32] text-[#f5f5f5] hover:bg-[#b71c2b] hover:border-[#b71c2b]',
  outline:
    'border border-white/25 text-[#f5f5f5] hover:border-white/60 hover:bg-white/5',
  ghost: 'text-[#a3a3a3] hover:text-[#f5f5f5]',
}

const sizes = {
  md: 'px-5 py-2.5',
  lg: 'px-6 py-3 text-base',
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
  const cls = [base, variants[variant], sizes[size], className].filter(Boolean).join(' ')

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
