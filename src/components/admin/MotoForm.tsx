import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CATEGORIAS } from '../../lib/filters'
import { montarSlug, salvarMoto } from '../../lib/catalog'
import type { MotoParaSalvar } from '../../lib/catalog'
import { agendarPublicacao } from '../../lib/publicar'
import type { MotorcycleCategory, MotorcycleSpec } from '../../types'
import { PhotoUploader } from './PhotoUploader'

const VAZIO: MotoParaSalvar = {
  slug: '',
  marca: '',
  modelo: '',
  ano: new Date().getFullYear(),
  preco: 0,
  precoCompra: null,
  quilometragem: null,
  cilindrada: null,
  categoria: 'Street',
  descricao: '',
  especificacoes: [],
  imagens: [],
  destaque: false,
  disponibilidade: 'disponivel',
}

/** Converte "32.500" ou "32500" em número; texto solto vira null. */
function numeroOuNulo(texto: string): number | null {
  const limpo = texto.replace(/\./g, '').replace(',', '.')
  if (!limpo.trim()) return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

export function MotoForm({
  inicial,
  id,
  onSalvo,
  onCancelar,
}: {
  inicial?: MotoParaSalvar
  id?: string
  onSalvo: () => void
  onCancelar: () => void
}) {
  const [form, setForm] = useState<MotoParaSalvar>(inicial ?? VAZIO)
  const [slugManual, setSlugManual] = useState(Boolean(inicial))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Ao trocar de moto, o pai passa uma `key` diferente e o React remonta
  // este componente: os campos já nascem com os valores da nova moto, sem
  // precisar de efeito para sincronizar estado derivado das props.

  function set<K extends keyof MotoParaSalvar>(chave: K, valor: MotoParaSalvar[K]) {
    setForm((f) => {
      const proximo = { ...f, [chave]: valor }
      // O slug acompanha marca/modelo/ano até o owner editar à mão.
      if (!slugManual && (chave === 'marca' || chave === 'modelo' || chave === 'ano')) {
        proximo.slug = montarSlug(proximo.marca, proximo.modelo, proximo.ano)
      }
      return proximo
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!form.marca.trim() || !form.modelo.trim()) {
      setErro('Marca e modelo são obrigatórios.')
      return
    }
    if (!form.slug.trim()) {
      setErro('O slug ficou vazio. Confira marca, modelo e ano.')
      return
    }

    setSalvando(true)
    const r = await salvarMoto(form, id)
    setSalvando(false)

    if (!r.ok) {
      setErro(
        r.erro?.includes('duplicate')
          ? 'Já existe uma moto com esse slug. Ajuste o modelo ou o ano.'
          : (r.erro ?? 'Erro ao salvar.'),
      )
      return
    }
    agendarPublicacao()
    onSalvo()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Identificação */}
      <fieldset className="space-y-4">
        <legend className="font-display text-sm font-semibold tracking-[0.14em] text-steel-300 uppercase">
          Identificação
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-marca" className="field-label">Marca *</label>
            <input id="f-marca" className="input" value={form.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Honda" />
          </div>
          <div>
            <label htmlFor="f-modelo" className="field-label">Modelo *</label>
            <input id="f-modelo" className="input" value={form.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="XRE 300" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-ano" className="field-label">Ano *</label>
            <input id="f-ano" type="number" min={1980} max={2100} className="input" value={form.ano} onChange={(e) => set('ano', Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="f-categoria" className="field-label">Categoria</label>
            <select id="f-categoria" className="select" value={form.categoria} onChange={(e) => set('categoria', e.target.value as MotorcycleCategory)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-preco" className="field-label">Preço de venda (R$) *</label>
            <input id="f-preco" type="number" min={0} step={100} className="input" value={form.preco} onChange={(e) => set('preco', Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="f-preco-compra" className="field-label">Preço de compra (R$)</label>
            <input
              id="f-preco-compra"
              type="number"
              min={0}
              step={100}
              className="input"
              value={form.precoCompra ?? ''}
              onChange={(e) => set('precoCompra', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Quanto você pagou — opcional"
            />
            <p className="mt-1 text-[11px] text-steel-500">Alimenta o lucro no Financeiro.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-km" className="field-label">Quilometragem</label>
            <input
              id="f-km"
              className="input"
              defaultValue={form.quilometragem ?? ''}
              onChange={(e) => set('quilometragem', numeroOuNulo(e.target.value))}
              placeholder="Deixe vazio = Km a confirmar"
            />
          </div>
          <div>
            <label htmlFor="f-cc" className="field-label">Cilindrada (cc)</label>
            <input
              id="f-cc"
              className="input"
              defaultValue={form.cilindrada ?? ''}
              onChange={(e) => set('cilindrada', numeroOuNulo(e.target.value))}
              placeholder="Ex.: 291"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-slug" className="field-label">
              Slug (endereço do site)
            </label>
            <input
              id="f-slug"
              className="input"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true)
                set('slug', e.target.value)
              }}
            />
            <p className="mt-1 text-[11px] text-steel-500">
              /moto/<span className="text-steel-300">{form.slug || '...'}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-disp" className="field-label">Disponibilidade</label>
            <select
              id="f-disp"
              className="select"
              value={form.disponibilidade}
              onChange={(e) => set('disponibilidade', e.target.value as MotoParaSalvar['disponibilidade'])}
            >
              <option value="disponivel">Disponível</option>
              <option value="reservada">Reservada</option>
              <option value="vendida">Vendida</option>
            </select>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-steel-300 sm:mt-6">
            <input
              type="checkbox"
              checked={form.destaque}
              onChange={(e) => set('destaque', e.target.checked)}
              className="size-5 accent-[#E21B23]"
            />
            Destacar na home
          </label>
        </div>
      </fieldset>

      {/* Descrição */}
      <fieldset className="space-y-4">
        <legend className="font-display text-sm font-semibold tracking-[0.14em] text-steel-300 uppercase">
          Descrição
        </legend>
        <div>
          <label htmlFor="f-desc" className="field-label">Texto do anúncio</label>
          <textarea
            id="f-desc"
            rows={5}
            className="input leading-relaxed"
            value={form.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            placeholder="Condição, revisões, o que acompanha a moto. Esse texto aparece na ficha e no Google."
          />
        </div>
      </fieldset>

      {/* Especificações */}
      <fieldset className="space-y-3">
        <legend className="font-display text-sm font-semibold tracking-[0.14em] text-steel-300 uppercase">
          Especificações
        </legend>
        {form.especificacoes.map((spec: MotorcycleSpec, i) => (
          /* `1fr 1.4fr auto` de uma vez só não cabe em 320px: os dois campos
             ficavam com ~55px de área útil e o placeholder ("Mono OHC, 291,6
             cc") sumia. No celular o rótulo ocupa a linha inteira e o valor
             divide espaço com o botão de remover; do `sm` em diante volta a
             linha única de três colunas. */
          <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
            <input
              className="input col-span-2 sm:col-span-1"
              value={spec.label}
              placeholder="Motor"
              aria-label="Nome da especificação"
              onChange={(e) => {
                const nova = [...form.especificacoes]
                nova[i] = { ...spec, label: e.target.value }
                set('especificacoes', nova)
              }}
            />
            <input
              className="input"
              value={spec.value}
              placeholder="Mono OHC, 291,6 cc"
              aria-label="Valor da especificação"
              onChange={(e) => {
                const nova = [...form.especificacoes]
                nova[i] = { ...spec, value: e.target.value }
                set('especificacoes', nova)
              }}
            />
            <button
              type="button"
              onClick={() => set('especificacoes', form.especificacoes.filter((_, j) => j !== i))}
              aria-label="Remover especificação"
              className="grid size-10 place-items-center rounded border border-white/10 text-steel-400 transition-colors hover:border-brand-500 hover:text-brand-500"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set('especificacoes', [...form.especificacoes, { label: '', value: '' }])}
          className="inline-flex items-center gap-2 text-sm font-medium text-steel-300 transition-colors hover:text-paper"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar linha
        </button>
      </fieldset>

      {/* Fotos */}
      <fieldset className="space-y-3">
        <legend className="font-display text-sm font-semibold tracking-[0.14em] text-steel-300 uppercase">
          Fotos
        </legend>
        <PhotoUploader slug={form.slug || 'sem-slug'} fotos={form.imagens} onChange={(fotos) => set('imagens', fotos)} />
      </fieldset>

      {erro && (
        <p role="alert" className="rounded border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-xs text-steel-300">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
        <button
          type="submit"
          disabled={salvando}
          className="h-11 rounded bg-brand-500 px-5 py-2.5 font-display text-sm font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-brand-600 disabled:opacity-50 sm:h-auto"
        >
          {salvando ? 'Salvando...' : id ? 'Salvar e publicar' : 'Adicionar e publicar'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="h-11 rounded border border-white/20 px-5 py-2.5 font-display text-sm font-semibold tracking-[0.08em] text-steel-300 uppercase transition-colors hover:border-white/40 sm:h-auto"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}