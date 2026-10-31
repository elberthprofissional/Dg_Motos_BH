import { Esqueleto } from '../../ui/Esqueleto'

/**
 * Esqueleto da tabela enquanto o banco não responde: quatro linhas do
 * mesmo desenho das reais, para o layout não pular quando chegar.
 */

export function EsqueletoEstoque() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="estoque-linha" role="row" aria-busy="true">
          <span className="sr-only">Carregando veículo</span>
          <div className="estoque-celula-veiculo" role="cell">
            <Esqueleto className="estoque-thumb" />
            <div className="min-w-0 flex-1">
              <Esqueleto className="h-3.5 w-2/5" />
              <Esqueleto className="mt-2 h-3 w-3/5" />
            </div>
          </div>
          <div className="estoque-celula-loja" role="cell">
            <Esqueleto className="h-3 w-14" />
          </div>
          <div className="estoque-celula-valor" role="cell">
            <Esqueleto className="h-3.5 w-24" />
          </div>
          <div className="estoque-celula-acoes" role="cell">
            <Esqueleto className="h-11 w-full max-w-[14rem]" />
          </div>
        </div>
      ))}
    </>
  )
}
