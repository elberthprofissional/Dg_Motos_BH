/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do projeto Supabase. Vazio = site usa o catálogo estático. */
  readonly VITE_SUPABASE_URL?: string
  /** Chave anon/publishable. NUNCA a service_role. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}