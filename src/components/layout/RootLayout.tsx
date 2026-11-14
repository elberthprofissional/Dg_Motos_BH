import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { BotoesFlutuantes } from '../ui/BotoesFlutuantes'
import { useScrollToTop } from '../../hooks/useScroll'
import { useCanonical } from '../../hooks/useCanonical'
import { CatalogoContexto } from '../../hooks/useCatalogo'
import type { EstadoCatalogo } from '../../hooks/useCatalogo'
import { SiteConfigProvider } from '../../hooks/SiteConfigProvider'
import { buscarCatalogo } from '../../lib/catalog'
import { supabaseConfigured } from '../../lib/supabase'

export function RootLayout() {
  useScrollToTop()
  // Canonical de todas as rotas da vitrine, montado a partir de SITE_URL.
  // Fica aqui (e não em cada página) para nenhuma rota nova esquecer.
  useCanonical()

  return (
    <div className="flex min-h-dvh flex-col bg-fundo">
      <a href="#conteudo" className="pular-para-conteudo">
        Pular para o conteúdo
      </a>

      {/* A config é lida uma vez para a vitrine inteira; o catálogo faz
          o mesmo por conta própria. Ambos abraçam o cabeçalho, o miolo
          e o rodapé. */}
      <SiteConfigProvider>
        <CatalogoProvider>
          <Header />
          {/* Coluna: a página pode crescer para ocupar a sobra de altura
              (páginas curtas) e empurrar o último bloco até o rodapé. */}
          <main id="conteudo" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
            <Outlet />
          </main>
          <Footer />
          {/* Botões fixos só na vitrine: as rotas de admin ficam fora
              deste layout e levam a tela limpa, sem CTA de loja. */}
          <BotoesFlutuantes />
        </CatalogoProvider>
      </SiteConfigProvider>
    </div>
  )
}

/**
 * Busca o catálogo uma vez e reparte por contexto.
 *
 * A única fonte de estoque é o Supabase. Sem banco configurado ou com
 * o banco fora do ar, a vitrine exibe o estado vazio com honestidade —
 * não há catálogo setado no código para esconder a queda.
 */
function CatalogoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoCatalogo>({
    motos: [],
    carregando: supabaseConfigured,
    doBanco: false,
  })

  useEffect(() => {
    if (!supabaseConfigured) return

    let ativo = true
    buscarCatalogo()
      .then((r) => {
        if (!ativo) return
        // Um catálogo vazio no banco é intencional (owner removeu tudo)
        // e precisa ser respeitado. Sem fallback estático: o que vier
        // do banco é o que existe.
        setEstado({ motos: r.motos, carregando: false, doBanco: r.doBanco })
      })
      // Rede de segurança: nenhuma falha pode deixar a vitrine
      // eternamente em "carregando" — declara indisponível e vazia.
      .catch(() => {
        if (ativo) setEstado({ motos: [], carregando: false, doBanco: false })
      })

    return () => {
      ativo = false
    }
  }, [])

  return <CatalogoContexto value={estado}>{children}</CatalogoContexto>
}
