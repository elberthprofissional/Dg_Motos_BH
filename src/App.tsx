import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { Home } from './pages/Home'
import { AuthProvider } from './hooks/useAuth'
import { RotaAdmin } from './pages/AdminGuard'

// Páginas divididas em chunks próprios: só o que o visitante realmente
// acessa é baixado. Home fica no bundle inicial (é a entrada do site).
const Estoque = lazy(() => import('./pages/Estoque').then((m) => ({ default: m.Estoque })))
const BikeDetail = lazy(() => import('./pages/BikeDetail').then((m) => ({ default: m.BikeDetail })))
const Financiamento = lazy(() =>
  import('./pages/Financiamento').then((m) => ({ default: m.Financiamento })),
)
const Troca = lazy(() => import('./pages/Troca').then((m) => ({ default: m.Troca })))
const Sobre = lazy(() => import('./pages/Sobre').then((m) => ({ default: m.Sobre })))
const Contato = lazy(() => import('./pages/Contato').then((m) => ({ default: m.Contato })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

// Painel do dono: fora do bundle público, junto com o SDK do Supabase.
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))
const AdminLogin = lazy(() => import('./pages/AdminLogin').then((m) => ({ default: m.AdminLogin })))
const AdminEsqueci = lazy(() =>
  import('./pages/AdminEsqueci').then((m) => ({ default: m.AdminEsqueci })),
)
const AdminRedefinir = lazy(() =>
  import('./pages/AdminEsqueci').then((m) => ({ default: m.AdminRedefinir })),
)

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">Carregando página</span>
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-500"
      />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="moto/:slug" element={<BikeDetail />} />
            <Route path="financiamento" element={<Financiamento />} />
            <Route path="troca" element={<Troca />} />
            <Route path="sobre" element={<Sobre />} />
            <Route path="contato" element={<Contato />} />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Área restrita do proprietário. Fica fora do RootLayout de
              propósito: um painel de gestão não deve exibir o menu da
              vitrine nem o rodapé da loja. */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/esqueci" element={<AdminEsqueci />} />
          <Route path="/admin/redefinir" element={<AdminRedefinir />} />
          <Route
            path="/admin"
            element={
              <RotaAdmin>
                <Admin />
              </RotaAdmin>
            }
          />
        </Routes>
      </AuthProvider>
    </Suspense>
  )
}