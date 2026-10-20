import { useEffect } from 'react'

/**
 * Revela elementos com a classe .reveal ao entrarem na viewport.
 *
 * Usar uma única vez, no layout — o observer varre o documento inteiro,
 * então chamá-lo em cada página criaria observers duplicados.
 *
 * `routeKey` deve mudar a cada navegação (normalmente o `pathname`):
 * o layout permanece montado entre rotas, então é ele que dispara a
 * nova varredura quando o conteúdo da página é substituído.
 */
export function useRevealOnScroll(routeKey: string): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const main = document.getElementById('conteudo') ?? document
    // `.reveal:not(.reveal-visible)` evita reobservar o que já foi revelado.
    const els = main.querySelectorAll<HTMLElement>('.reveal:not(.reveal-visible)')
    if (els.length === 0) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('reveal-visible')
            obs.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12 },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [routeKey])
}
