import { useState } from 'react'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  /** eager = primeira dobra; lazy = resto da página */
  priority?: boolean
  width?: number
  height?: number
}

/**
 * Imagem com polimento de carregamento:
 * - shimmer animado enquanto carrega
 * - fade-in suave quando termina
 * - fallback para placeholder se o arquivo não existir
 */
export function SmartImage({
  src,
  alt,
  className = '',
  priority = false,
  width,
  height,
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // `src` muda ao trocar de moto na mesma rota (ex.: "vistas recentemente"),
  // então o estado precisa ser reiniciado para a imagem nova aparecer.
  const [ultimoSrc, setUltimoSrc] = useState(src)
  if (src !== ultimoSrc) {
    setUltimoSrc(src)
    if (status !== 'loading') setStatus('loading')
  }

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {status !== 'loaded' && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 block bg-gradient-to-r from-night-800 via-night-700 to-night-800 bg-[length:200%_100%] ${
            status === 'loading' ? 'animate-shimmer' : ''
          }`}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`size-full object-cover transition-opacity duration-500 ${
          status === 'loaded' ? 'opacity-100' : status === 'error' ? 'opacity-100' : 'opacity-0'
        }`}
        {...(status === 'error' ? { src: PLACEHOLDER_CARD } : {})}
      />
    </span>
  )
}
