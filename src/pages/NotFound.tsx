import { usePageMeta } from '../hooks/usePageMeta'
import { Button } from '../components/ui/Button'

export function NotFound() {
  usePageMeta('Página não encontrada | DG Motos')

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 pt-cabecalho text-center">
      <p className="display text-7xl text-marca-texto sm:text-8xl">404</p>
      <h1 className="titulo mt-5 text-3xl text-texto sm:text-4xl">
        Essa estrada não existe
      </h1>
      <p className="corpo mt-4 max-w-md">
        A página que você tentou abrir não existe ou mudou de endereço. Volte ao
        início ou veja o estoque.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/">Voltar ao início</Button>
        <Button to="/estoque" variant="outline">
          Ver o estoque
        </Button>
      </div>
    </div>
  )
}
