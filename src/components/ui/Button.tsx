import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'outline' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded font-display text-sm font-semibold tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  outline:
    'border border-white/20 text-paper hover:border-white/40 hover:bg-white/5',
  ghost: 'text-paper hover:bg-white/5',
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
type ButtonAsAnchor = CommonProps & { href: string; to?: undefined }

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
