/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do projeto Supabase. Vazio = site usa o catálogo estático. */
  readonly VITE_SUPABASE_URL?: string
  /** Chave anon/publishable. NUNCA a service_role. */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /**
   * Deploy hook da Vercel/Netlify, para o botão "Publicar site".
   * Ficará visível no bundle: veja o aviso em docs/SUPABASE.md.
   */
  readonly VITE_DEPLOY_HOOK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}