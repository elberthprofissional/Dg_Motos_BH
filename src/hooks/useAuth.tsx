import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, supabaseConfigured } from '../lib/supabase'
import { AuthContexto } from './authContexto'
import { traduzirErroLogin } from '../lib/authErros'

/**
 * Sessão do dono.
 *
 * A sessão vive no localStorage (o próprio Supabase Auth cuida disso),
 * então o login sobrevive ao fechar o navegador. `carregando` evita
 * renderizar a tela de login antes do Supabase responder — sem isso a
 * rota /admin piscaria login a cada refresh.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(supabaseConfigured)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return

    let vivo = true

    sb.auth.getSession().then(({ data }) => {
      if (!vivo) return
      setSessao(data.session)
      setCarregando(false)
    })

    // Mantém o estado em sincronia com login, logout e token renovado.
    const { data: sub } = sb.auth.onAuthStateChange((_evento, nova) => {
      setSessao(nova)
      setCarregando(false)
    })

    return () => {
      vivo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function entrar(email: string, senha: string): Promise<string | null> {
    const sb = getSupabase()
    if (!sb) return 'Supabase não configurado.'
    const { error } = await sb.auth.signInWithPassword({ email, password: senha })
    return error ? traduzirErroLogin(error) : null
  }

  async function sair(): Promise<void> {
    await getSupabase()?.auth.signOut()
    setSessao(null)
  }

  async function enviarReset(email: string): Promise<string | null> {
    const sb = getSupabase()
    if (!sb) return 'Supabase não configurado.'
    // Redireciona de volta para a área restrita, na tela de nova senha.
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/redefinir`,
    })
    return error ? traduzirErroLogin(error) : null
  }

  async function redefinirSenha(senha: string): Promise<string | null> {
    const sb = getSupabase()
    if (!sb) return 'Supabase não configurado.'
    const { error } = await sb.auth.updateUser({ password: senha })
    return error ? traduzirErroLogin(error) : null
  }

  return (
    <AuthContexto
      value={{ sessao, carregando, disponivel: supabaseConfigured, entrar, sair, enviarReset, redefinirSenha }}
    >
      {children}
    </AuthContexto>
  )
}