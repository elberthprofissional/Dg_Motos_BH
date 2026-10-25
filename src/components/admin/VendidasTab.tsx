import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  ImagePlus,
  Images,
  Plus,
  Send,
  ShieldCheck,
} from 'lucide-react'
import type { Motorcycle } from '../../types'
import type { EntregaParaSalvar } from '../../lib/entregas'
import {
  arquivarEntrega,
  buscarEntregasAdmin,
  removerFotosEntrega,
  salvarEntrega,
} from '../../lib/entregas'
import type { EntregaRegistro, StatusEntrega } from '../../data/entregas'
import { bikeTitle } from '../../lib/format'
import type { Feedback } from '../ui/Toast'
import { FotosEntregaInput } from './FotosEntregaInput'

interface VendidasTabProps {
  motos: Motorcycle[]
  onFeedback: (feedback: Feedback) => void
}

type FiltroVendida = 'todas' | 'pendentes' | 'publicadas'

const FILTROS: { valor: FiltroVendida; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'pendentes', rotulo: 'Pendentes' },
  { valor: 'publicadas', rotulo: 'Publicadas' },
]

const rotuloStatus: Record<StatusEntrega, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  arquivada: 'Arquivada',
}

function dataCurta(data: string): string {
  if (!data) return ''
  const valor = new Date(`${data}T12:00:00`)
  return Number.isNaN(valor.valueOf())
    ? ''
    : new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(valor)
}

function novoPost(ordem: number, moto?: Motorcycle): EntregaRegistro {
  return {
    id: crypto.randomUUID(),
    motoId: moto?.id ?? '',
    motoNome: moto ? `${bikeTitle(moto)} ${moto.ano}` : '',
    fotos: [],
    imagens: [],
    nomeCliente: '',
    legenda: '',
    entregueEm: new Date().toISOString().slice(0, 10),
    autorizacaoPublicacao: false,
    status: 'rascunho',
    ordem,
    updatedAt: '',
  }
}

/**
 * ============================================================
 * VENDIDAS — as entregas que viram post no mural
 * ============================================================
 * Uma linha por venda: a moto do estoque marcada como vendida ou um
 * post avulso (venda que nunca passou pelo catálogo). O estado do post
 * é o que organiza a tela, então ele vem na capa e no filtro — e o
 * cartão inteiro abre a venda, sem botão espremido no canto.
 */
