import { Navigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
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
  const { sessao, carregando, disponivel } = useAuth()

  if (!disponivel) {
    return (
      <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <Lock className="size-8 text-brand-500" aria-hidden="true" />
        <h1 className="h-display mt-4 text-2xl">Área restrita desativada</h1>
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
          className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-500"
        />
      </div>
    )
  }

  if (!sessao) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}