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
        <p className="etiqueta text-marca-texto">Falha inesperada</p>
        <h1 className="titulo mt-3 text-3xl text-texto">Algo saiu do eixo</h1>
        <p className="corpo mt-3 max-w-md text-texto-2">
          A página não conseguiu carregar por completo. Recarregue para tentar de novo;
          se o site acabou de ser atualizado, isso costuma resolver.
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
      </div>
    )
  }
}
