import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

interface RevelarProps {
  children: ReactNode
  className?: string
  /**
   * 'folha'  — o bloco sobe da bancada (transform + opacity).
   * 'bancada' — o bloco apenas aparece (só opacity).
   *
   * O movimento é do material: folha de papel pousa, bancada apenas
   * acende.
   */
  variante?: 'folha' | 'bancada'
  /** Elemento renderizado. 'div' por padrão. */
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
  /** Atraso em ms — para escalonar itens da mesma lista. */
  atraso?: number
}

/**
 * Revelação por rolagem.
 *
 * O gesto só acontece uma vez, quando o bloco entra na tela. Duas
 * garantias importam:
 *
 * 1. Nada pisca na montagem. O estado inicial é decidido no
 *    `useLayoutEffect`, antes do primeiro paint: o bloco que já está
 *    visível aparece sem animação, e o que está fora da tela começa
 *    escondido. Sem isso o HTML chegaria visível e depois piscaria.
 * 2. Se o JavaScript falhar ou o bloco nunca for observado, o conteúdo
 *    aparece mesmo assim. O `IntersectionObserver` é o caminho normal;
 *    o tempo limite é a rede de segurança.
 */
export function Revelar({
  children,
  className = '',
  variante = 'folha',
  as: Tag = 'div',
  atraso = 0,
}: RevelarProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [estado, setEstado] = useState<'oculto' | 'visivel'>('visivel')

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Quem pede menos movimento não recebe animação nenhuma: o
    // conteúdo aparece pronto.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const caixa = el.getBoundingClientRect()
    // Ja estava na tela (ou acima dela): sem animação, sem atraso.
    if (caixa.top < window.innerHeight * 0.92 && caixa.bottom > 0) return

    setEstado('oculto')
  }, [])

  useEffect(() => {
    if (estado !== 'oculto') return
    const el = ref.current
    if (!el) return

    let observador: IntersectionObserver | null = null
    const mostrar = () => setEstado('visivel')

    if ('IntersectionObserver' in window) {
      observador = new IntersectionObserver(
        (entradas) => {
          for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue
            mostrar()
            observador?.disconnect()
            return
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
      )
      observador.observe(el)
    } else {
      mostrar()
      return
    }

    // Rede de segurança: se nada acontecer em 2,5 s, mostra.
    const relogio = window.setTimeout(() => {
      mostrar()
      observador?.disconnect()
    }, 2500)

    return () => {
      window.clearTimeout(relogio)
      observador?.disconnect()
    }
  }, [estado])

  const classes = [
    estado === 'oculto' ? (variante === 'folha' ? 'revelar-folha' : 'revelar') : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag
      ref={ref as never}
      className={classes}
      data-visivel={estado === 'visivel' ? 'true' : 'false'}
      style={atraso ? { transitionDelay: `${atraso}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
