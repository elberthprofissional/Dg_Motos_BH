import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CircleAlert, LockKeyhole, Mail } from 'lucide-react'
import { SenhaInput } from '../components/ui/SenhaInput'
import { useAuth } from '../hooks/authContexto'

const ANO_ATUAL = new Date().getFullYear()

/**
 * Tela de acesso do dono — split screen.
 *
 * No desktop a tela divide em duas colunas: a foto do pátio cobre a
 * metade esquerda inteira e o painel escuro da direita fica só com o
 * formulário, centralizado — sem logo, manchete ou cartão flutuante
 * (a marca já está na foto). No celular a entrada é um cartão —
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
            Gerencie todo o seu negócio em um lugar só.
          </p>
        </div>
      </aside>

      {/* Área de acesso. No celular a foto NÃO é um bloco: é o fundo
          inteiro da tela, com véu escuro — marca no topo, form centrado
          com respiro, rodapé discreto. Nada empilhado: uma camada só,
          como num app nativo. A partir de lg a foto some de novo e
          volta o par de colunas aprovado (showroom + painel). */}
      <main className="relative flex min-h-dvh w-full flex-col bg-[#100f0d]">
        {/* Fundo fotográfico + véu: dois elementos absolutos que só
            existem abaixo de lg. O véu é mais pesado onde o form
            senta (baixo/meio) e quase transparente no topo pro
            showroom aparecer. */}
        <img
          src="/hero/entrada-painel.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-center lg:hidden"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,15,13,0.4)_0%,rgba(16,15,13,0.52)_38%,rgba(16,15,13,0.78)_74%,#100f0d_100%)] lg:hidden"
        />

        <div className="relative mx-auto flex w-full max-w-[29rem] flex-1 flex-col justify-center px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 sm:px-9 sm:pt-7 lg:max-w-none lg:px-16 lg:py-8">
          {/* Logo — só no celular, onde ela abre a tela. No desktop a
              marca já está na foto do showroom, à esquerda. */}
          <Link
            to="/"
            aria-label="DG Motos BH — voltar à página inicial"
            className="group mb-8 inline-flex w-fit items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca-texto lg:hidden"
          >
            <img
              src="/logo.webp"
              alt="DG Motos — Realizando Sonhos"
              width={112}
              height={112}
              className="size-14 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            />
            <span className="border-l-2 border-marca pl-3 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
              <span className="block text-sm font-bold tracking-[0.16em] text-white uppercase">
                DG Motos BH
              </span>
              <span className="mt-0.5 block text-xs font-medium tracking-[0.12em] text-white/70 uppercase">
                Administração
              </span>
            </span>
          </Link>

          <div className="mx-auto flex w-full max-w-[29rem] flex-col items-stretch lg:max-w-md">
            {/* Headline só no celular, onde ela abre a tela como um app.
                No desktop o painel fica só com o formulário — a manchete
                continua no documento (leitor de tela e SEO), escondida
                atrás de sr-only. */}
            <div className="mb-8 lg:mb-0">
              <h1 className="max-w-[12ch] font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.98] font-bold tracking-[-0.04em] text-white lg:sr-only">
                Bem-vindo
                <span className="block text-marca-texto">de volta.</span>
              </h1>
            </div>

            {/* Saudação do desktop: o cartaz da marca, centralizado
                acima dos campos, com a linha de apoio embaixo. Só a
                partir de lg — no celular a manchete já cumprimenta. */}
            <div className="mb-7 hidden flex-col items-center text-center lg:flex">
              <h2 className="cartaz text-[length:clamp(2.25rem,3.4vw,3.25rem)] text-white">
                Bem-vindo de volta
              </h2>
              <p className="mt-3 text-sm text-neutral-400">
                Faça login para continuar
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
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7" noValidate>
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-3.5 pr-4 pl-12 text-base text-white transition-colors focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
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
                      rotulo="Senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="h-14 rounded-xl border border-neutral-800 bg-neutral-900/80 py-3.5 pr-12 pl-12 text-base text-white transition-colors focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
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
                  className="flex min-h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-marca px-5 text-base font-bold text-white transition-colors hover:bg-marca-viva focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca-texto disabled:cursor-not-allowed disabled:bg-marca-forte disabled:text-white sm:px-6"
                >
                  <span>{enviando ? 'Entrando…' : 'Entrar'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* relative: o véu da foto é absoluto e pintaria por cima deste
            parágrafo não posicionado — o © sumiria no celular. */}
        <p className="relative mx-auto w-full max-w-[29rem] px-6 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-[13px] tracking-[0.02em] text-neutral-400 sm:px-9 lg:pb-0">
          © {ANO_ATUAL} DG Motos BH · Acesso restrito
        </p>
      </main>
    </div>
  )
}
