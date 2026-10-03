import { createClient } from '@supabase/supabase-js'
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

let client: SupabaseClient | null = null

/**
 * Cliente do Supabase, ou `null` se o projeto não estiver configurado.
 *
 * Espere `null` e degrade — não tente chamar métodos em cima dele.
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null
  client ??= createClient(URL!, ANON_KEY!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })
  return client
}

/** Mesmo cliente, mas lança erro em vez de devolver `null`. */
export function requireSupabase(): SupabaseClient {
  const sb = getSupabase()
  if (!sb) {
    throw new Error(
      'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env (veja .env.example).',
    )
  }
  return sb
}

/** Nome do bucket de fotos. */
export const BUCKET_FOTOS = 'motos'

/** Monta a URL pública de uma foto do Storage. */
export function urlPublica(caminho: string): string {
  const sb = getSupabase()
  if (!sb) return caminho
  return sb.storage.from(BUCKET_FOTOS).getPublicUrl(caminho).data.publicUrl
}