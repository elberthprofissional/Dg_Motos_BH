import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { CATEGORIAS } from '../../lib/filters'
import { modelosDisponiveis, montarSlug, salvarMoto } from '../../lib/catalog'
import type { MotoParaSalvar } from '../../lib/catalog'
import type { Motorcycle, MotorcycleCategory, MotorcycleSpec, MotorcycleStatus } from '../../types'
import { PhotoUploader } from './PhotoUploader'
import { SeletorMarca } from './SeletorMarca'
import { campoLinha, selectLinha } from './campoLinha'

/**
 * ============================================================
 * FORMULÁRIO DE MOTO — wizard no celular, tudo à vista no desktop
 * ============================================================
 * Cadastrar moto envolve muitos campos; em uma tela longa o celular
 * vira um rolinho interminável e o dono perde a noção do que falta.
 * A partir do breakpoint `sm` tudo fica visível em cartões; no
 * celular o formulário vira 4 passos que deslizam horizontalmente
 * (com swipe no Android/iOS e botões avançar/voltar).
 */

const VAZIO: MotoParaSalvar = {
  slug: '',
  marca: '',
  modelo: '',
  ano: new Date().getFullYear(),
  preco: 0,
  quilometragem: null,
  cilindrada: null,
  categoria: 'Street',
  descricao: '',
  especificacoes: [],
  imagens: [],
  destaque: false,
  status: 'disponivel',
}

const PASSOS = [
  { titulo: 'Identificação' },
  { titulo: 'Preço' },
  { titulo: 'Ficha técnica' },
  { titulo: 'Anúncio e fotos' },
] as const

