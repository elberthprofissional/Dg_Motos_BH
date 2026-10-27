import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { EVENTO_CONFIG, lerConfig, lerConfigDoBanco, lerConfigLocal } from '../lib/configLoja'
import type { ConfigLoja } from '../lib/configLoja'
import { getSupabase } from '../lib/supabase'
import { SiteConfigContexto } from './siteConfigContexto'

/**
 * Fonte única da configuração da loja na vitrine.
 *
 * Ordem de prioridade: banco (`site_settings`) → localStorage → valores
 * de fábrica em `src/data/site.ts`. A leitura do banco acontece uma vez
 * por montagem do layout, e o evento `EVENTO_CONFIG` mantém a tela em
 * sincronia quando o dono salva no painel.
 */
export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigLoja>(() => lerConfig())
  const [carregando, setCarregando] = useState<boolean>(() => Boolean(getSupabase()))
  const [doBanco, setDoBanco] = useState(false)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!getSupabase()) return

      const doBancoConfig = await lerConfigDoBanco()
      if (!ativo) return

      if (doBancoConfig) {
        setConfig(doBancoConfig)
        setDoBanco(true)
      }
      setCarregando(false)
    }

    void carregar()

    const aoMudar = () => {
      const local = lerConfigLocal()
      if (local) {
        setConfig(local)
        return
      }
      void carregar()
    }

    window.addEventListener(EVENTO_CONFIG, aoMudar)
    return () => {
      ativo = false
      window.removeEventListener(EVENTO_CONFIG, aoMudar)
    }
  }, [])

  const valor = useMemo(
    () => ({ config, carregando, doBanco }),
    [config, carregando, doBanco],
  )

  return <SiteConfigContexto value={valor}>{children}</SiteConfigContexto>
}
