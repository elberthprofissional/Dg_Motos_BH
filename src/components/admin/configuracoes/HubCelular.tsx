import { Check, ChevronRight, Download } from 'lucide-react'
import type { ConfigLoja } from '../../../lib/configLoja'
import { SECOES, secaoSuja } from './dados'
import type { Secao } from './dados'

/**
 * ============================================================
 * HUB DE BLOCOS (CELULAR)
 * ============================================================
 * Lista de blocos que abre a ficha de cada um, mais o convite
 * de instalação do app do painel.
 */

export function HubCelular({
  config,
  salvo,
  onAbrir,
  appInstalado,
  onAbrirInstalacao,
}: {
  config: ConfigLoja
  salvo: ConfigLoja
  onAbrir: (proxima: Secao) => void
  appInstalado: boolean
  onAbrirInstalacao: () => void
}) {
  return (
    <>
      <div className="mesa-hub">
        {SECOES.map((bloco, indice) => {
          const suja = bloco.id !== 'lixeira' && secaoSuja(bloco.id, config, salvo)

          return (
            <button
              key={bloco.id}
              type="button"
              onClick={() => onAbrir(bloco.id)}
              className={`mesa-hub-item ${bloco.id === 'lixeira' ? 'mesa-hub-item--perigo' : ''}`}
            >
              <span className="mesa-hub-indice" aria-hidden="true">
                {String(indice + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="mesa-hub-rotulo">
                  {bloco.rotulo}
                  {suja ? (
                    <span className="mesa-nav-pendente" title="Alterações não salvas">
                      <span className="sr-only">Alterações não salvas</span>
                    </span>
                  ) : null}
                </span>
              </span>
              <ChevronRight className="mesa-hub-seta size-4" aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <div className="mesa-app mesa-app--mobile">
        <div className="mesa-app-texto">
          <p className="mesa-app-titulo">Aplicativo do painel</p>
          <p className="mesa-app-nota">
            {appInstalado
              ? 'Instalado neste aparelho.'
              : 'Abre em tela cheia, direto da tela inicial do celular.'}
          </p>
        </div>
        <button type="button" onClick={onAbrirInstalacao} className="mesa-btn-secundario">
          {appInstalado ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          {appInstalado ? 'Instalado' : 'Instalar app'}
        </button>
      </div>
    </>
  )
}
