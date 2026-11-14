import { usePageMeta } from '../hooks/usePageMeta'
import { Button } from '../components/ui/Button'

export function NotFound() {
  usePageMeta('Página não encontrada | DG Motos')

  return (
    <div className="flex min-h-[70vh] items-center pt-cabecalho">
      <div className="container-site">
        <p className="numeros text-sm font-medium text-texto-3">Erro 404</p>
        <h1 className="titulo mt-3 text-texto">Esta página não existe</h1>
        <p className="corpo mt-4 max-w-[46ch] text-texto-2">
          O endereço pode estar errado ou a moto pode ter saído do estoque. O
          catálogo continua aberto.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button to="/estoque">Ver o estoque</Button>
          <Button to="/" variant="outline">
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  )
}
