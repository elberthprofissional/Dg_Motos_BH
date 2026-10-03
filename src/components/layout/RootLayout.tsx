import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { useScrollToTop, useRevealOnScroll } from '../../hooks/useNavigation'
import { CatalogoContexto } from '../../hooks/useCatalogo'
import type { EstadoCatalogo } from '../../hooks/useCatalogo'
import { SiteConfigProvider } from '../../hooks/SiteConfigProvider'
import { buscarCatalogo } from '../../lib/catalog'
import { supabaseConfigured } from '../../lib/supabase'
import { motorcycles as catalogoEstatico } from '../../data/motorcycles'

export function RootLayout() {
  const location = useLocation()
  useScrollToTop()
  // `key` muda a cada navegação, inclusive quando o pathname se repete
  // (ex.: ir e voltar para a mesma rota): o observer precisa reagir ao
  // novo DOM da página.
  useRevealOnScroll(location.key)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteConfigProvider>
        <Header />
        <main id="conteudo" className="flex-1">
          <CatalogoProvider>
            <Outlet />
          </CatalogoProvider>
        </main>
        <Footer />
      </SiteConfigProvider>
    </div>
  )
}

/**
 * Busca o catálogo uma vez e reparte por contexto.
 *
 * Enquanto o banco não responde, entrega o catálogo estático de
 * src/data/motorcycles.ts. Assim o site nunca mostra vitrine vazia, e
 * uma queda do Supabase não derruba a loja — o owner continua vendo o
 * estoque antigo e o visitante ainda navega.
 */
function CatalogoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoCatalogo>({
    motos: catalogoEstatico,
    carregando: supabaseConfigured,
    doBanco: false,
  })

  useEffect(() => {
    if (!supabaseConfigured) return

    let ativo = true
    buscarCatalogo().then((r) => {
      if (!ativo) return
      // `doBanco` já distingue "consulta funcionou" de "falhou". Um
      // catálogo vazio no banco é intencional (owner removeu tudo) e
      // precisa ser respeitado — senão as motos do seed voltariam a
      // aparecer sozinhas. O fallback só entra em caso de falha.
      if (r.doBanco) {
        setEstado({ motos: r.motos, carregando: false, doBanco: true })
      } else {
        setEstado({ motos: catalogoEstatico, carregando: false, doBanco: false })
      }
    })

    return () => {
      ativo = false
    }
  }, [])

  const valor = useMemo(() => estado, [estado])

  return <CatalogoContexto value={valor}>{children}</CatalogoContexto>
}