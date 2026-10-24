import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { SenhaInput } from '../components/ui/SenhaInput'
import { useAuth } from '../hooks/authContexto'

const ANO_ATUAL = new Date().getFullYear()

/**
 * Tela de acesso do dono — split screen.
 *
 * No desktop a tela divide em duas colunas: a foto do pátio cobre a
 * metade esquerda inteira e o formulário vive direto no painel escuro
 * da direita, sem cartão flutuante. No celular a entrada é um cartão —
 * foto de captação no topo, "Bem-vindo de volta" e os campos —
 * registrado num rodapé discreto de ©.
 *
 * Escrito mobile-first: o cartão é o estado base; a partir de lg ele
 * se desmancha e o formulário vira painel solto; a metade do showroom
 * à esquerda aparece só no desktop.
 *
 * Sem Google, Facebook ou cadastro: a área restrita tem uma única
 * porta, e-mail e senha do dono.
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
    <div className="grid min-h-screen grid-cols-1 bg-neutral-950 lg:grid-cols-2">
      {/* Esquerda: a metade do showroom. Some antes de lg — no celular a
          foto única do cartão faz o papel de "entrada". A foto cobre a
          coluna inteira e o overlay escuro suave protege o texto. */}
      <aside className="relative hidden h-full w-full overflow-hidden lg:block">
        {/* Foto: Unsplash (licença livre), origem em img/hero-login-noite.jpg */}
        <img
          src="/hero/entrada-painel.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.22)_46%,transparent_72%)]"
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

      {/* Direita: base = cartão do celular; do lg pra cima o formulário
          integra o painel, sem cartão. */}
      <main className="flex w-full flex-col px-6 py-8 lg:px-12 lg:py-0 xl:px-16">
        <div className="flex w-full flex-1 flex-col items-center justify-center py-6">
          <div className="w-full max-w-sm">
            {/* Logo da loja — clique volta ao site. No celular o cartão
                já abre com a foto, então a logo só aparece no desktop. */}
            <Link
              to="/"
              aria-label="DG Motos — voltar à página inicial"
              className="mx-auto mb-10 hidden w-fit lg:block"
            >
              <img
                src="/logo.webp"
                alt="DG Motos"
                width={48}
                height={48}
                className="h-12 w-auto object-contain"
              />
            </Link>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
              {/* Foto de captação no topo do cartão (só no celular) */}
              <img
                src="/hero/entrada-painel.webp"
                alt=""
                aria-hidden="true"
                className="mb-6 block h-40 w-full rounded-xl object-cover object-center lg:hidden"
              />

              {/* Boas-vindas — o tom da referência, alinhado Ã esquerda */}
              <div className="mb-6">
                <h1 className="text-2xl leading-tight font-semibold text-white">
                  Bem-vindo de volta{' '}
                  <span aria-hidden="true">👋</span>
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                  Hoje é um bom dia pra cuidar do pátio. Entre para gerenciar
                  o estoque e as configurações da loja.
                </p>
              </div>

              {!disponivel ? (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs leading-relaxed text-neutral-300">
                  Supabase não configurado neste deploy. Copie <code>.env.example</code> para{' '}
                  <code>.env</code> e veja <code>docs/SUPABASE.md</code>.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="mb-1.5 block text-xs font-medium text-neutral-300"
                    >
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-500"
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
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3.5 pr-11 pl-11 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-red-600 focus:ring-1 focus:ring-red-600/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-senha"
                      className="mb-1.5 block text-xs font-medium text-neutral-300"
                    >
                      Senha
                    </label>
                    <div className="relative">
                      <LockKeyhole
                        className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-neutral-500"
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
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3.5 pr-10 pl-11 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-red-600 focus:ring-1 focus:ring-red-600/30 focus:outline-none"
                      />
                    </div>

                    {/* O "Esqueceu a senha?" fica colado à senha,
                        alinhado à direita, como na referência. */}
                    <div className="mt-2 flex justify-end">
                      <Link
                        to="/admin/esqueci"
                        className="inline-block py-1 text-xs text-neutral-400 transition-colors hover:text-white"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                  </div>

                  {erro && (
                    <p role="alert" className="text-xs leading-relaxed text-red-500">
                      {erro}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enviando || carregando || !email || !senha}
                    className="w-full cursor-pointer rounded-xl bg-red-600 py-3.5 font-bold text-sm text-white transition-all hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {enviando ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <p className="pb-2 text-center text-[11px] text-neutral-600">
          © {ANO_ATUAL} DG Motos — Todos os direitos reservados.
        </p>
      </main>
    </div>
  )
}
