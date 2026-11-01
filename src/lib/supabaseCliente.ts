import { createClient } from '@supabase/supabase-js'

/**
 * ============================================================
 * Cliente pesado do Supabase — carregado sob demanda
 * ============================================================
 * Este módulo importa `@supabase/supabase-js` (~200 kB) e por
 * isso NÃO pode entrar no caminho crítico da vitrine. O único
 * ponto de entrada é o dynamic import de `carregarSupabase()`
 * em `supabase.ts`, que só baixa este chunk quando o projeto
 * está configurado no deploy.
 */

const URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/**
 * Cliente pronto para uso, com as credenciais do ambiente.
 *
 * Se as variáveis faltarem, o `createClient` lança no carregamento
 * do módulo — mas `carregarSupabase()` só importa este arquivo
 * depois de checar `supabaseConfigured`, e o `try/catch` dele
 * converte qualquer falha em `null`.
 */
export const cliente = createClient(URL, ANON_KEY)
