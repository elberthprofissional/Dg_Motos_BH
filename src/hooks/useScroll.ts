import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/** Rola para o topo a cada troca de rota. */
export function useScrollToTop(): void {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
}

/**
 * Some com a barra do topo ao descer e a traz de volta ao subir — o
 * gesto dos apps (Instagram, navegador): a barra aparece quando o
 * usuário procura por ela e libera a tela quando ele só quer ler.
 * Perto do topo ela sempre volta, para não deixar a página começar
 * sem navegação.
 */
export function useBarraEscondida(limiar = 80, folga = 6): boolean {
  const [escondida, setEscondida] = useState(false)

  useEffect(() => {
    let anterior = window.scrollY

    const onScroll = () => {
      const atual = window.scrollY
      if (atual <= limiar) {
        setEscondida(false)
      } else if (atual > anterior + folga) {
        setEscondida(true)
      } else if (atual < anterior - folga) {
        setEscondida(false)
      }
      anterior = atual
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [limiar, folga])

  return escondida
}

/**
 * `true` enquanto a página está sendo rolada; volta a `false` depois de
 * `espera` ms sem nenhum evento de scroll. É o gesto dos apps: a barra
 * sai de cena durante o arrasto e reaparece quando a mão para.
 */
export function useRolando(espera = 260): boolean {
  const [rolando, setRolando] = useState(false)

  useEffect(() => {
    let temporizador: number | undefined

    const onScroll = () => {
      setRolando(true)
      window.clearTimeout(temporizador)
      temporizador = window.setTimeout(() => setRolando(false), espera)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(temporizador)
    }
  }, [espera])

  return rolando
}

/** Indica se a página foi rolada além de um limiar (px). */
export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
