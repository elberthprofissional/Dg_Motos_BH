import { useEffect, useState } from 'react'
import { buscarConfigLoja, configPadrao } from '../lib/configLoja'
import type { ConfigLoja } from '../lib/configLoja'
import { SiteConfigContexto } from './siteConfigContexto'
import type { EstadoSiteConfig } from './siteConfigContexto'
import { supabaseConfigured } from '../lib/supabase'

/**
 * ============================================================
 * PROVIDER DA CONFIGURAÇÃO DA LOJA
 * ============================================================
 *
 * Busca a config do Supabase uma vez por sessão (junto com o catálogo,
 * no RootLayout) e distribui para toda a vitrine via useSiteConfig().
 *
 * Enquanto o banco não responde (ou falhou), entrega os defaults de
 * src/data/site.ts — a vitrine nunca fica sem contato.
 *
 * Nota: dentro do /admin, quem edita usa buscarConfigLoja() direto ao
 * salvar/recarregar; este provider existe para a vitrine pública.
 */
export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfigLoja>(() => configPadrao())
  const [carregando, setCarregando] = useState(supabaseConfigured)
  const [doBanco, setDoBanco] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) return

    let vivo = true
    void buscarConfigLoja().then((c) => {
      if (!vivo) return
      setConfig(c)
      setDoBanco(true)
      setCarregando(false)
    })

    return () => {
      vivo = false
    }
  }, [])

  return (
    <SiteConfigContexto value={{ config, carregando, doBanco }}>
      {children}
    </SiteConfigContexto>
  )
}

/** Estado completo (reexportado por conveniência para o admin). */
export type { EstadoSiteConfig }
