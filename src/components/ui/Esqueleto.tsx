/**
 * Esqueleto de carregamento.
 *
 * O painel buscava motos e leads em paralelo no mount. Até responder,
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

/** Bloco genérico para cabeçalho + linhas. */
export function EsqueletoSecao({
  linhas = 3,
  className = '',
}: {
  linhas?: number
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Carregando">
      <span className="sr-only">Carregando...</span>
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

/** Cabeçalho de página enquanto os dados não chegam. */
export function EsqueletoCabecalho() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4" role="status">
      <span className="sr-only">Carregando...</span>
      <div className="hidden space-y-2 sm:block">
        <Esqueleto className="h-7 w-48" />
        <Esqueleto className="h-3 w-32" />
      </div>
      <div className="flex w-full gap-2 sm:w-auto">
        <Esqueleto className="h-10 w-full sm:w-56" />
        <Esqueleto className="h-10 w-full sm:w-36" />
      </div>
    </div>
  )
}

/**
 * Cartões de indicador.
 *
 * O grid espelha o do DashboardTab de propósito: se o esqueleto ocupa
 * outra forma que o conteúdo, o layout salta quando os dados chegam.
 */
export function EsqueletoIndicadores({ itens = 4 }: { itens?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 sm:gap-3 xl:grid-cols-4"
      role="status"
      aria-label="Carregando indicadores"
    >
      <span className="sr-only">Carregando...</span>
      {Array.from({ length: itens }, (_, i) => (
        <div key={i} className="card space-y-3 p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <Esqueleto className="size-8 shrink-0 sm:size-10" />
            <div className="flex-1 space-y-2">
              <Esqueleto className="h-3 w-24" />
              <Esqueleto className="h-6 w-16 sm:h-7" />
              <Esqueleto className="h-3 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}