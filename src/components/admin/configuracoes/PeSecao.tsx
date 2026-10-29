import { Loader2, RefreshCw } from 'lucide-react'
import type { ConfigLoja } from '../../../lib/configLoja'
import { metaDaSecao, secaoSuja } from './dados'
import type { SecaoConfig } from './dados'

interface PeSecaoProps {
  id: SecaoConfig
  config: ConfigLoja
  salvo: ConfigLoja
  sincronizando: boolean
  salvando: SecaoConfig | null
  falhaBanco: boolean
  reenviando: boolean
  ultimoSalvoEm: string | null
  onReenviar: () => void
}

/** Barra de gravação do bloco: estado atual + botão de salvar. */
export function PeSecao({
  id,
  config,
  salvo,
  sincronizando,
  salvando,
  falhaBanco,
  reenviando,
  ultimoSalvoEm,
  onReenviar,
}: PeSecaoProps) {
  const meta = metaDaSecao(id)
  const suja = secaoSuja(id, config, salvo)
  const salvandoEste = salvando === id
  const podeTentar = !sincronizando && salvando === null && suja

  return (
    <footer className="mesa-folha-pe">
      <div className="mesa-pe-estado" role="status">
        {sincronizando ? (
          <>
            <span className="mesa-ponto" data-tom="neutro" aria-hidden="true" />
            Lendo dados…
          </>
        ) : salvando ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Gravando {metaDaSecao(salvando).rotulo.toLowerCase()}…
          </>
        ) : suja ? (
          <>
            <span className="mesa-ponto" data-tom="pendente" aria-hidden="true" />
            Alterações neste bloco ainda não foram salvas.
          </>
        ) : falhaBanco ? (
          <>
            <span className="mesa-ponto" data-tom="erro" aria-hidden="true" />
            Salvo neste aparelho. O site não confirmou.
          </>
        ) : ultimoSalvoEm ? (
          <>
            <span className="mesa-ponto" data-tom="ok" aria-hidden="true" />
            Salvo às {ultimoSalvoEm}. O site já usa estes valores.
          </>
        ) : (
          <>Nenhuma alteração pendente.</>
        )}

        {falhaBanco && !suja && !salvando && !sincronizando ? (
          <button
            type="button"
            onClick={onReenviar}
            className="mesa-pe-reenviar"
            aria-disabled={reenviando}
          >
            {reenviando ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-3.5" aria-hidden="true" />
            )}
            {reenviando ? 'Sincronizando…' : 'Sincronizar com o site'}
          </button>
        ) : null}
      </div>

      <div className="mesa-pe-acoes">
        <button
          type="submit"
          className="mesa-btn-salvar"
          aria-disabled={!podeTentar}
          data-salvando={salvandoEste}
          onClick={(evento) => {
            if (!podeTentar) evento.preventDefault()
          }}
        >
          {salvandoEste ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Salvando…
            </>
          ) : (
            meta.rotuloSalvar ?? 'Salvar'
          )}
        </button>
      </div>
    </footer>
  )
}
