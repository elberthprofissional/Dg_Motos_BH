import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import type { ConfigLoja } from '../../../lib/configLoja'
import { SECOES, secaoSuja } from './dados'
import type { Secao } from './dados'

/**
 * ============================================================
 * ÍNDICE LATERAL DA MESA (DESKTOP)
 * ============================================================
 * Tablist vertical enxuta: número e rótulo — o mesmo desenho do
 * hub do celular, sem a linha de valor embaixo.
 * Navegação por setas: roteie entre blocos com ↑ ↓ ← → (e
 * Home/End) sem sair do grupo. Somente a aba ativa entra na
 * ordem de tabulação (roving tabindex).
 */

export function IndiceDesktop({
  secaoAtiva,
  config,
  salvo,
  totalLixeira,
  onAbrir,
  onTecla,
  abaRefs,
}: {
  secaoAtiva: Secao
  config: ConfigLoja
  salvo: ConfigLoja
  totalLixeira: number
  onAbrir: (proxima: Secao) => void
  onTecla: (evento: ReactKeyboardEvent<HTMLButtonElement>, indice: number) => void
  abaRefs: MutableRefObject<(HTMLButtonElement | null)[]>
}) {
  return (
    <nav
      className="mesa-nav"
      role="tablist"
      aria-label="Blocos de ajuste"
      aria-orientation="vertical"
    >
      {SECOES.map((bloco, indice) => {
        const selecionada = bloco.id === secaoAtiva
        const suja = bloco.id !== 'lixeira' && secaoSuja(bloco.id, config, salvo)

        return (
          <button
            key={bloco.id}
            ref={(elemento) => {
              abaRefs.current[indice] = elemento
            }}
            id={`aba-${bloco.id}`}
            type="button"
            role="tab"
            aria-selected={selecionada}
            aria-controls={`painel-${bloco.id}`}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => onAbrir(bloco.id)}
            onKeyDown={(evento) => onTecla(evento, indice)}
            className={`mesa-nav-item ${bloco.id === 'lixeira' ? 'mesa-nav-item--perigo' : ''}`}
          >
            <span className="mesa-nav-indice" aria-hidden="true">
              {String(indice + 1).padStart(2, '0')}
            </span>
            <span className="mesa-nav-texto">
              <span className="mesa-nav-rotulo">
                {bloco.rotulo}
                {suja ? (
                  <span className="mesa-nav-pendente" title="Alterações não salvas">
                    <span className="sr-only">Alterações não salvas</span>
                  </span>
                ) : null}
              </span>
            </span>
            {bloco.id === 'lixeira' && totalLixeira > 0 ? (
              <span className="mesa-nav-contagem">
                {totalLixeira}
                <span className="sr-only"> na lixeira</span>
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
