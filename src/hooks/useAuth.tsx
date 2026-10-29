import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, supabaseConfigured } from '../lib/supabase'
import { AuthContexto } from './authContexto'
import { traduzirErroLogin } from '../lib/authErros'
import { consultarSeAdmin } from '../lib/adminAcesso'

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
  // Resposta da checagem de admin, atrelada ao id de quem perguntou:
  // trocar de conta zera o valor derivado até a nova resposta chegar.
  const [acesso, setAcesso] = useState<{ usuarioId: string; ehAdmin: boolean } | null>(null)

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

  // A checagem roda uma vez por conta: renovar o token dispara
  // onAuthStateChange, mas o `user.id` continua o mesmo.
  const usuarioId = sessao?.user.id ?? null
  useEffect(() => {
    if (!usuarioId) return

    let vivo = true
    void consultarSeAdmin().then((resultado) => {
      // `null` = não deu para saber; o painel não bloqueia (o RLS barra).
      if (vivo) setAcesso({ usuarioId, ehAdmin: resultado ?? true })
    })

    return () => {
      vivo = false
    }
  }, [usuarioId])

  // Enquanto a resposta não chega — ou quando a conta mudou — o acesso
  // fica indefinido, e a guarda mostra o carregamento em vez de expulsar.
  const admin = usuarioId && acesso?.usuarioId === usuarioId ? acesso.ehAdmin : null

  async function entrar(email: string, senha: string): Promise<string | null> {
    const sb = getSupabase()
    if (!sb) return 'Supabase não configurado.'
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha })
    if (error) return traduzirErroLogin(error)
    // A sessão é gravada aqui, e não só pelo onAuthStateChange: o evento
    // pode chegar depois que a tela de login já redirecionou para /admin,
    // e a guarda veria "sem sessão" — devolvendo o dono para o login.
    setSessao(data.session)
    setCarregando(false)
    return null
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
      value={{
        sessao,
        carregando,
        disponivel: supabaseConfigured,
        admin,
        entrar,
        sair,
        enviarReset,
        redefinirSenha,
      }}
    >
      {children}
    </AuthContexto>
  )
}