import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_URL } from '../data/site'

/**
 * Canonical de cada rota da vitrine.
 *
 * O `scripts/prerender.mjs` já grava um canonical estático nas fichas de
 * moto. As outras rotas (home, /estoque, /contato) não são pré-renderizadas,
 * e sem canonical o Google pode tratar o site próprio e o endereço da Vercel
 * como duas cópias da mesma página.
 *
 * A URL sai sempre de `SITE_URL` (src/data/site.ts), então trocar o domínio
 * não exige mexer em nenhum componente. A barra final é normalizada: só a
 * home a mantém, para `/estoque/` e `/estoque` não virarem dois endereços.
 */
export function useCanonical(): void {
  const { pathname } = useLocation()

  useEffect(() => {
    const caminho = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
    const url = `${SITE_URL}${caminho}`

    let tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!tag) {
      tag = document.createElement('link')
      tag.rel = 'canonical'
      document.head.appendChild(tag)
    }
    tag.href = url
  }, [pathname])
}
