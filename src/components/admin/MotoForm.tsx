import { useState } from 'react'
import { ArrowLeft, ChevronDown, Plus, Trash2 } from 'lucide-react'
import {
  excluirFotosRemovidas,
  montarSlug,
  salvarMoto,
} from '../../lib/catalog'
import type { MotoParaSalvar } from '../../lib/catalog'
import { formatarNumeroBR, formatPrice, parseNumeroBR, precoPareceIncompleto } from '../../lib/format'
import type { Motorcycle, MotorcycleSpec, MotorcycleStatus } from '../../types'
import { PhotoUploader } from './PhotoUploader'
import { SeletorMarca } from './SeletorMarca'
import { campoLinha, selectLinha } from './campoLinha'

/**
 * ============================================================
 * FORMULÁRIO DE MOTO — página única vertical
 * ============================================================
 * Muitos campos seriam um rolinho interminável; o antigo wizard de
 * passos resolvia isso ao custo de esconder o resto do formulário.
 * Agora: todas as seções empilhadas numa página só, com scroll
 * natural — seções separadas por fio de cabelo, não por cartões de
 * vidro (isso é linguagem de vitrine; o painel é bancada). A ação de
 * salvar fica numa barra fixa no rodapé, sólida, sem blur.
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
  emPromocao: false,
  precoAntes: null,
  status: 'disponivel',
}

/** Converte "32.500", "32.500 km" ou "291,6" em número; texto solto vira null. */
function numeroOuNulo(texto: string): number | null {
  return parseNumeroBR(texto)
}

function textoInicial(valor: number | null): string {
  return valor == null || valor === 0 ? '' : formatarNumeroBR(valor)
}

/**
 * Campo de dinheiro em texto livre. `type="number"` engolia "23.000"
 * como 23 e o dono anunciava a moto por R$ 23. Aqui o valor é lido pelo
 * parser brasileiro, a prévia confirma o que vai para o site e valores
 * abaixo de R$ 1.000 ganham um aviso — não um bloqueio.
 */
function CampoPreco({
  id,
  valor,
  onChange,
  placeholder,
  dicaVazia = 'Digite 23.000 ou 23 mil — o campo entende os dois.',
  previa,
}: {
  id: string
  valor: number | null
  onChange: (valor: number | null) => void
  placeholder?: string
  /** Texto de ajuda enquanto o campo está vazio. */
  dicaVazia?: string
  /** Como o valor lido aparece; o padrão confirma o preço do site. */
  previa?: (valor: number) => string
}) {
  const [texto, setTexto] = useState(() => textoInicial(valor))
  const numero = parseNumeroBR(texto)
  const vazio = texto.trim() === ''
  const invalido = !vazio && numero == null
  const incompleto = numero != null && numero > 0 && precoPareceIncompleto(numero)

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={campoLinha}
        value={texto}
        onChange={(evento) => {
          const proximo = evento.target.value
          setTexto(proximo)
          onChange(parseNumeroBR(proximo))
        }}
        onBlur={() => {
          const lido = parseNumeroBR(texto)
          if (lido != null) setTexto(formatarNumeroBR(lido))
        }}
        placeholder={placeholder}
        aria-invalid={invalido || undefined}
        aria-describedby={`${id}-previa`}
      />
      <p
        id={`${id}-previa`}
        aria-live="polite"
        className={`mt-1.5 text-xs ${invalido ? 'text-red-300' : incompleto ? 'text-alerta' : 'text-steel-500'}`}
      >
        {vazio
          ? dicaVazia
          : numero == null
            ? 'Não consegui ler esse valor. Use, por exemplo, 23.000,00.'
            : incompleto
              ? `${previa ? previa(numero) : `No site: ${formatPrice(numero)}.`} Faltou um zero?`
              : (previa ? previa(numero) : `No site: ${formatPrice(numero)}.`)}
      </p>
    </>
  )
}

