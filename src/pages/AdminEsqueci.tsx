import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SenhaInput } from '../components/ui/SenhaInput'
import { useAuth } from '../hooks/authContexto'

/**
 * Tela "Esqueceu a senha?" — pede o e-mail e envia o link de
 * recuperação do Supabase. O link cai em /admin/redefinir com a
 * sessão de recuperação, onde o dono define a senha nova.
 */
export function AdminEsqueci() {
  const { enviarReset } = useAuth()
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const falha = await enviarReset(email)
    if (falha) setErro(falha)
    else setEnviado(true)
    setEnviando(false)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <main className="w-full max-w-sm">
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

        {enviado ? (
          <div className="mt-8 text-center">
            <p className="text-sm leading-relaxed text-paper">
              Se <strong className="font-semibold">{email}</strong> estiver cadastrado, o link de
              redefinição já foi enviado.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-steel-400">
              Abra o e-mail e clique no link para criar uma senha nova. Confira também o spam.
            </p>
            <Link
              to="/admin/login"
              className="mt-6 inline-block text-xs text-steel-400 transition-colors hover:text-paper"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-3" noValidate>
            <p className="text-center text-xs leading-relaxed text-steel-400">
              Digite o e-mail do painel e enviaremos um link para criar uma senha nova.
            </p>

            <input
              id="reset-email"
              type="email"
              autoComplete="username"
              required
              placeholder="E-mail"
              aria-label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />

            {erro && (
              <p role="alert" className="pt-1 text-center text-xs leading-relaxed text-brand-500">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || !email}
              className="mt-2 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar link'}
            </button>

            <div className="pt-2 text-center">
              <Link to="/admin/login" className="text-xs text-steel-400 transition-colors hover:text-paper">
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}

/**
 * Tela de nova senha — o dono chega aqui pelo link do e-mail de
 * recuperação. O Supabase detecta o token na URL e abre a sessão de
 * recuperação; `updateUser` troca a senha nela.
 */
export function AdminRedefinir() {
  const { redefinirSenha, carregando } = useAuth()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const senhasDivergentes = confirmar.length > 0 && confirmar !== senha

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (senhasDivergentes) {
      setErro('As senhas não coincidem.')
      return
    }
    setSalvando(true)
    const falha = await redefinirSenha(senha)
    if (falha) {
      setErro(falha)
      setSalvando(false)
      return
    }
    // Senha trocada: manda direto para o painel.
    navigate('/admin', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <main className="w-full max-w-sm">
        <Link to="/" aria-label="DG Motos — voltar à página inicial" className="mx-auto block w-fit">
          <img
            src="/logo.webp"
            alt="DG Motos"
            width={96}
            height={96}
            className="size-24 object-contain"
          />
        </Link>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3" noValidate>
          <p className="text-center text-xs leading-relaxed text-steel-400">
            Crie uma senha nova para o painel.
          </p>

          <SenhaInput
            id="nova-senha"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Nova senha"
            rotulo="Nova senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <SenhaInput
            id="confirmar-senha"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Confirmar nova senha"
            rotulo="Confirmar nova senha"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />
          {senhasDivergentes && (
            <p className="text-xs text-steel-400">As senhas não coincidem.</p>
          )}

          {erro && (
            <p role="alert" className="pt-1 text-center text-xs leading-relaxed text-brand-500">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={salvando || carregando || !senha || !confirmar}
            className="mt-2 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar senha'}
          </button>
        </form>
      </main>
    </div>
  )
}
