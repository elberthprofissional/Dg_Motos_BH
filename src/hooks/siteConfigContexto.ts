import { useEffect, useMemo, useState } from 'react'
import { EVENTO_CONFIG, lerConfig, lerConfigDoBanco, lerConfigLocal } from '../lib/configLoja'
import type { ConfigLoja } from '../lib/configLoja'
import { getSupabase } from '../lib/supabase'

/**
 * Configuração da loja para a vitrine.
 *
 * Ordem de prioridade: banco (site_settings) → localStorage → src/data/site.ts.
 * Escuta EVENTO_CONFIG para atualizar na hora quando editado no painel.
 */

export interface EstadoSiteConfig {
  config: ConfigLoja
  carregando: boolean
  doBanco: boolean
}

export function useSiteConfig(): EstadoSiteConfig {
  const [config, setConfig] = useState<ConfigLoja>(() => lerConfigLocal() ?? lerConfig())
  const [carregando, setCarregando] = useState<boolean>(!!getSupabase())
  const [doBanco, setDoBanco] = useState<boolean>(false)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!getSupabase()) {
        setCarregando(false)
        setDoBanco(false)
        return
      }

      const doBancoConfig = await lerConfigDoBanco()
      if (!ativo) return

      if (doBancoConfig) {
        setConfig(doBancoConfig)
        setDoBanco(true)
      }
      setCarregando(false)
    }

    carregar()

    const aoMudar = () => {
      const local = lerConfigLocal()
      if (local) {
        setConfig(local)
        return
      }
      carregar()
    }

    window.addEventListener(EVENTO_CONFIG, aoMudar)
    return () => {
      ativo = false
      window.removeEventListener(EVENTO_CONFIG, aoMudar)
    }
  }, [])

  return useMemo(
    () => ({ config, carregando, doBanco }),
    [config, carregando, doBanco],
  )
}
