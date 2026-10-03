import { usePageMeta } from '../hooks/useNavigation'
import { Button } from '../components/ui/Button'

export function NotFound() {
  usePageMeta('Página não encontrada | DG Motos')

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 pt-16 text-center">
      <p className="font-display text-7xl font-semibold text-brand-500">404</p>
      <h1 className="h-display mt-4 text-3xl sm:text-4xl">
        Essa pista não existe
      </h1>
      <p className="mt-3 max-w-md text-steel-400">
        A página que você procura saiu do ar ou nunca existiu. Volte para o
        início ou explore o estoque.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/">Voltar ao início</Button>
        <Button to="/estoque" variant="outline">
          Ver estoque
        </Button>
      </div>
    </div>
  )
}
