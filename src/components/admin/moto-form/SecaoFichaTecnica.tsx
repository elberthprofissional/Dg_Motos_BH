import { Plus, Trash2 } from 'lucide-react'
import type { MotoParaSalvar } from '../../../lib/catalog'
import type { MotorcycleSpec } from '../../../types'
import { campoLinha } from '../campoLinha'
import { Secao } from './Secao'
import { positivoOuNulo, textoInicial } from './valores'

/**
 * ============================================================
 * 3. FICHA TÉCNICA — cilindrada e especificações livres
 * ============================================================
 */

export function SecaoFichaTecnica({
  form,
  onSet,
}: {
  form: MotoParaSalvar
  onSet: <K extends keyof MotoParaSalvar>(chave: K, valor: MotoParaSalvar[K]) => void
}) {
  return (
    <Secao titulo="Ficha técnica">
      <div>
        <label htmlFor="f-cc" className="field-label">Cilindrada (cc)</label>
        <input
          id="f-cc"
          className={campoLinha}
          defaultValue={textoInicial(form.cilindrada)}
          onChange={(e) => onSet('cilindrada', positivoOuNulo(e.target.value))}
          placeholder="Ex.: 291,6"
        />
      </div>

      <div>
        <span className="field-label">Especificações detalhadas</span>
        {form.especificacoes.length > 0 && (
          <ul className="space-y-2">
            {form.especificacoes.map((spec: MotorcycleSpec, i) => (
              /* `1fr 1.4fr auto` de uma vez só não cabe em 320px: os dois campos
                 ficavam com ~55px de área útil e o placeholder ("Mono OHC, 291,6
                 cc") sumia. No celular o rótulo ocupa a linha inteira e o valor
                 divide espaço com o botão de remover; do `sm` em diante volta a
                 linha única de três colunas. */
              <li key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <input
                  className={`${campoLinha} col-span-2 sm:col-span-1`}
                  value={spec.label}
                  placeholder="Motor"
                  aria-label="Nome da especificação"
                  onChange={(e) => {
                    const nova = [...form.especificacoes]
                    nova[i] = { ...spec, label: e.target.value }
                    onSet('especificacoes', nova)
                  }}
                />
                <input
                  className={campoLinha}
                  value={spec.value}
                  placeholder="Mono OHC, 291,6 cc"
                  aria-label="Valor da especificação"
                  onChange={(e) => {
                    const nova = [...form.especificacoes]
                    nova[i] = { ...spec, value: e.target.value }
                    onSet('especificacoes', nova)
                  }}
                />
                <button
                  type="button"
                  onClick={() => onSet('especificacoes', form.especificacoes.filter((_, j) => j !== i))}
                  aria-label="Remover especificação"
                  className="btn-icone btn-icone-perigo"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => onSet('especificacoes', [...form.especificacoes, { label: '', value: '' }])}
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-steel-300 transition-colors hover:text-paper"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar linha
        </button>
      </div>
    </Secao>
  )
}
