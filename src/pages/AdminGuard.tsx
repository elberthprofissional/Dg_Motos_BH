import { Navigate } from 'react-router-dom'
import { Lock, ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/authContexto'
import { Button } from '../components/ui/Button'

/**
 * Guarda de rota da área restrita.
 *
 * Espera a sessão resolver antes de decidir: redirecionar para o login
 * enquanto `carregando` faria o dono cair no login a cada F5.
 *
 * Quando o Supabase não está configurado no build, mostra instruções em
 * vez de redirecionar — assim o developer não acha que o login quebrou.
 */
export function RotaAdmin({ children }: { children: React.ReactNode }) {
  const { sessao, carregando, disponivel, admin, sair } = useAuth()

  if (!disponivel) {
    return (
      <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <Lock className="size-8 text-brand-500" aria-hidden="true" />
        <h1 className="titulo mt-4 text-2xl">Área restrita desativada</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-steel-400">
          Este build não tem o Supabase configurado. Para habilitar o painel, copie{' '}
          <code className="text-steel-300">.env.example</code> para{' '}
          <code className="text-steel-300">.env</code> com a URL e a chave do
          projeto. Veja <code className="text-steel-300">docs/SUPABASE.md</code>.
        </p>
        <Button to="/" variant="outline" className="mt-8">
          Voltar ao site
        </Button>
      </div>
    )
  }

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <span className="sr-only">Verificando sessão</span>
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-2 border-claro/15 border-t-brand-500"
        />
      </div>
    )
  }

  if (!sessao) return <Navigate to="/admin/login" replace />

  // Sessão válida, mas ainda perguntando ao banco se a conta é admin.
  if (admin === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <span className="sr-only">Verificando acesso ao painel</span>
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-2 border-claro/15 border-t-brand-500"
        />
      </div>
    )
  }

  // Conta autenticada fora de public.admins: o RLS já a impediria de
  // ler ou gravar, então o painel não abre — só a saída.
  if (!admin) {
    return (
      <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="size-8 text-brand-500" aria-hidden="true" />
        <h1 className="titulo mt-4 text-2xl">Esta conta não abre o painel</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-steel-400">
          O login de <strong className="text-steel-300">{sessao.user.email}</strong> deu certo,
          mas essa conta não está na lista de administradores da loja. Se você é o dono,
          confira o e-mail usado no acesso.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => void sair()}>Sair desta conta</Button>
          <Button to="/" variant="outline">
            Voltar ao site
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