/** Converte "32.500" ou "32500" em número; texto solto vira null. */
function numeroOuNulo(texto: string): number | null {
  const limpo = texto.replace(/\./g, '').replace(',', '.')
  if (!limpo.trim()) return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

/** Rótulo numérico das seções: orienta o preenchimento de cima p/ baixo. */
function Secao({
  numero,
  titulo,
  children,
  className = '',
}: {
  numero: string
  titulo: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-white/10 bg-night-900 max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent ${className}`}
    >
      <div
        className="flex items-center gap-3 border-b border-white/10 bg-night-950/40 px-4 py-3 sm:px-5 max-sm:border-0 max-sm:bg-transparent max-sm:px-0 max-sm:pb-2"
      >
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-500/15 font-display text-xs font-bold text-brand-500"
        >
          {numero}
        </span>
        <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-paper uppercase">
          {titulo}
        </h2>
      </div>
      <div className="space-y-4 p-4 sm:p-5 max-sm:px-0 max-sm:pt-1">{children}</div>
    </section>
  )
}

/** Passo atual + total. No celular é a régua visual do progresso. */
function Progresso({
  passo,
  total,
  onIr,
}: {
  passo: number
  total: number
  onIr: (n: number) => void
}) {
  return (
    <div className="sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-steel-300 uppercase">
          Passo {passo + 1} de {total}
          <span className="ml-2 normal-case tracking-normal text-steel-500">
            {PASSOS[passo].titulo}
          </span>
        </p>
        <p className="text-[11px] text-steel-600">deslize ↔</p>
      </div>
      {/* Trilha: segmentos preenchidos = passos concluídos; o atual pulsa
          levemente (via cor), os futuros ficam apagados. */}
      <div className="mt-2 flex gap-1.5" role="tablist" aria-label="Passos do cadastro">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === passo}
            aria-label={`Ir para o passo ${i + 1} — ${PASSOS[i].titulo}`}
            onClick={() => onIr(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i === passo ? 'bg-brand-500' : i < passo ? 'bg-brand-500/40' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function MotoForm({
  inicial,
  id,
  onSalvo,
  onCancelar,
  estoque = [],
}: {
  inicial?: MotoParaSalvar
  id?: string
  onSalvo: () => void
  onCancelar: () => void
  /** Estoque atual — alimenta os chips de modelo já cadastrado. */
  estoque?: Motorcycle[]
}) {
  const [form, setForm] = useState<MotoParaSalvar>(inicial ?? VAZIO)
  // Modelos já no estoque, para completar com um toque. Exclui a própria
  // moto em edição para o chip não preencher com o que já está no campo.
  const sugestoesModelo = useMemo(
    () => modelosDisponiveis(estoque).filter((m) => m.modelo !== inicial?.modelo),
    [estoque, inicial?.modelo],
  )
  const [slugManual, setSlugManual] = useState(Boolean(inicial))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [passo, setPasso] = useState(0)
  const ultimoPasso = PASSOS.length - 1

  // Swipe: o track translateX pelo índice passos; o gesto move um offset
  // em px durante o arrasto (feedback imediato) e solta no passo mais
  // próximo — menos 50% de largura do cartão marca troca de passo.
  const trackRef = useRef<HTMLDivElement>(null)
  const swipe = useRef({ inicio: 0, offset: 0, ativo: false })

  function irPara(n: number) {
    setPasso(Math.max(0, Math.min(PASSOS.length - 1, n)))
  }

  function onPointerDown(e: React.PointerEvent) {
    // Só no touch: mouse tem botões; arrastar com mouse atrapalha a
    // seleção de texto dos inputs.
    if (e.pointerType !== 'touch') return
    swipe.current = { inicio: e.clientX, offset: 0, ativo: true }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!swipe.current.ativo || e.pointerType !== 'touch') return
    const dx = e.clientX - swipe.current.inicio
    // Resistência nas pontas: não arrasta além do primeiro/último.
    const naBorda = (passo === 0 && dx > 0) || (passo === ultimoPasso && dx < 0)
    swipe.current.offset = naBorda ? dx * 0.25 : dx
    const track = trackRef.current
    if (track) {
      track.style.transition = 'none'
      track.style.transform = `translateX(calc(${-passo * 100}% + ${swipe.current.offset}px))`
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!swipe.current.ativo || e.pointerType !== 'touch') return
    swipe.current.ativo = false
    const track = trackRef.current
    if (track) {
      track.style.transition = 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)'
      track.style.transform = ''
    }
    const largura = trackRef.current?.parentElement?.clientWidth ?? 1
    const proporcao = Math.abs(swipe.current.offset) / largura
    if (proporcao > 0.2) {
      irPara(passo + (swipe.current.offset < 0 ? 1 : -1))
    }
    swipe.current.offset = 0
  }

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
      irPara(0)
      return
    }
    if (!form.slug.trim()) {
      setErro('O slug ficou vazio. Confira marca, modelo e ano.')
      irPara(0)
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
    onSalvo()
  }

  const conteudo = [
    /* ------------------------------------------------ 1. Identificação */
    <Secao key="s1" numero="1" titulo="Identificação">
      <div>
        <label htmlFor="f-modelo" className="field-label">Modelo *</label>
        <input id="f-modelo" className={campoLinha} value={form.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="XRE 300" />
        {/* Sugestões de modelos já cadastrados: um toque completa o
            campo. O texto livre continua valendo — o chip não
            obriga, só oferece atalho. */}
        {sugestoesModelo.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sugestoesModelo.map((m) => (
              <button
                key={m.modelo}
                type="button"
                onClick={() => {
                  set('marca', m.marca)
                  set('modelo', m.modelo)
                  set('categoria', m.categoria)
                }}
                aria-label={`Preencher com ${m.marca} ${m.modelo}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 text-xs font-medium text-steel-300 transition-colors hover:border-brand-500/50 hover:text-paper"
              >
                <span
                  aria-hidden="true"
                  className="grid size-5 place-items-center rounded-full bg-brand-500/15 text-[9px] font-bold text-brand-500"
                >
                  {m.marca.slice(0, 2).toUpperCase()}
                </span>
                {m.modelo}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-ano" className="field-label">Ano *</label>
          <input id="f-ano" type="number" min={1980} max={2100} className={campoLinha} value={form.ano} onChange={(e) => set('ano', Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor="f-categoria" className="field-label">Categoria</label>
          <select id="f-categoria" className={selectLinha} value={form.categoria} onChange={(e) => set('categoria', e.target.value as MotorcycleCategory)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Marca por último: é a parte visual do passo (círculos), e com o
          modelo já preenchido fica natural confirmar a marca no fim. */}
      <div>
        <label htmlFor="f-marca" className="field-label">Marca *</label>
        {/* Círculos das marcas: toque preenche; digitar marca nova
            continua valendo (o campo segue utilizável à mão). */}
        <div className="mt-1">
          <SeletorMarca
            marcasDoEstoque={[...new Set(estoque.map((m) => m.marca))].sort((a, b) =>
              a.localeCompare(b, 'pt-BR'),
            )}
            marcaAtiva={form.marca}
            onEscolher={(marca) => set('marca', marca)}
          />
        </div>
        {/* Campo de texto permanece: marca fora da lista se digita
            normalmente. O valor reflete o toque no círculo. */}
        <input
          id="f-marca"
          className={`${campoLinha} mt-3 text-sm`}
          value={form.marca}
          onChange={(e) => set('marca', e.target.value)}
          placeholder="Outra marca? Digite aqui"
        />
      </div>
    </Secao>,

    /* ------------------------------------------------ 2. Comercial */
    <Secao key="s2" numero="2" titulo="Preço e disponibilidade">
      <div>
        <label htmlFor="f-preco" className="field-label">Preço de venda (R$) *</label>
        <input id="f-preco" type="number" min={0} step={100} className={campoLinha} value={form.preco} onChange={(e) => set('preco', Number(e.target.value))} />
      </div>
      <div>
        <label htmlFor="f-km" className="field-label">Quilometragem</label>
        <input
          id="f-km"
          className={campoLinha}
          defaultValue={form.quilometragem ?? ''}
          onChange={(e) => set('quilometragem', numeroOuNulo(e.target.value))}
          placeholder="Deixe vazio = Km a confirmar"
        />
      </div>
      <div>
        <label htmlFor="f-status" className="field-label">Status</label>
        <select
          id="f-status"
          className={selectLinha}
          value={form.status}
          onChange={(e) => set('status', e.target.value as MotorcycleStatus)}
        >
          <option value="disponivel">Disponível</option>
          <option value="indisponivel">Indisponível</option>
          <option value="vendida">Vendida</option>
        </select>
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-steel-300">
        <input
          type="checkbox"
          checked={form.destaque}
          onChange={(e) => set('destaque', e.target.checked)}
          className="size-5 accent-brand-500"
        />
        Destacar na home
      </label>
    </Secao>,

    /* ------------------------------------------------ 3. Ficha técnica */
    <Secao key="s3" numero="3" titulo="Ficha técnica">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-cc" className="field-label">Cilindrada (cc)</label>
          <input
            id="f-cc"
            className={campoLinha}
            defaultValue={form.cilindrada ?? ''}
            onChange={(e) => set('cilindrada', numeroOuNulo(e.target.value))}
            placeholder="Ex.: 291"
          />
        </div>
        <div>
          <label htmlFor="f-slug" className="field-label">
            Slug (endereço do site)
          </label>
          <input
            id="f-slug"
            className={campoLinha}
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
                  className={campoLinha}
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
          onClick={() => set('especificacoes', [...form.especificacoes, { label: '', value: '' }])}
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-steel-300 transition-colors hover:text-paper"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar linha
        </button>
      </div>
    </Secao>,

    /* ------------------------------------------------ 4. Anúncio */
    <Secao key="s4" numero="4" titulo="Anúncio e fotos">
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
      <PhotoUploader slug={form.slug || 'sem-slug'} fotos={form.imagens} onChange={(fotos) => set('imagens', fotos)} />
    </Secao>,
  ]

  const barraAcoes = (
    <div className="flex flex-wrap gap-3">
      <button type="submit" disabled={salvando} className="btn btn-primary h-11 px-6">
        {salvando ? 'Salvando...' : id ? 'Salvar alterações' : 'Adicionar moto'}
      </button>
      <button type="button" onClick={onCancelar} className="btn btn-secondary h-11 px-6">
        Cancelar
      </button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-4xl space-y-4">
      <Progresso passo={passo} total={PASSOS.length} onIr={irPara} />

      {erro && (
        <p role="alert" className="rounded border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-xs text-steel-300">
          {erro}
        </p>
      )}

      {/* ================= CELULAR: 1 cartão por vez, desliza ================= */}
      <div
        className="overflow-hidden sm:hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        <div
          ref={trackRef}
          className="flex transition-transform duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${passo * 100}%)` }}
        >
          {conteudo.map((secao, i) => (
            <div key={i} className="w-full shrink-0 px-0.5">
              {secao}
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => irPara(passo - 1)}
                  disabled={passo === 0}
                  className="btn btn-secondary h-11 flex-1"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Voltar
                </button>
                {passo < ultimoPasso ? (
                  <button
                    type="button"
                    onClick={() => irPara(passo + 1)}
                    className="btn btn-primary h-11 flex-1"
                  >
                    Continuar
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={salvando}
                    className="btn btn-primary h-11 flex-1"
                  >
                    {salvando ? 'Salvando...' : 'Finalizar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= DESKTOP: tudo visível, um cartão por seção ======== */}
      <div className="hidden space-y-5 sm:block">{conteudo}</div>

      <div className="hidden border-t border-white/10 pt-5 sm:block">{barraAcoes}</div>
    </form>
  )
}
