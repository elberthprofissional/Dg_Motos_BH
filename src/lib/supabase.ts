import type { SupabaseClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL?.trim()
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * Indica se o Supabase está configurado neste deploy.
 *
 * O site precisa funcionar sem ele: o catálogo tem um fallback estático
 * (src/data/motorcycles.ts) e os formulários abrem o WhatsApp direto.
 * Sem esta guarda, um build sem .env quebraria a página inteira.
 */
export const supabaseConfigured: boolean = Boolean(URL && ANON_KEY)

/**
 * ============================================================
 * O cliente pesado entra só sob demanda
 * ============================================================
 * Este módulo é leve e pode ser importado no caminho crítico da
 * vitrine. O cliente de verdade mora em `supabaseCliente.ts`
 * (~200 kB) e só baixa quando alguém espera esta promise.
 */

/**
 * Cliente do Supabase, ou `null` se o projeto não estiver
 * configurado (ou se o chunk falhar a baixar — rede).
 *
 * Espere `null` e degrade — não tente chamar métodos em cima dele.
 */
export async function carregarSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured) return null
  try {
    const { cliente } = await import('./supabaseCliente')
    return cliente
  } catch {
    return null
  }
}

/** Nome do bucket de fotos. */
export const BUCKET_FOTOS = 'motos'
export const BUCKET_ENTREGAS = 'entregas'

/**
 * Monta a URL pública de uma foto do Storage, sem precisar do
 * cliente: é só interpolação como o `getPublicUrl` faz. Fica
 * sincrono de propósito — é chamado direto no JSX das galerias.
 */
export function urlPublica(caminho: string): string {
  if (!supabaseConfigured) return caminho
  const origem = (URL ?? '').replace(/\/+$/, '')
  const caminhoLimpo = caminho.replace(/^\/+/, '')
  return `${origem}/storage/v1/object/public/${BUCKET_FOTOS}/${caminhoLimpo}`
}
