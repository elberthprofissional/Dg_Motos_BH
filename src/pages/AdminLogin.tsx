import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, CircleAlert, LockKeyhole, Mail } from 'lucide-react'
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
    <div className="grid min-h-dvh grid-cols-1 bg-neutral-950 lg:grid-cols-[1.08fr_0.92fr]">
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

      {/* A área de acesso ocupa o painel inteiro, sem cartão genérico. */}
      <main className="flex min-h-dvh w-full flex-col bg-[#100f0d] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-9 sm:pt-7 lg:px-10 lg:pt-8 xl:px-16">
        <div className="mx-auto flex w-full max-w-[29rem] flex-1 flex-col justify-center py-3 sm:py-5">
          <Link
            to="/"
            aria-label="DG Motos BH — voltar à página inicial"
            className="group mb-5 inline-flex w-fit items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca-texto sm:mb-7 lg:mb-9"
          >
            <img
              src="/logo.webp"
              alt="DG Motos — Realizando Sonhos"
              width={96}
              height={96}
              className="size-[4.5rem] object-contain sm:size-24"
            />
            <span className="border-l-2 border-marca pl-3.5 sm:pl-4">
              <span className="block text-xs font-bold tracking-[0.16em] text-texto uppercase sm:text-sm">
                DG Motos BH
              </span>
              <span className="mt-1 block text-[11px] font-medium tracking-[0.12em] text-texto-3 uppercase">
                Administração
              </span>
            </span>
          </Link>

          <img
            src="/hero/entrada-painel.webp"
            alt=""
            aria-hidden="true"
            className="mb-6 block aspect-[3/2] w-full object-cover object-[45%_57%] sm:mb-8 sm:aspect-[16/9] [@media(max-height:720px)]:aspect-[16/9] lg:hidden"
          />

          <div className="mb-7 sm:mb-9">
            <h1 className="max-w-[12ch] font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-[0.98] font-bold tracking-[-0.04em] text-white">
              Seu estoque.
              <span className="block text-marca-texto">Seu negócio.</span>
            </h1>
            <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-neutral-300 sm:mt-5 sm:text-[17px]">
              Acesse o painel para gerenciar as motos, atualizar anúncios e
              acompanhar seu catálogo.
            </p>
          </div>

          {!disponivel ? (
            <p
              role="status"
              className="border-l-2 border-marca bg-neutral-900 px-4 py-4 text-sm leading-relaxed text-neutral-200"
            >
              Supabase não configurado neste deploy. Copie{' '}
              <code className="text-white">.env.example</code> para{' '}
              <code className="text-white">.env</code> e siga as instruções em{' '}
              <code className="text-white">docs/SUPABASE.md</code>.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-semibold text-neutral-200"
                >
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 w-full rounded-md border border-neutral-700 bg-neutral-950 py-3.5 pr-4 pl-12 text-base text-white transition-colors placeholder:text-neutral-500 focus:border-marca focus:ring-2 focus:ring-marca/25 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-senha"
                  className="mb-2 block text-sm font-semibold text-neutral-200"
                >
                  Senha
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <SenhaInput
                    id="admin-senha"
                    autoComplete="current-password"
                    required
                    placeholder="Digite sua senha"
                    rotulo="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-14 rounded-md border-neutral-700 bg-neutral-950 py-3.5 pr-12 pl-12 text-base text-white placeholder:text-neutral-500 focus:border-marca focus:ring-2 focus:ring-marca/25"
                  />
                </div>
              </div>

              {erro ? (
                <p
                  role="alert"
                  className="flex items-start gap-2.5 border-l-2 border-marca bg-red-950/40 px-4 py-3 text-sm leading-relaxed text-red-100"
                >
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{erro}</span>
                </p>
              ) : null}

              <button
                type="submit"
                disabled={enviando || carregando || !email || !senha}
                aria-busy={enviando || carregando}
                className="group flex min-h-14 w-full cursor-pointer items-center justify-between rounded-md bg-marca px-5 text-base font-bold text-white transition-colors hover:bg-marca-viva focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca-texto disabled:cursor-not-allowed disabled:bg-marca-forte disabled:text-white sm:px-6"
              >
                <span>{enviando ? 'Acessando painel…' : 'Acessar painel'}</span>
                <ArrowRight
                  className="size-5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </form>
          )}
        </div>

        <p className="mx-auto w-full max-w-[29rem] pt-4 text-center text-[13px] tracking-[0.02em] text-neutral-400">
          © {ANO_ATUAL} DG Motos BH · Acesso restrito
        </p>
      </main>
    </div>
  )
}
