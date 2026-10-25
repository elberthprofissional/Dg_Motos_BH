import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { Entrada } from './pages/Entrada'
import { AuthProvider } from './hooks/useAuth'
import { RotaAdmin } from './pages/AdminGuard'

// Páginas divididas em chunks próprios: só o que o visitante realmente
// acessa é baixado. Home fica no bundle inicial (é a entrada do site).
const Estoque = lazy(() => import('./pages/Estoque').then((m) => ({ default: m.Estoque })))
const BikeDetail = lazy(() => import('./pages/BikeDetail').then((m) => ({ default: m.BikeDetail })))
const Contato = lazy(() => import('./pages/Contato').then((m) => ({ default: m.Contato })))
const Sonhos = lazy(() => import('./pages/Sonhos').then((m) => ({ default: m.Sonhos })))
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
        className="size-8 animate-spin rounded-full border-2 border-claro/15 border-t-brand-500"
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
            {/* No app instalado "/" cai no login; no navegador, na
                vitrine. Ver src/pages/Entrada.tsx. */}
            <Route index element={<Entrada />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="moto/:slug" element={<BikeDetail />} />
            <Route path="contato" element={<Contato />} />
            <Route path="sonhos" element={<Sonhos />} />

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