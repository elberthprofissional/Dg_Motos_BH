/**
 * Esqueleto de carregamento.
 *
 * O painel buscava as motos no mount. Até responder,
 * a tela mostrava um parágrafo com spinner e depois o conteúdo pulava
 * de altura. O esqueleto reserva o mesmo espaço do conteúdo final: sem
 * salto de layout e sem parecer quebrado.
 */
export function Esqueleto({ className = '' }: { className?: string }) {
  return <div className={`esqueleto ${className}`} aria-hidden="true" />
}

/** Lista de N linhas com imagem e duas linhas de texto — o formato do estoque. */
export function EsqueletoLinha({ itens = 4 }: { itens?: number }) {
  return (
    <div className="space-y-2.5 sm:space-y-3" role="status" aria-label="Carregando">
      <span className="sr-only">Carregando...</span>
      {Array.from({ length: itens }, (_, i) => (
        <div key={i} className="card flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          <Esqueleto className="h-16 w-24 shrink-0 sm:h-20 sm:w-28" />
          <div className="flex-1 space-y-2">
            <Esqueleto className="h-4 w-1/3" />
            <Esqueleto className="h-3 w-1/4" />
            <Esqueleto className="h-5 w-20" />
          </div>
          <Esqueleto className="hidden h-6 w-28 shrink-0 sm:block" />
        </div>
      ))}
    </div>
  )
}