/** Grupo de campos com título de seção do painel: fio + carimbo vermelho. */
function Secao({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-xs font-semibold tracking-[0.14em] text-steel-400 uppercase">
        <span aria-hidden="true" className="h-px w-6 bg-brand-500" />
        {titulo}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
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
  /** Estoque atual — alimenta o seletor rápido de marcas. */
  estoque?: Motorcycle[]
}) {
  const [form, setForm] = useState<MotoParaSalvar>(inicial ?? VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Folha de escolha de marca: campo grande → folha com busca.
  const [escolhendoMarca, setEscolhendoMarca] = useState(false)

  // Ao trocar de moto, o pai passa uma `key` diferente e o React remonta
  // este componente: os campos já nascem com os valores da nova moto, sem
  // precisar de efeito para sincronizar estado derivado das props.

  function set<K extends keyof MotoParaSalvar>(chave: K, valor: MotoParaSalvar[K]) {
    setForm((f) => {
      const proximo = { ...f, [chave]: valor }
      // O endereço da moto é assunto do sistema, não do dono: sai de
      // marca + modelo + ano. Numa moto já publicada ele NÃO muda —
      // trocar o modelo não pode quebrar o link que já foi divulgado.
      if (!id && (chave === 'marca' || chave === 'modelo' || chave === 'ano')) {
        proximo.slug = montarSlug(proximo.marca, proximo.modelo, proximo.ano)
      }
      return proximo
    })
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!form.marca.trim() || !form.modelo.trim()) {
      setErro('Faltou marca ou modelo.')
      return
    }
    if (!Number.isFinite(form.preco) || form.preco <= 0) {
      setErro('Informe o preço de venda da moto — por exemplo, 23.000.')
      return
    }
    // O banco também barreira isso (check da promoção), mas o erro viria
    // cru do Postgres: valida aqui dá mensagem humana ao dono.
    if (form.emPromocao && (form.precoAntes == null || form.precoAntes <= form.preco)) {
      setErro(
        'Pra anunciar em promoção, o preço "de" precisa estar preenchido e ser maior que o "por".',
      )
      return
    }

    setSalvando(true)
    const r = await salvarMoto(form, id)
    setSalvando(false)

    if (!r.ok) {
      setErro(r.erro ?? 'Erro ao salvar.')
      return
    }

    // Só depois do save: as fotos que saíram do formulário já não estão
    // mais no banco, então os arquivos podem sair do Storage sem deixar
    // imagem quebrada se o dono tivesse cancelado.
    await excluirFotosRemovidas(inicial?.imagens ?? [], form.imagens)
    onSalvo()
  }

  const conteudo = [
    /* ------------------------------------------------ 1. Identificação
        Ordem de cadastro natural: marca, modelo, ano. A marca é o
        campo grande que abre a folha — o resto são campos comuns. */
    <Secao key="s1" titulo="Identificação">
      <div>
        <span className="field-label">Marca *</span>
        {/* Campo-espaçoso: um toque abre a folha de marcas. Caixa alta
            de 56px, valor grande — cara de app, não de form de sistema. */}
        <button
          type="button"
          onClick={() => setEscolhendoMarca(true)}
          aria-haspopup="dialog"
          aria-expanded={escolhendoMarca}
          className="foco-painel mt-1 flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 border border-line bg-night-900/40 px-4 text-left transition-colors hover:border-line-forte"
        >
          <span className={`text-[15px] ${form.marca ? 'font-medium text-paper' : 'text-steel-500'}`}>
            {form.marca || 'Escolher a marca'}
          </span>
          <ChevronDown className="size-4 shrink-0 text-steel-500" aria-hidden="true" />
        </button>
        <SeletorMarca
          aberto={escolhendoMarca}
          onFechar={() => setEscolhendoMarca(false)}
          marcasDoEstoque={[...new Set(estoque.map((m) => m.marca))].sort((a, b) =>
            a.localeCompare(b, 'pt-BR'),
          )}
          marcaAtiva={form.marca}
          onEscolher={(marca) => set('marca', marca)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-modelo" className="field-label">Modelo *</label>
          <input id="f-modelo" className={campoLinha} value={form.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="XRE 300" />
        </div>
        <div>
          <label htmlFor="f-ano" className="field-label">Ano *</label>
          <input id="f-ano" type="number" min={1980} max={2100} className={campoLinha} value={form.ano} onChange={(e) => set('ano', Number(e.target.value))} />
        </div>
      </div>
    </Secao>,

    /* ------------------------------------------------ 2. Comercial */
    <Secao key="s2" titulo="Preço e disponibilidade">
      <div>
        <label htmlFor="f-preco" className="field-label">Preço de venda (R$) *</label>
        <CampoPreco
          id="f-preco"
          valor={form.preco}
          onChange={(valor) => set('preco', valor ?? 0)}
          placeholder="23.000"
        />
      </div>
      <div>
        <label htmlFor="f-km" className="field-label">Quilometragem</label>
        <input
          id="f-km"
          className={campoLinha}
          defaultValue={textoInicial(form.quilometragem)}
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
      {/* Caixa do desconto: promoção é um modo do anúncio, então vive
          fechada até o dono ligar. Ligada, mostra o par "de / por" do
          jeito que o cliente lê no site — o "por" é o preço de venda já
          informado acima, aqui só como espelho, sem segundo estado. */}
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
            onChange={(e) => set('emPromocao', e.target.checked)}
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
                  onChange={(valor) => set('precoAntes', valor)}
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
    </Secao>,

    /* ------------------------------------------------ 3. Ficha técnica */
    <Secao key="s3" titulo="Ficha técnica">
      <div>
        <label htmlFor="f-cc" className="field-label">Cilindrada (cc)</label>
        <input
          id="f-cc"
          className={campoLinha}
          defaultValue={textoInicial(form.cilindrada)}
          onChange={(e) => set('cilindrada', numeroOuNulo(e.target.value))}
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
    <Secao key="s4" titulo="Fotos e anúncio">
      <div>
        <label htmlFor="f-desc" className="field-label">Texto do anúncio</label>
        <textarea
          id="f-desc"
          rows={5}
          className={`${campoLinha} leading-relaxed`}
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="Condição, revisões, o que acompanha a moto. Esse texto aparece na ficha e no Google."
        />
      </div>
      <PhotoUploader slug={form.slug || 'sem-slug'} fotos={form.imagens} onChange={(fotos) => set('imagens', fotos)} />
    </Secao>,
  ]

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-4xl space-y-5">
      {/* ================= Cabeçalho do formulário =========================
          No celular, UMA seta no canto superior esquerdo — a topbar não
          duplica "Voltar". O nome acompanha a digitação em tempo real.
          Sem selo de status aqui: o campo Status, logo abaixo, já diz
          tudo — repetir o mesmo dado no topo era ruído. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancelar}
          aria-label="Voltar ao estoque"
          className="foco-painel -ml-2 grid size-11 shrink-0 cursor-pointer place-items-center text-steel-300 transition-colors hover:text-paper lg:hidden"
        >
          <ArrowLeft className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-paper">
            {form.modelo.trim() || 'Nova Moto'}
          </h1>
          <p className="text-xs text-steel-500">
            {id ? 'Editando moto do estoque' : 'Nova moto para o estoque'}
          </p>
        </div>
      </div>

      {erro && (
        <p role="alert" className="border border-marca/40 bg-marca/10 px-3 py-2 text-xs text-marca-texto">
          {erro}
        </p>
      )}

      {/* Todas as seções empilhadas, uma página só, com scroll natural —
          no celular e no desktop. */}
      <div className="space-y-6">{conteudo}</div>

      {/* Espaço para a barra flutuante não cobrir o fim da página. */}
      <div className="h-24" aria-hidden="true" />

      {/* ================= Barra fixa de salvar =========================
          Barra sólida de bancada colada no rodapé: fio de cabelo no topo,
          fundo do painel, sem blur nem cápsula. Só as ações — o aviso
          de rascunho era ruído; o dono sabe o que está editando. */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-line bg-painel-2">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-3 px-4 py-3">
          {/* No celular a saída é a seta lá em cima — um segundo caminho
              de volta nessa barra só criava confusão. Na mesa mantém. */}
          <button
            type="button"
            onClick={onCancelar}
            className="foco-painel hidden h-10 cursor-pointer items-center px-4 text-sm font-medium text-steel-400 transition-colors hover:text-paper sm:inline-flex"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="foco-painel inline-flex h-10 cursor-pointer items-center bg-marca px-6 text-sm font-bold text-white transition-colors hover:bg-marca-viva disabled:cursor-not-allowed disabled:opacity-50 sm:px-8"
          >
            {salvando ? 'Salvando...' : id ? 'Salvar Moto' : 'Adicionar Moto'}
          </button>
        </div>
      </div>
    </form>
  )
}
