import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { falhaDeCarregamento } from '../../lib/erros'

const CHAVE_RECARGA = 'dg-motos-recarregou-chunk'

/** Uma recarga automática por aba: se o chunk continuar faltando, o fallback aparece. */
function podeRecarregar(): boolean {
  try {
    if (sessionStorage.getItem(CHAVE_RECARGA)) return false
    sessionStorage.setItem(CHAVE_RECARGA, '1')
    return true
  } catch {
    // Storage bloqueado (modo privado antigo): não arrisca um loop.
    return false
  }
}

interface Props {
  children: ReactNode
}

interface State {
  erro: Error | null
}

/**
 * Última linha de defesa da aplicação: um erro de render vira uma tela
 * explicativa com ação de recarregar, em vez de página branca.
 */
export class ErroDeRender extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, _info: ErrorInfo): void {
    if (falhaDeCarregamento(erro) && podeRecarregar()) {
      window.location.reload()
    }
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-fundo px-6 text-center">
        {/* Selo de vermelho e título no padrão da casa: rótulo miúdo,
            display com o ponto carimbado — igual ao "Estoque." do
            painel. Sem card, sem ícone grande, sem moldura. */}
        <p className="etiqueta flex items-center justify-center gap-2 text-marca-texto">
          <span className="size-1.5 shrink-0 bg-marca" aria-hidden="true" />
          Falha inesperada
        </p>
        <h1 className="titulo mt-3 text-3xl text-texto sm:text-4xl">
          Algo saiu do eixo
          <span className="text-marca-texto" aria-hidden="true">
            .
          </span>
        </h1>
        <p className="corpo mt-4 max-w-md text-texto-2">
          A página não carregou por completo. Recarregar costuma resolver —
          é comum quando o site acaba de ser atualizado.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary h-11 px-5"
          >
            Recarregar página
          </button>
          <a href="/" className="btn btn-secondary h-11 px-5">
            Ir para a loja
          </a>
        </div>
        <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.18em] text-texto-3">
          DG Motos BH · Belo Horizonte, MG
        </p>
      </div>
    )
  }
}
