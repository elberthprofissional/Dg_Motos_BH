import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, ImageOff, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { EntregaParaSalvar } from '../../lib/entregas'
import {
  arquivarEntrega,
  buscarEntregasAdmin,
  removerFotosEntrega,
  salvarEntrega,
} from '../../lib/entregas'
import type { EntregaRegistro } from '../../data/entregas'
import type { Feedback } from '../ui/Toast'
import { MarcaCapa } from './MarcaCapa'
import { PublicacaoEditor } from './PublicacaoEditor'
import type { SalvamentoPublicacao } from './PublicacaoEditor'

interface PublicacoesTabProps {
  onFeedback: (feedback: Feedback) => void
}

const FILTROS = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'publicadas', rotulo: 'No ar' },
  { valor: 'rascunhos', rotulo: 'Rascunhos' },
] as const

type FiltroPublicacao = (typeof FILTROS)[number]['valor']

const BOTAO_PRIMARIO =
  'foco-painel inline-flex min-h-11 items-center justify-center gap-2 bg-paper px-4 text-sm font-semibold text-night-950 transition-colors hover:bg-steel-300'

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function dataCurta(data: string): string {
  if (!data) return ''
  const valor = new Date(`${data}T12:00:00`)
  if (Number.isNaN(valor.valueOf())) return ''
  return `${valor.getDate()} ${MESES_CURTOS[valor.getMonth()]} ${valor.getFullYear()}`
}

function faltasDoRascunho(post: EntregaRegistro): string | null {
  const faltas: string[] = []
  if (post.fotos.length === 0) faltas.push('uma foto')
  if (!post.autorizacaoPublicacao) faltas.push('a autorização')
  if (faltas.length === 0) return null
  return faltas.length === 2 ? 'Falta uma foto e a autorização' : `Falta ${faltas[0]}`
}

