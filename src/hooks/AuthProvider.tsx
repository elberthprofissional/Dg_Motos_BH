import { useEffect, useRef, useState } from 'react'
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
/**
 * Resposta da checagem de admin, atrelada ao id de quem perguntou.
 *
 * `ehAdmin: null` = perguntou e o banco não respondeu. Trocar de conta
 * zera o valor derivado, porque o id não casa mais.
 */
interface Acesso {
  usuarioId: string
  ehAdmin: boolean | null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(supabaseConfigured)
  const [acesso, setAcesso] = useState<Acesso | null>(null)
  // Incrementado por `reverificarAcesso` para perguntar ao banco de novo.
  const [rodadaChecagem, setRodadaChecagem] = useState(0)
  // Conta para a qual já existe resposta pronta. `entrar()` pergunta
  // antes do efeito rodar, e a guarda evita a segunda chamada — mas o
  // "tentar de novo" limpa este marcador, senão o retry seria engolido.
  const respondidoRef = useRef<string | null>(null)

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
    if (respondidoRef.current === usuarioId) return

    let vivo = true
    void consultarSeAdmin().then((resultado) => {
      if (!vivo) return
      respondidoRef.current = usuarioId
      // `null` = não deu para perguntar (banco fora do ar, rede
      // instável, RPC ausente). Fechado por padrão: sem resposta
      // positiva o painel não abre. Abrir com "provavelmente é o
      // dono" mostraria uma tela inteira de edição para qualquer
      // conta autenticada numa falha transitória — e, se a RPC não
      // existe, a migration que a cria é a mesma que põe o RLS no
      // lugar, então a exceção não protege ninguém.
      setAcesso({ usuarioId, ehAdmin: resultado })
    })

    return () => {
      vivo = false
    }
  }, [usuarioId, rodadaChecagem])

  /** Pergunta de novo ao banco quando o acesso ficou sem confirmar. */
  function reverificarAcesso() {
    respondidoRef.current = null
    setAcesso(null)
    setRodadaChecagem((n) => n + 1)
  }

  // Tudo aqui é derivado da sessão e da resposta: conta diferente ignora
  // a resposta antiga sem precisar de efeito resetando estado.
  const acessoDestaConta = usuarioId && acesso?.usuarioId === usuarioId ? acesso : null
  const admin = acessoDestaConta?.ehAdmin ?? null
  // Só é "incerto" quando o banco foi perguntado e não respondeu —
  // enquanto a resposta não chega, `admin === null` e a guarda mostra
  // o carregamento.
  const acessoIncerto = acessoDestaConta !== null && acessoDestaConta.ehAdmin === null

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

    // Sessão criada não é o mesmo que acesso ao painel: só conta em
    // public.admins entra. A resposta alimenta o mesmo estado que a
    // guarda lê — sem esta chamada, a tela de login mandaria qualquer
    // conta autenticada para a casca do painel.
    const idLogado = data.session.user.id
    const resultado = await consultarSeAdmin()
    respondidoRef.current = idLogado

    if (resultado === false) {
      setAcesso(null)
      respondidoRef.current = null
      await getSupabase()?.auth.signOut()
      setSessao(null)
      return 'Esta conta não tem acesso ao painel. Entre com o e-mail do dono da loja.'
    }

    setAcesso({ usuarioId: idLogado, ehAdmin: resultado })
    return null
  }

  async function sair(): Promise<void> {
    await getSupabase()?.auth.signOut()
    setSessao(null)
    setAcesso(null)
    respondidoRef.current = null
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
        acessoIncerto,
        reverificarAcesso,
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