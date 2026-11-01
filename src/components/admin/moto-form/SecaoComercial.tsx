import type { MotoParaSalvar } from '../../../lib/catalog'
import type { MotorcycleStatus } from '../../../types'
import { formatPrice } from '../../../lib/format'
import { campoLinha, selectLinha } from '../campoLinha'
import { CampoPreco } from './CampoPreco'
import { Secao } from './Secao'
import { positivoOuNulo, textoInicial } from './valores'

/**
 * ============================================================
 * 2. COMERCIAL — preço, km, status e promoção
 * ============================================================
 * Promoção é um modo do anúncio, então vive fechada até o dono
 * ligar. Ligada, mostra o par "de / por" do jeito que o cliente
 * lê no site — o "por" é o preço de venda já informado acima,
 * aqui só como espelho, sem segundo estado.
 */

export function SecaoComercial({
  form,
  onSet,
}: {
  form: MotoParaSalvar
  onSet: <K extends keyof MotoParaSalvar>(chave: K, valor: MotoParaSalvar[K]) => void
}) {
  // Resumo da promoção para ler junto ao campo: "de R$ 34.900 por R$ 31.900".
  const porFormatado = form.preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
  // Mesmo cálculo do selo do card (descontoPercentual), aqui a partir do
  // formulário: só aparece com "de" maior que o "por".
  const desconto =
    form.emPromocao && form.precoAntes != null && form.precoAntes > form.preco && form.preco > 0
      ? Math.round((1 - form.preco / form.precoAntes) * 100)
      : null

  return (
    <Secao titulo="Preço e disponibilidade">
      <div>
        <label htmlFor="f-preco" className="field-label">Preço de venda (R$) *</label>
        <CampoPreco
          id="f-preco"
          valor={form.preco}
          onChange={(valor) => onSet('preco', valor ?? 0)}
          placeholder="23.000"
        />
      </div>
      <div>
        <label htmlFor="f-km" className="field-label">Quilometragem</label>
        <input
          id="f-km"
          className={campoLinha}
          defaultValue={textoInicial(form.quilometragem)}
          onChange={(e) => onSet('quilometragem', positivoOuNulo(e.target.value))}
          placeholder="Deixe vazio = Km a confirmar"
        />
      </div>
      <div>
        <label htmlFor="f-status" className="field-label">Status</label>
        <select
          id="f-status"
          className={selectLinha}
          value={form.status}
          onChange={(e) => onSet('status', e.target.value as MotorcycleStatus)}
        >
          <option value="disponivel">Disponível</option>
          <option value="vendida">Vendida</option>
        </select>
      </div>
      {/* Caixa do desconto */}
      <div className="border border-line bg-night-900/30">
        <label className="flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-paper">Desconto</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-steel-400">
              Anuncia com preço de/por e selo de oferta no site.
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.emPromocao}
            onChange={(e) => onSet('emPromocao', e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={`mt-0.5 block h-6 w-11 shrink-0 border p-0.5 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400 ${
              form.emPromocao ? 'border-marca bg-marca' : 'border-line-forte bg-painel-2'
            }`}
          >
            <span
              className={`block size-5 transition-transform ${
                form.emPromocao ? 'translate-x-5 bg-white' : 'bg-steel-500'
              }`}
            />
          </span>
        </label>

        {form.emPromocao && (
          <div className="border-t border-line px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="f-preco-antes" className="field-label">
                  De (preço cheio)
                </label>
                <CampoPreco
                  id="f-preco-antes"
                  valor={form.precoAntes}
                  onChange={(valor) => onSet('precoAntes', valor)}
                  placeholder="Ex.: 24.900"
                  dicaVazia="O preço sem desconto — só ele ganha o selo de oferta."
                  previa={(numero) => `De ${formatPrice(numero)}.`}
                />
              </div>
              <div>
                <span className="field-label">Por (o preço de venda)</span>
                <p className="numeros flex min-h-12 items-center border border-line/60 bg-painel-2 px-4 text-sm text-paper">
                  {form.preco > 0 ? porFormatado : '—'}
                </p>
                <p className="mt-1.5 text-xs text-steel-500">
                  Vem do preço de venda acima.
                </p>
              </div>
            </div>

            {desconto != null ? (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-steel-400">
                <span className="bg-marca px-1.5 py-0.5 text-[11px] leading-none font-bold text-white">
                  −{desconto}%
                </span>
                <span>Selo de oferta no card do site, na ficha e na lista do estoque.</span>
              </p>
            ) : form.precoAntes != null ? (
              <p className="mt-3 text-xs leading-relaxed text-steel-500">
                O "de" precisa ser maior que o "por" — abaixo disso o site mostra o preço sem selo.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </Secao>
  )
}
