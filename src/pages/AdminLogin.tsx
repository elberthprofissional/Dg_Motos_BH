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
    // `entrar` faz as duas coisas: cria a sessão e pergunta ao banco
    // se a conta está em public.admins. Conta fora da lista é deslogada
    // ali mesmo, e a mensagem volta por aqui. Sem esta checagem, qualquer
    // usuário do projeto abriria a casca do painel (vazia, mas aberta).
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
      <aside className="relative hidden h-full w-full overflow-hidden bg-noite lg:block">
        {/* Foto: Unsplash (licença livre), origem em img/hero-login-noite.jpg.
            O recorte puxa a coluna para 46% da largura, onde a moto senta
            melhor que no centro puro. O brilho sobe um tico para a moto e
            o "DG" pintado na parede não sumirem no preto. */}
        <img
          src="/hero/entrada-painel.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-[46%_center] [filter:brightness(1.12)_saturate(1.04)]"
        />
        {/* Véu só onde o texto senta (pé da foto) e um leve levante na
            borda esquerda; o miolo do quadro fica limpo para a cena. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,9,11,0.97)_0%,rgba(8,9,11,0.72)_26%,rgba(8,9,11,0.18)_56%,transparent_80%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,11,0.52)_0%,rgba(8,9,11,0.08)_36%,transparent_58%)]"
        />

        {/* Sinalização: o fio de 1 px na borda, como o batente de uma
            porta de oficina. */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-white/10" />

        <div className="relative flex h-full flex-col justify-end p-12 xl:p-16">
          <p className="cartaz max-w-[36rem] text-[length:clamp(3.25rem,5.2vw,5.75rem)] text-white">
            Realizando
            <span className="block text-marca-texto">sonhos</span>
          </p>
          {/* Régua de largura total: fecha a composição como uma ficha
              técnica, em vez de parar no meio do quadro. */}
          <div aria-hidden="true" className="mt-8 h-px w-full bg-white/15" />
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2">
            <p className="max-w-[34ch] text-sm leading-relaxed text-white/70">
              Sua loja inteira num lugar só: estoque, vendas, publicações e configurações.
            </p>
            <p className="text-[10px] font-medium tracking-[0.24em] text-white/60 uppercase">
              Belo Horizonte · MG
            </p>
          </div>
        </div>
      </aside>

      {/* Área de acesso. No celular a foto NÃO é um bloco: é o fundo
          inteiro da tela, com véu escuro — marca no topo, form centrado
          com respiro, rodapé discreto. Nada empilhado: uma camada só,
          como num app nativo. A partir de lg a foto some de novo e
          volta o par de colunas aprovado (showroom + painel). */}
      {/* O painel do acesso usa o mesmo cinza do quadro de "Sonhos
          realizados" no site (bg-noite-2), em vez do preto quente que
          estava aqui — a bancada combina com a vitrine. */}
      <main className="relative flex min-h-dvh w-full flex-col bg-noite-2">
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
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,21,24,0.4)_0%,rgba(20,21,24,0.52)_38%,rgba(20,21,24,0.78)_74%,#141518_100%)] lg:hidden"
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

          <div className="entrada-painel mx-auto flex w-full max-w-[29rem] flex-col items-stretch lg:max-w-[26rem]">
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

            {/* Saudação do desktop: composição editorial alinhada à
                esquerda, com o fio vermelho abrindo o bloco. Só a partir
                de lg — no celular a manchete já cumprimenta. */}
            <div className="mb-8 hidden flex-col lg:flex lg:mb-10">
              <span aria-hidden="true" className="mb-7 block h-[3px] w-12 bg-marca" />
              <h2 className="cartaz text-[length:clamp(2.6rem,3.4vw,3.5rem)] text-white">
                Bem-vindo
                <span className="block text-marca-texto">de volta.</span>
              </h2>
              <p className="mt-5 max-w-[32ch] text-sm leading-relaxed text-noite-texto-2">
                Área restrita. Entre com o e-mail e a senha do responsável pela loja.
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
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7 lg:space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-semibold text-neutral-200 lg:mb-2.5 lg:text-[11px] lg:font-semibold lg:tracking-[0.16em] lg:text-noite-texto-2 lg:uppercase"
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
                      className="h-14 w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-3.5 pr-4 pl-12 text-base text-white transition-colors focus:border-marca focus:ring-1 focus:ring-marca/50 focus:outline-none lg:h-12 lg:border-noite-borda lg:bg-noite lg:py-2.5 lg:text-[15px]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-senha"
                    className="mb-2 block text-sm font-semibold text-neutral-200 lg:mb-2.5 lg:text-[11px] lg:font-semibold lg:tracking-[0.16em] lg:text-noite-texto-2 lg:uppercase"
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
                      className="h-14 rounded-xl border border-neutral-800 bg-neutral-900/80 py-3.5 pr-12 pl-12 text-base text-white transition-colors focus:border-marca focus:ring-1 focus:ring-marca/50 focus:outline-none lg:h-12 lg:border-noite-borda lg:bg-noite lg:py-2.5 lg:text-[15px]"
                    />
                  </div>
                </div>

                {erro ? (
                  <p
                    role="alert"
                    className="flex items-start gap-2.5 border-l-2 border-marca bg-marca/10 px-4 py-3 text-sm leading-relaxed text-marca-texto lg:items-center lg:border lg:border-l lg:border-marca/40 lg:px-3.5 lg:py-3 lg:text-[13px]"
                  >
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{erro}</span>
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={enviando || carregando || !email || !senha}
                  aria-busy={enviando || carregando}
                  className="group flex min-h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-marca px-5 text-base font-bold text-white transition-colors hover:bg-marca-viva focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca-texto disabled:cursor-not-allowed disabled:bg-marca-forte disabled:text-white sm:px-6 lg:min-h-12 lg:justify-between lg:px-5 lg:text-[12px] lg:tracking-[0.16em] lg:uppercase"
                >
                  <span>{enviando ? 'Entrando…' : 'Entrar'}</span>
                  <ArrowRight
                    className="hidden size-4 transition-transform group-hover:translate-x-0.5 lg:block"
                    aria-hidden="true"
                  />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* relative: o véu da foto é absoluto e pintaria por cima deste
            parágrafo não posicionado — o © sumiria no celular. */}
        <div className="relative mx-auto w-full max-w-[29rem] px-6 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-[13px] tracking-[0.02em] text-neutral-400 sm:px-9 lg:flex lg:max-w-none lg:items-center lg:justify-between lg:border-t lg:border-white/10 lg:px-16 lg:pt-5 lg:pb-8 lg:text-left lg:text-[11px] lg:tracking-[0.06em]">
          <p>
            © {ANO_ATUAL} DG Motos BH
            <span className="lg:hidden"> · Acesso restrito</span>
          </p>
          <p className="hidden text-[10px] tracking-[0.22em] text-white/55 uppercase lg:block">
            Acesso restrito
          </p>
        </div>
      </main>
    </div>
  )
}
