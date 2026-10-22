import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SenhaInput } from '../components/ui/SenhaInput'
import { useAuth } from '../hooks/authContexto'

/**
 * Tela de acesso do dono — estilo minimalista (referência: Instagram).
 * Logo e formulário direto no fundo escuro, sem card de fundo; campos
 * só com placeholder e botão sólido de largura total.
 *
 * Sem link no Header/Footer de propósito: a área restrita não deve ser
 * anunciada; o dono acessa digitando /admin.
 */
export function AdminLogin() {
  const { entrar, sessao, carregando, disponivel } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const falha = await entrar(email.trim(), senha)
    setEnviando(false)
    if (falha) {
      setErro(falha)
      return
    }
    // Autenticado: entra no painel. Sem esta linha o login dava certo mas
    // a tela de acesso continuava na frente, e o dono só percebia depois
    // de voltar ao site e clicar no login do rodapé.
    navigate('/admin', { replace: true })
  }

  // Sessão já ativa (ex.: voltou pelo botão "anterior" do navegador):
  // mostra o painel direto em vez de pedir a senha de novo.
  if (!carregando && sessao) return <Navigate to="/admin" replace />

  return (
    <div
      className="flex min-h-dvh bg-fundo lg:grid lg:grid-cols-2"
      data-tema="painel"
    >
      {/* Desktop: a metade do material — a foto do showroom escurecida
          com a marca de facing por cima. A foto fica atrás da letra;
          a logo não precisa de preto puro, ela é traço branco. No
          celular esta metade não existe: o formulário manda sozinho,
          como manda. */}
      <aside className="relative hidden lg:block">
        {/* Foto: Unsplash (licença livre), origem em img/hero-login-noite.jpg */}
        <img
          src="/hero/entrada-painel.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <p className="etiqueta text-texto-2">Painel do dono</p>
          <div>
            <p className="display text-6xl text-texto">Realizando Sonhos</p>
            <p className="corpo mt-4 max-w-md text-texto-2">
              Curadoria de motocicletas seminovas em Belo Horizonte.
              Inspeção, laudo cautelar e negociação direta na loja.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
        {/* Logo da loja — clique volta ao site */}
        <Link
          to="/"
          aria-label="DG Motos — voltar à página inicial"
          className="mx-auto block w-fit"
        >
          <img
            src="/logo.webp"
            alt="DG Motos"
            width={96}
            height={96}
            className="size-24 object-contain"
          />
        </Link>

        <h1 className="etiqueta mt-8 text-center text-texto">Acesso restrito</h1>

        {!disponivel ? (
          <p className="mt-5 border border-brand-500/40 bg-brand-500/10 px-3 py-2.5 text-center text-xs leading-relaxed text-steel-300">
            Supabase não configurado neste deploy. Copie <code>.env.example</code> para{' '}
            <code>.env</code> e veja <code>docs/SUPABASE.md</code>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
            {/* Campos no estilo Instagram: só o placeholder, sem card em volta */}
            <input
              id="admin-email"
              type="email"
              name="email"
              autoComplete="username"
              autoFocus
              required
              placeholder="E-mail"
              aria-label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <SenhaInput
              id="admin-senha"
              autoComplete="current-password"
              required
              placeholder="Senha"
              rotulo="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            {erro && (
              <p role="alert" className="pt-1 text-center text-xs leading-relaxed text-brand-500">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || carregando || !email || !senha}
              className="btn btn-primary mt-2 w-full"
            >
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="pt-2 text-center">
              <Link to="/admin/esqueci" className="inline-block py-1 text-xs text-steel-400 transition-colors hover:text-paper">
                Esqueceu a senha?
              </Link>
            </div>
          </form>
        )}
        </div>
      </main>
    </div>
  )
}