export function VendidasTab({ motos, onFeedback }: VendidasTabProps) {
  const [posts, setPosts] = useState<EntregaRegistro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroVendida>('todas')
  const [editor, setEditor] = useState<{
    tipo: 'novoAvulso' | 'moto' | 'post'
    moto?: Motorcycle
    post?: EntregaRegistro
  } | null>(null)
  const [formulario, setFormulario] = useState<EntregaRegistro | null>(null)
  const [uploadsPendentes, setUploadsPendentes] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  function recarregar() {
    return buscarEntregasAdmin()
      .then((resultado) => {
        setPosts(resultado)
        setErro(null)
      })
      .catch((e: unknown) => {
        setErro(e instanceof Error ? e.message : 'Não foi possível carregar os posts.')
      })
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    let vivo = true
    void buscarEntregasAdmin()
      .then((resultado) => {
        if (vivo) setPosts(resultado)
      })
      .catch((e: unknown) => {
        if (vivo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar os posts.')
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  /* Motos vendidas, as mais recentemente alteradas primeiro. */
  const vendidas = useMemo(
    () =>
      motos
        .filter((moto) => moto.status === 'vendida')
        .sort((a, b) => (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? '')),
    [motos],
  )

  /** Post vigente da moto: o mais recente que não está arquivado. */
  const postAtivo = useMemo(() => {
    const mapa = new Map<string, EntregaRegistro>()
    for (const post of posts) {
      if (!post.motoId || post.status === 'arquivada') continue
      const atual = mapa.get(post.motoId)
      if (!atual || post.updatedAt > atual.updatedAt) mapa.set(post.motoId, post)
    }
    return mapa
  }, [posts])

  /* ============================================================
     A FILA — vendas do estoque e posts avulsos na mesma lista
     ============================================================ */
  const itens = useMemo(() => {
    const daLoja: LinhaVenda[] = vendidas.map((moto) => {
      const post = postAtivo.get(moto.id)
      return {
        chave: moto.id,
        moto,
        post,
        titulo: `${bikeTitle(moto)} ${moto.ano}`,
        capa: post?.imagens[0] ?? moto.imagens[0]?.src,
        estado: post?.status === 'publicada' ? 'publicada' : post ? 'rascunho' : 'sem-post',
        data: post?.entregueEm ?? '',
        cliente: post?.nomeCliente ?? '',
        fotos: post?.fotos.length ?? 0,
      }
    })

    const avulsos: LinhaVenda[] = posts
      .filter((post) => !post.motoId && post.status !== 'arquivada')
      .map((post) => ({
        chave: post.id,
        post,
        titulo: post.motoNome,
        capa: post.imagens[0],
        estado: post.status === 'publicada' ? 'publicada' : 'rascunho',
        data: post.entregueEm,
        cliente: post.nomeCliente,
        fotos: post.fotos.length,
      }))

    return [...daLoja, ...avulsos]
  }, [vendidas, postAtivo, posts])

  const contagens = useMemo(
    () => ({
      todas: itens.length,
      pendentes: itens.filter((item) => item.estado !== 'publicada').length,
      publicadas: itens.filter((item) => item.estado === 'publicada').length,
    }),
    [itens],
  )

  const visiveis = itens.filter((item) => {
    if (filtro === 'publicadas') return item.estado === 'publicada'
    if (filtro === 'pendentes') return item.estado !== 'publicada'
    return true
  })

  /* ============================================================
     EDITOR DE POST
     ============================================================ */
  function abrirEditor(tipo: 'novoAvulso' | 'moto' | 'post', moto?: Motorcycle, post?: EntregaRegistro) {
    setEditor({ tipo, moto, post })
    setFormulario(
      post ? { ...post, fotos: [...post.fotos], imagens: [...post.imagens] } : novoPost(posts.length, moto),
    )
    setUploadsPendentes([])
  }

  async function fecharEditor() {
    // Uploads nunca confirmados não podem virar arquivos órfãos.
    const apagar = uploadsPendentes.filter((path) => !(formulario?.fotos ?? []).includes(path))
    if (apagar.length > 0) {
      await removerFotosEntrega(apagar).catch(() => undefined)
    }
    setUploadsPendentes([])
    setFormulario(null)
    setEditor(null)
  }

  const patchFormulario = (patch: Partial<EntregaRegistro>) =>
    setFormulario((atual) => (atual ? { ...atual, ...patch } : atual))

  async function salvar(status: 'rascunho' | 'publicada') {
    if (!formulario) return
    if (!formulario.motoNome.trim()) {
      onFeedback({ tipo: 'erro', texto: 'Informe a moto vendida.' })
      return
    }
    if (status === 'publicada' && (formulario.fotos.length === 0 || !formulario.autorizacaoPublicacao)) {
      onFeedback({
        tipo: 'erro',
        texto: 'Para publicar, adicione ao menos uma foto e confirme a autorização de uso.',
      })
      return
    }

    setSalvando(true)
    const dados: EntregaParaSalvar = {
      id: formulario.id,
      motoId: formulario.motoId,
      motoNome: formulario.motoNome,
      fotos: formulario.fotos,
      legenda: formulario.legenda,
      nomeCliente: formulario.nomeCliente,
      entregueEm: formulario.entregueEm,
      autorizacaoPublicacao: formulario.autorizacaoPublicacao,
      status,
      ordem: formulario.ordem,
    }
    try {
      await salvarEntrega(dados)

      // Fotos que saíram da galeria (e não estavam pendentes há um
      // instante) morrem no bucket junto com o salvar.
      const removidas = posts
        .find((post) => post.id === formulario.id)
        ?.fotos.filter((path) => !formulario.fotos.includes(path) && !uploadsPendentes.includes(path))
      if (removidas?.length) {
        await removerFotosEntrega(removidas).catch(() => undefined)
      }
      setUploadsPendentes([])

      await recarregar()
      setFormulario(null)
      setEditor(null)
      onFeedback({
        tipo: 'ok',
        texto:
          status === 'publicada'
            ? 'Post publicado em "Sonhos realizados".'
            : 'Post salvo como rascunho.',
      })
    } catch (e) {
      onFeedback({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível salvar o post.',
      })
    } finally {
      setSalvando(false)
    }
  }

  async function ocultar(post: EntregaRegistro) {
    try {
      await salvarEntrega({ ...post, fotos: post.fotos, status: 'rascunho' })
      await recarregar()
      await fecharEditor()
      onFeedback({ tipo: 'ok', texto: 'Post ocultado — saiu de "Sonhos realizados".' })
    } catch (e) {
      onFeedback({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível ocultar o post.' })
    }
  }

  async function arquivar(post: EntregaRegistro) {
    try {
      await arquivarEntrega(post.id)
      await recarregar()
      await fecharEditor()
      onFeedback({ tipo: 'ok', texto: 'Post arquivado. Ele não aparece mais no mural.' })
    } catch (e) {
      onFeedback({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível arquivar o post.' })
    }
  }

  if (editor && formulario) {
    const postEmEdicao = posts.find((post) => post.id === formulario.id)
    const editando = Boolean(postEmEdicao)
    const avulso = editor.tipo === 'novoAvulso'
    const nomePreenchido = formulario.motoNome.trim() !== ''

    // O que falta para publicar, item por item. A lista é o próprio
    // aviso: o botão fica desligado enquanto houver um item aberto.
    const requisitos = [
      { ok: nomePreenchido, texto: nomePreenchido ? formulario.motoNome.trim() : 'Nome da moto vendida' },
      {
        ok: formulario.fotos.length > 0,
        texto:
          formulario.fotos.length > 0
            ? `${formulario.fotos.length} ${formulario.fotos.length === 1 ? 'foto escolhida' : 'fotos escolhidas'}`
            : 'Ao menos uma foto',
      },
      { ok: formulario.autorizacaoPublicacao, texto: 'Autorização do cliente' },
    ]
    const podePublicar = requisitos.every((requisito) => requisito.ok)

    return (
      <section className="mx-auto max-w-6xl pb-4" aria-labelledby="post-titulo">
        <button
          type="button"
          onClick={() => void fecharEditor()}
          className="foco-painel mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-steel-300 hover:text-paper"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar às vendidas
        </button>

        <header className="mb-6">
          <h2 id="post-titulo" className="font-display text-3xl font-semibold text-paper sm:text-4xl">
            {editando ? 'Editar post' : 'Publicar venda'}
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-steel-400">
            Nada vai para o site sem você apertar Publicar — até lá, o post fica guardado só aqui.
          </p>
        </header>

        <form onSubmit={(evento) => evento.preventDefault()} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          {/* ── O post ─────────────────────────────────────────── */}
          <div className="space-y-5">
            <section className="border border-line bg-painel p-4 sm:p-5">
              <h3 className="mb-4 text-sm font-semibold text-paper">
                {avulso ? 'A moto vendida' : 'A moto do estoque'}
              </h3>

              {avulso ? (
                /* Venda que nunca foi cadastrada: o nome entra na mão. */
                <div>
                  <label htmlFor="post-moto-avulsa" className="field-label">
                    Nome da moto *
                  </label>
                  <input
                    id="post-moto-avulsa"
                    className="input"
                    value={formulario.motoNome}
                    onChange={(e) => patchFormulario({ motoNome: e.target.value })}
                    placeholder="Ex.: Honda CG 160 Start 2024"
                    maxLength={140}
                  />
                  <p className="mt-2 text-xs text-steel-500">
                    Para vendas que não passaram pelo estoque. As do estoque já vêm preenchidas.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3.5">
                  <div className="grid size-14 shrink-0 place-items-center overflow-hidden border border-line bg-painel-2">
                    {editor.moto?.imagens[0] ? (
                      <img
                        src={editor.moto.imagens[0].src}
                        alt=""
                        aria-hidden="true"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Images className="size-5 text-steel-500" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold text-paper">
                      {formulario.motoNome}
                    </p>
                    <p className="mt-0.5 text-xs text-steel-500">Vem da ficha do estoque.</p>
                  </div>
                </div>
              )}
            </section>

            <section className="border border-line bg-painel p-4 sm:p-5">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-paper">Fotos do post</h3>
                <span className="numeros text-xs text-steel-500">{formulario.fotos.length}/10</span>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-steel-500">
                A primeira vira a capa no mural; as outras entram no carrossel.
              </p>

              <FotosEntregaInput
                entregaId={formulario.id}
                paths={formulario.fotos}
                urls={formulario.imagens}
                descricao={formulario.motoNome}
                onChange={(fotos, imagens) => {
                  // As novas entram em uploadsPendentes: se a edição for
                  // desfeita, elas não ficam órfãs no bucket.
                  setUploadsPendentes((anterior) => {
                    const novas = fotos.filter(
                      (path) =>
                        !uploadsPendentes.includes(path) &&
                        !posts.some((p) => p.id === formulario.id && p.fotos.includes(path)),
                    )
                    return [...anterior.filter((path) => fotos.includes(path)), ...novas]
                  })
                  patchFormulario({ fotos, imagens })
                }}
              />
            </section>

            <section className="border border-line bg-painel p-4 sm:p-5">
              <h3 className="mb-4 text-sm font-semibold text-paper">O que aparece no post</h3>

              <div className="grid gap-4">
                <div>
                  <label htmlFor="post-cliente" className="field-label">
                    Nome para exibir <span className="text-steel-600">(opcional)</span>
                  </label>
                  <input
                    id="post-cliente"
                    className="input"
                    value={formulario.nomeCliente}
                    onChange={(e) => patchFormulario({ nomeCliente: e.target.value })}
                    placeholder="Ex.: Ana"
                    maxLength={80}
                  />
                  <p className="mt-2 text-xs text-steel-500">Só o nome que o cliente liberou.</p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="post-legenda" className="field-label">
                      Legenda <span className="text-steel-600">(opcional)</span>
                    </label>
                    <span className="numeros mb-1 text-xs text-steel-500">
                      {formulario.legenda.length}/300
                    </span>
                  </div>
                  <textarea
                    id="post-legenda"
                    className="input min-h-28 resize-none py-3"
                    value={formulario.legenda}
                    onChange={(e) => patchFormulario({ legenda: e.target.value })}
                    placeholder="Como um post do Instagram: uma frase da entrega, um agradecimento…"
                    maxLength={300}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ── Publicação: o que falta, a autorização e o botão ── */}
          <aside className="space-y-4 lg:sticky lg:top-[4.5rem]">
            <section className="border border-line bg-painel p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-paper">Publicação</h3>
                <span
                  className={`inline-flex min-h-6 items-center gap-1.5 border px-2 text-[11px] font-medium ${
                    formulario.status === 'publicada'
                      ? 'border-ok/40 bg-ok/10 text-ok'
                      : 'border-line-forte text-steel-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${
                      formulario.status === 'publicada' ? 'bg-ok' : 'bg-steel-500'
                    }`}
                  />
                  {rotuloStatus[formulario.status]}
                </span>
              </div>

              <ul className="space-y-2.5">
                {requisitos.map((requisito) => (
                  <li key={requisito.texto} className="flex items-start gap-2.5 text-xs leading-snug">
                    {requisito.ok ? (
                      <Check className="mt-px size-4 shrink-0 text-ok" aria-hidden="true" />
                    ) : (
                      <Circle className="mt-px size-4 shrink-0 text-steel-600" aria-hidden="true" />
                    )}
                    <span className={requisito.ok ? 'text-steel-300' : 'text-steel-400'}>
                      {requisito.texto}
                    </span>
                  </li>
                ))}
              </ul>

              {/* A autorização é o que protege a loja: mora ao lado do
                  botão que ela libera. */}
              <label
                htmlFor="post-autorizacao"
                className="mt-4 flex cursor-pointer items-start gap-3 border border-line bg-painel-2 p-3 transition-colors hover:border-line-forte"
              >
                <input
                  id="post-autorizacao"
                  type="checkbox"
                  checked={formulario.autorizacaoPublicacao}
                  onChange={(e) => patchFormulario({ autorizacaoPublicacao: e.target.checked })}
                  className="mt-0.5 size-[1.05rem] shrink-0 accent-red-500"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-paper">
                    <ShieldCheck className="size-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                    O cliente liberou as fotos
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-steel-500">
                    Sem isso o post não vai ao ar. Rascunho dispensa.
                  </span>
                </span>
              </label>

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => void salvar('publicada')}
                  disabled={salvando || !podePublicar}
                  className="foco-painel btn btn-primary min-h-11 w-full justify-center gap-2 px-4 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="size-4" aria-hidden="true" />
                  {formulario.status === 'publicada' ? 'Salvar publicação' : 'Publicar venda'}
                </button>
                <button
                  type="button"
                  onClick={() => void salvar('rascunho')}
                  disabled={salvando}
                  className="foco-painel btn btn-secondary min-h-11 w-full justify-center px-4"
                >
                  Salvar rascunho
                </button>
              </div>

              {postEmEdicao ? (
                <div className="mt-4 space-y-2 border-t border-line pt-3">
                  {postEmEdicao.status === 'publicada' ? (
                    <button
                      type="button"
                      onClick={() => void ocultar(postEmEdicao)}
                      className="foco-painel min-h-9 w-full border border-line-forte px-3 text-xs text-steel-300 transition-colors hover:text-paper"
                    >
                      Ocultar do site
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void arquivar(postEmEdicao)}
                    className="foco-painel inline-flex min-h-9 w-full items-center justify-center gap-1.5 border border-line px-3 text-xs text-steel-500 transition-colors hover:border-red-400/50 hover:text-red-300"
                  >
                    <Archive className="size-3.5" aria-hidden="true" />
                    Arquivar post
                  </button>
                </div>
              ) : null}
            </section>

            <section className="border border-line bg-painel p-4 sm:p-5">
              <h3 className="mb-4 text-sm font-semibold text-paper">Detalhes</h3>

              <div className="grid gap-4">
                <div>
                  <label htmlFor="post-data" className="field-label">
                    Data da entrega
                  </label>
                  {/* O input de data já traz o próprio botão de calendário:
                      um segundo ícone ao lado só confundia. */}
                  <input
                    id="post-data"
                    className="input"
                    type="date"
                    value={formulario.entregueEm}
                    onChange={(e) => patchFormulario({ entregueEm: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="post-ordem" className="field-label">
                    Posição no mural
                  </label>
                  <input
                    id="post-ordem"
                    className="input"
                    type="number"
                    min={0}
                    step={1}
                    value={formulario.ordem}
                    onChange={(e) => patchFormulario({ ordem: Number(e.target.value) })}
                  />
                  <p className="mt-2 text-xs text-steel-500">Número menor aparece primeiro.</p>
                </div>
              </div>
            </section>
          </aside>
        </form>
      </section>
    )
  }

  /* ============================================================
     LISTA — a fila de vendas
     ============================================================ */
  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="vendidas-titulo">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h2 id="vendidas-titulo" className="font-display text-3xl font-semibold text-paper sm:text-4xl">
            Vendidas
          </h2>
          <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-steel-400">
            Toda moto marcada como vendida no Estoque cai aqui. Abra a venda, escolha as fotos e
            publique em "Sonhos realizados".
          </p>
        </div>
        <button
          type="button"
          onClick={() => abrirEditor('novoAvulso')}
          className="foco-painel inline-flex min-h-10 w-fit shrink-0 items-center gap-2 border border-line-forte px-4 text-sm text-steel-300 transition-colors hover:border-claro/30 hover:text-paper"
        >
          <Plus className="size-4" aria-hidden="true" />
          Post avulso
        </button>
      </header>

      {erro ? (
        <div role="alert" className="mt-5 border border-red-400/30 bg-red-950/20 p-4 text-sm text-red-200">
          <p>Não foi possível abrir os posts: {erro}</p>
          <p className="mt-2 text-red-200/80">
            Se a tabela ainda não existe, aplique a migração 0007 descrita em supabase/README.md.
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex w-fit gap-1 border border-line bg-painel-2 p-1" role="group" aria-label="Filtrar vendas">
          {FILTROS.map(({ valor, rotulo }) => {
            const ativo = filtro === valor
            return (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                aria-pressed={ativo}
                className={`foco-painel inline-flex min-h-11 items-center gap-1.5 border px-3 text-xs font-medium transition-colors sm:min-h-9 ${
                  ativo
                    ? 'border-line-forte bg-painel-3 text-paper'
                    : 'border-transparent text-steel-400 hover:text-paper'
                }`}
              >
                {rotulo}
                <span className={`numeros ${ativo ? 'text-steel-300' : 'text-steel-600'}`}>
                  {contagens[valor]}
                </span>
              </button>
            )
          })}
        </div>

      </div>

      {carregando ? (
        <p className="py-12 text-center text-sm text-steel-400" role="status">
          Carregando vendas…
        </p>
      ) : visiveis.length === 0 ? (
        <div className="mt-5 border border-line bg-painel px-5 py-14 text-center">
          <ImagePlus className="mx-auto size-6 text-steel-500" aria-hidden="true" />
          <p className="mt-4 font-medium text-paper">
            {filtro === 'publicadas'
              ? 'Nenhum post publicado ainda.'
              : filtro === 'pendentes'
                ? 'Tudo publicado: nenhuma venda esperando post.'
                : 'Nenhuma moto vendida ainda.'}
          </p>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm text-steel-400">
            {filtro === 'todas'
              ? 'Marque uma moto como vendida no Estoque e ela entra aqui pronta para publicar.'
              : 'Troque o filtro para ver as outras vendas.'}
          </p>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((item) => (
            <CartaoVenda
              key={item.chave}
              item={item}
              onAbrir={() => {
                if (item.moto) {
                  if (item.post) abrirEditor('post', item.moto, item.post)
                  else abrirEditor('moto', item.moto)
                  return
                }
                if (item.post) abrirEditor('post', undefined, item.post)
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

/* ============================================================
   CARTÃO DA VENDA
   ============================================================ */
type EstadoPost = 'publicada' | 'rascunho' | 'sem-post'

interface LinhaVenda {
  chave: string
  moto?: Motorcycle
  post?: EntregaRegistro
  titulo: string
  capa?: string
  estado: EstadoPost
  data: string
  cliente: string
  fotos: number
}

const SELO_ESTADO: Record<EstadoPost, { rotulo: string; ponto: string; texto: string }> = {
  publicada: { rotulo: 'Publicada', ponto: 'bg-ok', texto: 'text-ok' },
  rascunho: { rotulo: 'Rascunho', ponto: 'bg-steel-400', texto: 'text-steel-200' },
  'sem-post': { rotulo: 'Falta post', ponto: 'bg-warn', texto: 'text-warn' },
}

const DICA_ESTADO: Record<EstadoPost, string> = {
  publicada: 'Abrir post',
  rascunho: 'Continuar rascunho',
  'sem-post': 'Montar o post',
}

/**
 * O cartão da venda é o toque inteiro: nenhum botão espremido no canto.
 * As ações (publicar, ocultar, arquivar) vivem na tela de dentro, para
 * onde este cartão leva.
 */
function CartaoVenda({ item, onAbrir }: { item: LinhaVenda; onAbrir: () => void }) {
  const selo = SELO_ESTADO[item.estado]
  return (
    <li>
      <button
        type="button"
        onClick={onAbrir}
        className="foco-painel group flex h-full w-full flex-col overflow-hidden border border-line bg-painel text-left transition-colors hover:border-line-forte"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-painel-2">
          {item.capa ? (
            <img
              src={item.capa}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <span className="grid size-full place-items-center text-steel-600">
              <ImagePlus className="size-6" aria-hidden="true" />
            </span>
          )}

          <span className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            <span className="inline-flex min-h-6 items-center gap-1.5 bg-night-950/90 px-2 text-[11px] font-medium">
              <span aria-hidden="true" className={`size-1.5 rounded-full ${selo.ponto}`} />
              <span className={selo.texto}>{selo.rotulo}</span>
            </span>
            {item.fotos > 1 ? (
              <span className="inline-flex min-h-6 items-center gap-1 bg-night-950/90 px-2 text-[11px] text-steel-200">
                <Images className="size-3" aria-hidden="true" />
                {item.fotos}
              </span>
            ) : null}
          </span>
        </span>

        <span className="flex flex-1 flex-col p-4">
          <span className="truncate font-display text-base font-semibold text-paper">{item.titulo}</span>
          <span className="mt-1 text-xs text-steel-400">
            {[dataCurta(item.data) || 'Sem data de entrega', item.cliente].filter(Boolean).join(' · ')}
          </span>
          <span className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-semibold text-steel-300 transition-colors group-hover:text-paper">
            {DICA_ESTADO[item.estado]}
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </span>
      </button>
    </li>
  )
}
