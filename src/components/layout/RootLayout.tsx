import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { BotoesFlutuantes } from '../ui/BotoesFlutuantes'
import { useScrollToTop } from '../../hooks/useScroll'
import { CatalogoContexto } from '../../hooks/useCatalogo'
import type { EstadoCatalogo } from '../../hooks/useCatalogo'
import { buscarCatalogo } from '../../lib/catalog'
import { supabaseConfigured } from '../../lib/supabase'
import { motorcycles as catalogoEstatico } from '../../data/motorcycles'

export function RootLayout() {
  useScrollToTop()

  return (
    <div className="flex min-h-dvh flex-col bg-fundo">
      <a href="#conteudo" className="pular-para-conteudo">
        Pular para o conteúdo
      </a>

      {/* O provedor abraça o cabeçalho: a barra de cima mostra quantas
          motos estão no estoque agora, e isso vem do mesmo lugar que o
          resto da vitrine lá. */}
      <CatalogoProvider>
        <Header />
        <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
          <Outlet />
        </main>
        <Footer />
        {/* Botões fixos só na vitrine: as rotas de admin ficam fora
            deste layout e levam a tela limpa, sem CTA de loja. */}
        <BotoesFlutuantes />
      </CatalogoProvider>
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
    buscarCatalogo()
      .then((r) => {
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
      // Rede de segurança: nenhuma falha pode deixar a vitrine
      // eternamente em "carregando" — declara indisponível e usa o
      // catálogo estático.
      .catch(() => {
        if (ativo) setEstado({ motos: catalogoEstatico, carregando: false, doBanco: false })
      })

    return () => {
      ativo = false
    }
  }, [])

  return <CatalogoContexto value={estado}>{children}</CatalogoContexto>
}
