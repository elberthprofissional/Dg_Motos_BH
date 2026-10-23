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