function novaPublicacao(ordem: number): EntregaRegistro {
  return {
    id: crypto.randomUUID(),
    // O banco exige um nome, mas ele não é exibido em lugar nenhum.
    motoId: '',
    motoNome: 'Publicação',
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
 * PUBLICAÇÕES — o mural visto por dentro
 * ============================================================
 * A tela é uma prova de contato: cada entrega é uma fita de molduras
 * numeradas e a capa leva a marca de lápis vermelho. O que se
 * administra é a foto, não o anúncio — modelo da moto, nome do
 * cliente e anotação nunca atravessam a fronteira do painel.
 */
export function PublicacoesTab({ onFeedback }: PublicacoesTabProps) {
  const [posts, setPosts] = useState<EntregaRegistro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroPublicacao>('todas')
  const [formulario, setFormulario] = useState<EntregaRegistro | null>(null)
  const [uploadsPendentes, setUploadsPendentes] = useState<string[]>([])
  const [salvando, setSalvando] = useState<SalvamentoPublicacao>(null)
  const [arquivando, setArquivando] = useState(false)

  function recarregar(mostrarCarregando = false) {
    if (mostrarCarregando) setCarregando(true)
    return buscarEntregasAdmin()
      .then((resultado) => {
        setPosts(resultado)
        setErro(null)
      })
      .catch((e: unknown) => {
        setErro(e instanceof Error ? e.message : 'Não foi possível carregar as publicações.')
      })
      .finally(() => {
        if (mostrarCarregando) setCarregando(false)
      })
  }

  useEffect(() => {
    let vivo = true
    void buscarEntregasAdmin()
      .then((resultado) => {
        if (vivo) setPosts(resultado)
      })
      .catch((e: unknown) => {
        if (vivo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar as publicações.')
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  const ativas = useMemo(() => posts.filter((post) => post.status !== 'arquivada'), [posts])

  const visiveis = ativas.filter((post) => {
    if (filtro === 'publicadas') return post.status === 'publicada'
    if (filtro === 'rascunhos') return post.status === 'rascunho'
    return true
  })

  const contagens: Record<FiltroPublicacao, number> = {
    todas: ativas.length,
    publicadas: ativas.filter((post) => post.status === 'publicada').length,
    rascunhos: ativas.filter((post) => post.status === 'rascunho').length,
  }

  function abrir(post?: EntregaRegistro) {
    setFormulario(
      post
        ? { ...post, fotos: [...post.fotos], imagens: [...post.imagens] }
        : novaPublicacao(ativas.length),
    )
    setUploadsPendentes([])
  }

  async function fecharEditor() {
    // Toda foto enviada nesta edição ainda não foi salva: sai do bucket
    // se o dono desistir, mesmo que já esteja aparecendo na prévia.
    if (uploadsPendentes.length > 0) {
      await removerFotosEntrega(uploadsPendentes).catch(() => undefined)
    }
    setUploadsPendentes([])
    setFormulario(null)
  }

  const patchFormulario = (patch: Partial<EntregaRegistro>) =>
    setFormulario((atual) => (atual ? { ...atual, ...patch } : atual))

  async function salvar(status: 'rascunho' | 'publicada') {
    if (!formulario) return
    if (status === 'publicada' && (formulario.fotos.length === 0 || !formulario.autorizacaoPublicacao)) {
      onFeedback({
        tipo: 'erro',
        texto: 'Para publicar, adicione ao menos uma foto e confirme a autorização de uso.',
      })
      return
    }

    const eraPublicada = formulario.status === 'publicada'
    setSalvando(status)
    const dados: EntregaParaSalvar = {
      id: formulario.id,
      motoId: '',
      motoNome: 'Publicação',
      fotos: formulario.fotos,
      legenda: formulario.legenda,
      nomeCliente: '',
      entregueEm: formulario.entregueEm,
      autorizacaoPublicacao: formulario.autorizacaoPublicacao,
      status,
      ordem: formulario.ordem,
    }

    try {
      await salvarEntrega(dados)

      // Fotos que saíram da galeria deixam o bucket junto com o save.
      const anteriores = posts.find((post) => post.id === formulario.id)?.fotos ?? []
      const descartadas = [...new Set([...anteriores, ...uploadsPendentes])].filter(
        (path) => !formulario.fotos.includes(path),
      )
      if (descartadas.length > 0) {
        await removerFotosEntrega(descartadas).catch(() => undefined)
      }
      setUploadsPendentes([])

      await recarregar()
      setFormulario(null)
      onFeedback({
        tipo: 'ok',
        texto:
          status === 'publicada'
            ? eraPublicada
              ? 'Alterações salvas no mural.'
              : 'Publicação no ar em "Sonhos realizados".'
            : eraPublicada
              ? 'Publicação fora do ar. O rascunho ficou salvo.'
              : 'Publicação salva como rascunho.',
      })
    } catch (e) {
      onFeedback({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível salvar a publicação.',
      })
    } finally {
      setSalvando(null)
    }
  }

  async function arquivar(post: EntregaRegistro) {
    setArquivando(true)
    try {
      await arquivarEntrega(post.id)
      await recarregar()
      await fecharEditor()
      onFeedback({ tipo: 'ok', texto: 'Publicação arquivada. Ela não aparece mais na galeria.' })
    } catch (e) {
      onFeedback({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível arquivar a publicação.',
      })
    } finally {
      setArquivando(false)
    }
  }

  if (formulario) {
    const registroAtual = formulario
    const emEdicao = posts.some((post) => post.id === registroAtual.id)

    function mudarFotos(fotos: string[], imagens: string[]) {
      setUploadsPendentes((anterior) => {
        const novas = fotos.filter(
          (path) =>
            !registroAtual.fotos.includes(path) &&
            !posts.some(
              (post) => post.id === registroAtual.id && post.fotos.includes(path),
            ),
        )
        return [...new Set([...anterior.filter((path) => fotos.includes(path)), ...novas])]
      })
      patchFormulario({ fotos, imagens })
    }

    return (
      <PublicacaoEditor
        registro={registroAtual}
        emEdicao={emEdicao}
        salvando={salvando}
        arquivando={arquivando}
        onVoltar={() => void fecharEditor()}
        onChange={patchFormulario}
        onFotosChange={mudarFotos}
        onSalvar={(status) => void salvar(status)}
        onArquivar={async () => {
          const post = posts.find((item) => item.id === registroAtual.id)
          if (post) await arquivar(post)
        }}
      />
    )
  }

  const mostrarCtaNoTopo = !carregando && ativas.length > 0

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="publicacoes-titulo">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.14em] text-steel-500 uppercase">
            Mural do site
          </p>
          <h2
            id="publicacoes-titulo"
            className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-paper sm:text-[2rem]"
          >
            Sonhos realizados
          </h2>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-steel-400">
            As fotos de entrega que o visitante vê. Só as imagens e o mês saem do painel; modelo da
            moto, nome do cliente e sua anotação ficam aqui.
          </p>
        </div>

        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <Link
            to="/sonhos"
            target="_blank"
            rel="noreferrer"
            className="foco-painel inline-flex min-h-11 w-full items-center justify-center gap-1.5 px-3 text-sm font-medium text-steel-400 transition-colors hover:text-paper sm:w-auto"
          >
            Ver o mural
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
            <span className="sr-only"> (abre em nova aba)</span>
          </Link>
          {mostrarCtaNoTopo ? (
            <button
              type="button"
              onClick={() => abrir()}
              className={`${BOTAO_PRIMARIO} w-full sm:w-auto`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova publicação
            </button>
          ) : null}
        </div>
      </header>

      {carregando ? (
        <EsqueletoPublicacoes />
      ) : erro && posts.length === 0 ? (
        <ErroPublicacoes erro={erro} onTentar={() => void recarregar(true)} />
      ) : (
        <>
          {erro ? <AvisoErro onTentar={() => void recarregar(true)} /> : null}

          {ativas.length > 0 ? (
            <div
              className="no-scrollbar mt-6 flex gap-6 overflow-x-auto border-b border-line"
              role="group"
              aria-label="Filtrar publicações"
            >
              {FILTROS.map(({ valor, rotulo }) => {
                const ativo = filtro === valor
                return (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltro(valor)}
                    aria-pressed={ativo}
                    className={`foco-painel -mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 text-sm font-medium transition-colors ${
                      ativo
                        ? 'border-paper text-paper'
                        : 'border-transparent text-steel-500 hover:text-steel-300'
                    }`}
                  >
                    {rotulo}
                    <span
                      className={`numeros text-xs ${ativo ? 'text-steel-300' : 'text-steel-600'}`}
                    >
                      {contagens[valor]}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {visiveis.length === 0 ? (
            ativas.length === 0 ? (
              <PrimeiraPublicacao onCriar={() => abrir()} />
            ) : (
              <VazioFiltrado filtro={filtro} contagens={contagens} onFiltrar={setFiltro} />
            )
          ) : (
            <ListaPublicacoes posts={visiveis} onAbrir={abrir} />
          )}
        </>
      )}
    </section>
  )
}

function EsqueletoPublicacoes() {
  return (
    <div className="mt-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando publicações…</span>
      <div className="divide-y divide-line" aria-hidden="true">
        {[0, 1, 2].map((linha) => (
          <div
            key={linha}
            className="grid gap-3 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
          >
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((moldura) => (
                <span key={moldura} className="block w-14 sm:w-[4.6rem]">
                  <span className="block aspect-[4/5] bg-painel-2 motion-safe:animate-pulse" />
                  <span className="mt-1.5 block h-2 w-5 bg-painel-2/70 motion-safe:animate-pulse" />
                </span>
              ))}
            </div>
            <div className="space-y-2">
              <span className="block h-3 w-28 bg-painel-2 motion-safe:animate-pulse" />
              <span className="block h-3.5 w-44 bg-painel-2 motion-safe:animate-pulse" />
              <span className="block h-3 w-24 bg-painel-2/70 motion-safe:animate-pulse" />
            </div>
            <span className="hidden h-3 w-10 bg-painel-2 motion-safe:animate-pulse sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErroPublicacoes({ erro, onTentar }: { erro: string; onTentar: () => void }) {
  return (
    <section role="alert" className="mt-8 bg-painel p-6 sm:p-8">
      <h3 className="font-display text-xl font-semibold text-paper">
        Não foi possível abrir as publicações.
      </h3>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-steel-400">
        A lista não chegou do servidor. Confira a conexão e tente de novo.
      </p>
      <button
        type="button"
        onClick={onTentar}
        className="foco-painel mt-5 inline-flex min-h-11 items-center justify-center border border-line-forte px-4 text-sm font-medium text-steel-300 transition-colors hover:border-steel-400 hover:text-paper"
      >
        Tentar de novo
      </button>
      <details className="mt-5">
        <summary className="cursor-pointer text-xs text-steel-500">Detalhe técnico</summary>
        <p className="mt-2 text-xs leading-relaxed break-words text-steel-500">{erro}</p>
        <p className="mt-2 text-xs leading-relaxed text-steel-500">
          Se a tabela ainda não existe, aplique a migração 0007 descrita em supabase/README.md.
        </p>
      </details>
    </section>
  )
}

function AvisoErro({ onTentar }: { onTentar: () => void }) {
  return (
    <div
      role="alert"
      className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-painel px-4 py-3"
    >
      <p className="text-sm text-steel-300">
        A lista não atualizou. <span className="text-steel-500">Mostrando a última carga.</span>
      </p>
      <button
        type="button"
        onClick={onTentar}
        className="foco-painel inline-flex min-h-11 items-center px-2 text-xs font-medium text-steel-300 transition-colors hover:text-paper"
      >
        Tentar de novo
      </button>
    </div>
  )
}

function ProvaDeContatoVazia() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((indice) => (
          <div key={indice}>
            <div className="relative aspect-[4/5] border border-line bg-painel-2/50">
              {indice === 0 ? (
                <MarcaCapa className="absolute inset-2.5 text-brand-400" />
              ) : null}
            </div>
            <div className="mt-2 flex items-center justify-between gap-1 text-[10px]">
              <span
                className={`numeros ${indice === 0 ? 'text-brand-400' : 'text-steel-600'}`}
              >
                {String(indice + 1).padStart(2, '0')}
              </span>
              {indice === 0 ? <span className="text-brand-400">capa</span> : null}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-steel-500">Prova de contato · nenhuma foto</p>
    </div>
  )
}

const PASSOS = [
  {
    numero: '01',
    titulo: 'Fotos',
    texto: 'Escolha de 1 a 10 imagens da entrega.',
  },
  {
    numero: '02',
    titulo: 'Autorização',
    texto: 'Confirme que o cliente liberou o uso no site.',
  },
  {
    numero: '03',
    titulo: 'Publicação',
    texto: 'O post entra no mural e na galeria completa.',
  },
]

function PrimeiraPublicacao({ onCriar }: { onCriar: () => void }) {
  return (
    <div className="mt-8 grid bg-painel lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* No celular a mensagem abre a prova: o título e a ação não podem
          ficar abaixo das molduras vazias. No desktop a prova volta à
          esquerda, como manda a ficha. */}
      <div className="order-2 border-t border-line p-6 sm:p-8 lg:order-1 lg:flex lg:flex-col lg:justify-center lg:border-t-0 lg:border-r">
        <ProvaDeContatoVazia />
      </div>

      <div className="order-1 p-6 sm:p-8 lg:order-2">
        <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-paper">
          O mural ainda está vazio.
        </h3>
        <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-steel-400">
          Cada entrega vira uma prova de contato. Escolha as fotos, marque a capa e o post entra no
          site na hora.
        </p>

        <button type="button" onClick={onCriar} className={`${BOTAO_PRIMARIO} mt-6 w-full sm:w-auto`}>
          <Plus className="size-4" aria-hidden="true" />
          Nova publicação
        </button>

        <ol className="mt-6 border-t border-line">
          {PASSOS.map((passo) => (
            <li
              key={passo.numero}
              className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-line py-3"
            >
              <span className="numeros pt-0.5 text-[11px] text-steel-600">{passo.numero}</span>
              <span>
                <span className="block text-sm font-medium text-steel-300">{passo.titulo}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-steel-500">
                  {passo.texto}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-xs leading-relaxed text-steel-500">
          O site mostra só as fotos e o mês. Modelo da moto, nome do cliente e sua anotação nunca
          saem do painel.
        </p>
      </div>
    </div>
  )
}

function VazioFiltrado({
  filtro,
  contagens,
  onFiltrar,
}: {
  filtro: FiltroPublicacao
  contagens: Record<FiltroPublicacao, number>
  onFiltrar: (filtro: FiltroPublicacao) => void
}) {
  let titulo: string
  let texto: string
  let acao: string
  let destino: FiltroPublicacao

  if (filtro === 'publicadas' && contagens.rascunhos > 0) {
    titulo = 'Nada no ar ainda.'
    texto = `${
      contagens.rascunhos === 1 ? 'Você tem 1 rascunho salvo' : `Você tem ${contagens.rascunhos} rascunhos salvos`
    }. Abra para revisar, marcar a autorização e publicar.`
    acao = 'Ver rascunhos'
    destino = 'rascunhos'
  } else if (filtro === 'rascunhos' && contagens.publicadas > 0) {
    titulo = 'Nenhum rascunho guardado.'
    texto = 'Publicações em andamento aparecem aqui. As que já estão no mural ficam em No ar.'
    acao = 'Ver o que está no ar'
    destino = 'publicadas'
  } else {
    titulo = 'Nada por aqui.'
    texto = 'Nenhuma publicação neste filtro.'
    acao = 'Ver todas'
    destino = 'todas'
  }

  return (
    <div className="mt-6 bg-painel p-6 sm:p-8">
      <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-paper">{titulo}</h3>
      <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-steel-400">{texto}</p>
      <button
        type="button"
        onClick={() => onFiltrar(destino)}
        className="foco-painel mt-5 inline-flex min-h-11 items-center justify-center border border-line-forte px-4 text-sm font-medium text-steel-300 transition-colors hover:border-steel-400 hover:text-paper"
      >
        {acao}
      </button>
    </div>
  )
}

function ListaPublicacoes({
  posts,
  onAbrir,
}: {
  posts: EntregaRegistro[]
  onAbrir: (post: EntregaRegistro) => void
}) {
  return (
    <ul className="divide-y divide-line">
      {posts.map((post) => (
        <li key={post.id}>
          <button
            type="button"
            onClick={() => onAbrir(post)}
            className="foco-painel group grid w-full grid-cols-1 gap-3 py-5 text-left transition-colors hover:bg-claro/[0.02] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
          >
            <span className="flex gap-1.5" aria-hidden="true">
              {post.imagens.slice(0, 4).map((src, indice) => {
                const extras = post.fotos.length - 4
                return (
                  <span key={post.fotos[indice] ?? indice} className="block w-14 shrink-0 sm:w-[4.6rem]">
                    <span className="relative block aspect-[4/5] overflow-hidden bg-painel-2">
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          width={144}
                          height={180}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-steel-600">
                          <ImageOff className="size-4" />
                        </span>
                      )}

                      {indice === 0 ? (
                        <MarcaCapa className="pointer-events-none absolute inset-1 text-brand-400" />
                      ) : null}

                      {extras > 0 && indice === 3 ? (
                        <span className="absolute inset-0 grid place-items-center bg-night-950/75 text-sm font-semibold text-paper">
                          +{extras}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1.5 flex items-center justify-between gap-1 text-[10px]">
                      <span
                        className={`numeros ${indice === 0 ? 'text-brand-400' : 'text-steel-600'}`}
                      >
                        {String(indice + 1).padStart(2, '0')}
                      </span>
                      {indice === 0 ? <span className="text-brand-400">capa</span> : null}
                    </span>
                  </span>
                )
              })}

              {post.fotos.length === 0 ? (
                <span className="block w-14 shrink-0 sm:w-[4.6rem]">
                  <span className="grid aspect-[4/5] place-items-center border border-dashed border-line-forte bg-painel-2 text-steel-600">
                    <ImageOff className="size-4" />
                  </span>
                  <span className="mt-1.5 block text-[10px] text-steel-600">—</span>
                </span>
              ) : null}
            </span>

            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    post.status === 'publicada' ? 'bg-ok' : 'border border-steel-500'
                  }`}
                />
                <span className={post.status === 'publicada' ? 'text-steel-300' : 'text-steel-400'}>
                  {post.status === 'publicada' ? 'No ar' : 'Rascunho'}
                </span>
                <span aria-hidden="true" className="text-steel-600">
                  ·
                </span>
                <span className="text-steel-500">
                  {post.fotos.length} {post.fotos.length === 1 ? 'foto' : 'fotos'}
                </span>
              </span>

              <span className="mt-1 block text-sm text-steel-300">
                {dataCurta(post.entregueEm)
                  ? `Entregue em ${dataCurta(post.entregueEm)}`
                  : 'Sem data de entrega'}
              </span>

              {post.legenda ? (
                <span className="mt-1 block truncate text-xs text-steel-500">
                  Nota interna: “{post.legenda}”
                </span>
              ) : null}

              {post.status === 'rascunho' && faltasDoRascunho(post) ? (
                <span className="mt-2 block text-xs text-alerta">
                  {faltasDoRascunho(post)} para publicar.
                </span>
              ) : null}

              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-steel-400 sm:hidden">
                Abrir
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </span>

            <span className="hidden items-center gap-1.5 text-xs font-medium text-steel-400 transition-colors group-hover:text-paper sm:inline-flex">
              Abrir
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
