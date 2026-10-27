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
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-fundo px-5 py-10"
      data-tema="painel"
    >
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

        <h1 className="etiqueta mt-8 text-center text-texto">Recuperar acesso</h1>

        {enviado ? (
          <div className="mt-5 text-center">
            <p className="text-sm leading-relaxed text-paper">
              Se <strong className="font-semibold">{email}</strong> estiver cadastrado, o link de
              redefinição já foi enviado.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-steel-400">
              Abra o e-mail e clique no link para criar uma senha nova. Confira também o spam.
            </p>
            <Link
              to="/admin/login"
              className="mt-6 inline-block py-1 text-xs text-steel-400 transition-colors hover:text-paper"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
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
className="btn btn-primary mt-2 w-full"
            >
              {enviando ? 'Enviando...' : 'Enviar link'}
            </button>

            <div className="pt-2 text-center">
              <Link to="/admin/login" className="inline-block py-1 text-xs text-steel-400 transition-colors hover:text-paper">
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
 * recuperação. O Supabase detecta o token na URL (`detectSessionInUrl`)
 * e abre a sessão de recuperação; `updateUser` troca a senha nela.
 *
 * Sem sessão (link vencido, já usado ou aberto noutro navegador) a tela
 * explica o motivo e oferece pedir outro, em vez de deixar o dono
 * digitando uma senha que o banco vai recusar.
 */
export function AdminRedefinir() {
  const { redefinirSenha, carregando, sessao } = useAuth()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const senhasDivergentes = confirmar.length > 0 && confirmar !== senha
  const linkInvalido = !carregando && !sessao

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
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-fundo px-5 py-10"
      data-tema="painel"
    >
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

        <h1 className="etiqueta mt-8 text-center text-texto">Criar senha nova</h1>

        {linkInvalido ? (
          <div className="mt-5 text-center">
            <p className="text-sm leading-relaxed text-paper">
              Este link de recuperação não é mais válido.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-steel-400">
              Links expiram e só podem ser usados uma vez. Peça um novo para o e-mail do painel.
            </p>
            <Link to="/admin/esqueci" className="btn btn-primary mt-6 w-full">
              Pedir novo link
            </Link>
            <div className="pt-4">
              <Link
                to="/admin/login"
                className="inline-block py-1 text-xs text-steel-400 transition-colors hover:text-paper"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
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
              className="btn btn-primary mt-2 w-full"
            >
              {salvando ? 'Salvando...' : 'Salvar senha'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
