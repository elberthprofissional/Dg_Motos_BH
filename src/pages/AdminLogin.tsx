import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { SenhaInput } from '../components/ui/SenhaInput'
import { useAuth } from '../hooks/authContexto'

/**
 * Tela de acesso do dono.
 *
 * No celular continua sendo a entrada direta de sempre: logo, dois
 * campos e o botão, sem cartão em volta. No desktop a tela vira uma
 * porta de showroom — a foto do pátio ocupa a metade esquerda e o
 * formulário flutua num cartão de vidro sobre a metade direita.
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
    <div className="flex min-h-dvh bg-fundo lg:grid lg:grid-cols-2">
      {/* Desktop: a metade do showroom. A foto cobre a coluna inteira e
          os gradientes fundem a borda direita com o formulário e
          protegem a leitura do texto no canto inferior. */}
      <aside className="relative hidden overflow-hidden lg:block">
        {/* Foto: Unsplash (licença livre), origem em img/hero-login-noite.jpg */}
        <img
          src="/hero/entrada-painel.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.08)_52%,rgba(0,0,0,0.94)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.24)_46%,transparent_72%)]"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col justify-end p-12 xl:p-16">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-marca/40 bg-marca/15 px-3 py-1.5 font-sans text-[11px] font-semibold tracking-[0.16em] text-marca-texto uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-marca" />
            Painel do dono / admin
          </span>

          <p className="display mt-5 text-6xl text-white xl:text-7xl">
            Realizando Sonhos
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Curadoria de motocicletas seminovas em Belo Horizonte.
            Inspeção, laudo cautelar e negociação direta na loja.
          </p>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-10 lg:px-10 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_70%_18%,rgba(229,22,29,0.12),transparent_48%)] lg:block"
          aria-hidden="true"
        />

        <div className="w-full max-w-sm lg:relative lg:max-w-md lg:rounded-3xl lg:border lg:border-borda lg:bg-painel/70 lg:p-10 lg:shadow-2xl lg:backdrop-blur-xl">
          {/* Logo da loja — clique volta ao site */}
          <Link
            to="/"
            aria-label="DG Motos — voltar à página inicial"
            className="mx-auto block w-fit lg:mx-0"
          >
            <img
              src="/logo.webp"
              alt="DG Motos"
              width={96}
              height={96}
              className="size-24 object-contain lg:size-28"
            />
          </Link>

          <h1 className="etiqueta mt-8 text-center text-texto lg:mt-8 lg:text-left lg:font-display lg:text-xl lg:font-bold lg:tracking-[-0.02em] lg:normal-case lg:text-white">
            Acesso Restrito
          </h1>
          <p className="mt-2 hidden text-xs text-texto-3 lg:block">
            Insira suas credenciais para gerenciar o pátio
          </p>

          {!disponivel ? (
            <p className="mt-5 border border-brand-500/40 bg-brand-500/10 px-3 py-2.5 text-center text-xs leading-relaxed text-steel-300 lg:rounded-xl">
              Supabase não configurado neste deploy. Copie <code>.env.example</code> para{' '}
              <code>.env</code> e veja <code>docs/SUPABASE.md</code>.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-3 lg:mt-8 lg:space-y-4"
              noValidate
            >
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-4 hidden size-4 -translate-y-1/2 text-texto-3 lg:block"
                  aria-hidden="true"
                />
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
                  className="input lg:h-12 lg:rounded-xl lg:bg-fundo/80 lg:pl-11 lg:text-sm"
                />
              </div>

              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute top-1/2 left-4 z-10 hidden size-4 -translate-y-1/2 text-texto-3 lg:block"
                  aria-hidden="true"
                />
                <SenhaInput
                  id="admin-senha"
                  autoComplete="current-password"
                  required
                  placeholder="Senha"
                  rotulo="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="lg:h-12 lg:rounded-xl lg:bg-fundo/80 lg:pl-11 lg:text-sm"
                />
              </div>

              {erro && (
                <p role="alert" className="pt-1 text-center text-xs leading-relaxed text-brand-500">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando || carregando || !email || !senha}
                className="btn btn-primary mt-2 w-full cursor-pointer lg:mt-6 lg:h-12 lg:rounded-xl lg:text-sm lg:font-bold lg:shadow-lg lg:shadow-marca/20 lg:hover:shadow-marca/30"
              >
                {enviando ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="pt-2 text-center lg:pt-4">
                <Link
                  to="/admin/esqueci"
                  className="inline-block py-1 text-xs text-steel-400 transition-colors hover:text-marca-texto"
                >
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
