import { createContext, use } from 'react'
import type { Session } from '@supabase/supabase-js'

/**
 * Contrato do contexto de sessão.
 *
 * Fica num arquivo só de tipos/constants (sem componente) para não
 * atrapalhar o Fast Refresh do Vite, que não funciona quando um arquivo
 * exporta componente e hook ao mesmo tempo.
 */
export interface EstadoAuth {
  sessao: Session | null
  /** `true` enquanto o Supabase ainda não respondeu a consulta de sessão. */
  carregando: boolean
  /** `false` quando o .env não tem as chaves do Supabase. */
  disponivel: boolean
  /** Resolve com a mensagem de erro, ou `null` em caso de sucesso. */
  entrar: (email: string, senha: string) => Promise<string | null>
  sair: () => Promise<void>
  /** Envia o e-mail de recuperação com link para /admin/redefinir. */
  enviarReset: (email: string) => Promise<string | null>
  /** Define a nova senha usando a sessão de recuperação. */
  redefinirSenha: (senha: string) => Promise<string | null>
}

export const AuthContexto = createContext<EstadoAuth | null>(null)

export function useAuth(): EstadoAuth {
  const ctx = use(AuthContexto)
  if (!ctx) throw new Error('useAuth precisa estar dentro do <AuthProvider>')
  return ctx
}