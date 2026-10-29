import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ImageOff, Trash2 } from 'lucide-react'
import type { EntregaParaSalvar } from '../../lib/entregas'
import {
  atualizarFotosEntrega,
  buscarEntregasAdmin,
  enviarFotosEntrega,
  moverFotoParaLixeira,
  salvarEntrega,
} from '../../lib/entregas'
import type { EntregaRegistro } from '../../data/entregas'
import { DIAS_NA_LIXEIRA } from '../../lib/painel'
import type { Feedback } from '../ui/Toast'
import { DialogoConfirmacao } from '../ui/DialogoConfirmacao'
import type { PedidoConfirmacao } from '../ui/DialogoConfirmacao'
import { AreaUploadFoto } from './AreaUploadFoto'

interface PublicacoesTabProps {
  onFeedback: (feedback: Feedback) => void
  /** Avisa o painel que a Lixeira ganhou uma foto (para recarregar lá). */
  onFotoNaLixeira: () => void
  /** Muda quando a Lixeira mexe nas fotos: obriga a recarregar o mural. */
  revisao: number
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function dataCurta(data: string): string {
  if (!data) return ''
  const valor = new Date(`${data}T12:00:00`)
  if (Number.isNaN(valor.valueOf())) return ''
  return `${valor.getDate()} ${MESES_CURTOS[valor.getMonth()]} ${valor.getFullYear()}`
}

/** Rascunho antigo só trava por falta de foto: é o único que falta. */
function faltasDoRascunho(post: EntregaRegistro): string | null {
  return post.fotos.length === 0 ? 'Falta uma foto' : null
}

/**
 * Registro → payload do upsert, sempre como publicada.
 *
 * A autorização saiu da interface: a coluna continua no banco e toda
 * publicação sai confirmada (é o que o check `entrega_publicada_autorizada`
 * exige, junto de pelo menos uma foto).
 */
function dadosDe(
  post: EntregaRegistro,
  mudancas: Partial<EntregaParaSalvar> = {},
): EntregaParaSalvar {
  return {
    id: post.id,
    motoId: post.motoId,
    // "Publicação" foi o nome genérico das versões antigas: agora é
    // ausência de informação, não um modelo.
    motoNome: post.motoNome === 'Publicação' ? '' : post.motoNome,
    fotos: post.fotos,
    legenda: post.legenda,
    nomeCliente: post.nomeCliente,
    entregueEm: post.entregueEm,
    autorizacaoPublicacao: true,
    status: 'publicada',
    ordem: post.ordem,
    ...mudancas,
  }
}

/**
 * ============================================================
 * PUBLICAÇÕES — o mural visto por dentro
 * ============================================================
 * O mural é a única superfície: cada foto entra com a data do envio e,
 * no quadro, a única manutenção é apagar. Quem comprou a moto fica no
 * livro de saídas (aba Vendidas), não aqui. As fotos sobem e a
 * publicação já nasce no ar.
 */
export function PublicacoesTab({
  onFeedback,
  onFotoNaLixeira,
  revisao,
}: PublicacoesTabProps) {
  const [posts, setPosts] = useState<EntregaRegistro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [pedidoRemocao, setPedidoRemocao] = useState<PedidoConfirmacao | null>(null)
  const arquivoRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

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
        if (!vivo) return
        setPosts(resultado)
        setErro(null)
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
  }, [revisao])

  const ativas = useMemo(() => posts.filter((post) => post.status !== 'arquivada'), [posts])

  const rascunhos = useMemo(() => ativas.filter((post) => post.status === 'rascunho'), [ativas])

  // A faixa publica o rascunho mais recente; o texto indica o que falta.
  const rascunhoRecente = useMemo(() => {
    if (rascunhos.length === 0) return null
    return [...rascunhos].sort((a, b) =>
      (b.entregueEm || '').localeCompare(a.entregueEm || ''),
    )[0]
  }, [rascunhos])

  const totalFotos = useMemo(
    () => ativas.reduce((total, post) => total + post.fotos.length, 0),
    [ativas],
  )

  const entrada = {
    enviando: criando,
    onEscolher: () => arquivoRef.current?.click(),
    onTirarFoto: () => cameraRef.current?.click(),
    onArquivos: (arquivos: FileList) => void enviar(arquivos),
  }

  /**
   * Escolher fotos → comprime, sobe para o bucket e cria a publicação
   * já no ar. Falha parcial limpa o que subiu: não fica foto órfã
   * esperando um registro que nunca vai existir.
   */
  async function enviar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return
    setCriando(true)
    try {
      const id = crypto.randomUUID()
      const { paths } = await enviarFotosEntrega(id, [...arquivos])

      await salvarEntrega({
        id,
        motoId: '',
        // O nome é perguntado logo depois, no diálogo que abre sozinho:
        // gravar "Publicação" aqui era inventar um modelo que não existe.
        motoNome: '',
        fotos: paths,
        legenda: '',
        nomeCliente: '',
        entregueEm: new Date().toISOString().slice(0, 10),
        autorizacaoPublicacao: true,
        status: 'publicada',
        ordem: ativas.length,
      })

      await recarregar()
      onFeedback({
        tipo: 'ok',
        texto:
          paths.length === 1
            ? '1 foto no mural e no site.'
            : `${paths.length} fotos no mural e no site.`,
      })
    } catch (e) {
      onFeedback({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível enviar as fotos.',
      })
    } finally {
      setCriando(false)
      if (arquivoRef.current) arquivoRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  /**
   * Apagar foto agora é reversível: a RPC tira a foto do mural e deixa
   * o arquivo guardado na Lixeira, em Configurações, por 30 dias. Se
   * era a última, a publicação é arquivada e volta ao ar quando a foto
   * for restaurada.
   *
   * `caminho` vazio = publicação que nunca teve foto: aí não há arquivo
   * para guardar, só o registro para arquivar.
   */
  async function removerFoto(post: EntregaRegistro, caminho: string) {
    setRemovendo(true)
    try {
      if (caminho) {
        await moverFotoParaLixeira(post.id, caminho)
      } else {
        await atualizarFotosEntrega(post.id, [])
      }
      await recarregar()
      if (caminho) onFotoNaLixeira()
      onFeedback({
        tipo: 'ok',
        texto: caminho
          ? `Foto apagada do mural e guardada na Lixeira por ${DIAS_NA_LIXEIRA} dias.`
          : 'Publicação sem fotos saiu do mural.',
      })
    } catch (e) {
      onFeedback({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível apagar a foto.',
      })
    } finally {
      setRemovendo(false)
    }
  }

  function pedirRemocao(post: EntregaRegistro, indice: number) {
    const caminho = post.fotos[indice] ?? ''
    const semFoto = caminho === ''
    setPedidoRemocao({
      titulo: semFoto ? 'Tirar publicação do mural' : 'Apagar foto',
      descricao: semFoto
        ? 'Esta publicação não tem nenhuma foto: ela sai do mural e do site. Não dá para desfazer.'
        : post.fotos.length === 1
          ? `É a única foto desta publicação: ela sai do mural e do site e fica na Lixeira por ${DIAS_NA_LIXEIRA} dias. A publicação é arquivada até você restaurar.`
          : `A foto sai do mural e do site e fica na Lixeira por ${DIAS_NA_LIXEIRA} dias — dá para restaurar.`,
      rotuloConfirmar: semFoto ? 'Tirar do mural' : 'Apagar',
      rotuloOcupado: semFoto ? 'Tirando…' : 'Apagando…',
      onConfirmar: async () => {
        await removerFoto(post, caminho)
        setPedidoRemocao(null)
      },
    })
  }

  /** Rascunho antigo (só o painel antigo criava) vai para o ar aqui. */
  async function publicarRascunho(post: EntregaRegistro) {
    if (post.fotos.length === 0) {
      onFeedback({ tipo: 'erro', texto: 'Para publicar, adicione ao menos uma foto.' })
      return
    }
    setPublicando(true)
    try {
      await salvarEntrega(dadosDe(post))
      await recarregar()
      onFeedback({ tipo: 'ok', texto: 'Publicação no ar em "Sonhos realizados".' })
    } catch (e) {
      onFeedback({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível publicar.',
      })
    } finally {
      setPublicando(false)
    }
  }

  return (
    <section className="publicacoes-pagina mx-auto max-w-6xl" aria-labelledby="publicacoes-titulo">
      <header className="publicacoes-cabecalho">
        <div className="publicacoes-titulo-linha">
          <div className="min-w-0">
            <h2 id="publicacoes-titulo" className="publicacoes-h2">
              Sonhos realizados
            </h2>
            <p className="publicacoes-subtitulo">
              Cada entrega vira foto no site. A data entra sozinha, no dia do envio.
            </p>
          </div>

          <AreaUploadFoto
            {...entrada}
            variante="botao"
            rotulo="Adicionar foto"
            className="w-full sm:w-auto"
          />
        </div>

        {!carregando && totalFotos > 0 ? (
          <p className="publicacoes-contador">
            {totalFotos === 1 ? '1 foto no mural' : `${totalFotos} fotos no mural`}
          </p>
        ) : null}
      </header>

      {carregando ? (
        <EsqueletoPublicacoes />
      ) : erro && posts.length === 0 ? (
        <ErroPublicacoes erro={erro} onTentar={() => void recarregar(true)} />
      ) : (
        <>
          {erro ? <AvisoErro onTentar={() => void recarregar(true)} /> : null}

          {rascunhoRecente ? (
            <FaixaRascunhos
              quantidade={rascunhos.length}
              destaque={rascunhoRecente}
              publicando={publicando}
              onPublicar={() => void publicarRascunho(rascunhoRecente)}
            />
          ) : null}

          {ativas.length === 0 ? (
            <VazioPublicacoes {...entrada} />
          ) : (
            <GaleriaPublicacoes
              posts={ativas}
              removendo={removendo}
              onApagar={pedirRemocao}
            />
          )}
        </>
      )}

      {/* Os dois inputs nativos ficam fora da árvore de acessibilidade:
          o controle real é o botão "Adicionar foto". */}
      <input
        ref={arquivoRef}
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void enviar(e.currentTarget.files)}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void enviar(e.currentTarget.files)}
        className="hidden"
      />

      <DialogoConfirmacao
        pedido={pedidoRemocao}
        onFechar={() => setPedidoRemocao(null)}
        ocupado={removendo}
      />
    </section>
  )
}

function FaixaRascunhos({
  quantidade,
  destaque,
  publicando,
  onPublicar,
}: {
  quantidade: number
  destaque: EntregaRegistro
  publicando: boolean
  onPublicar: () => void
}) {
  const motivo = faltasDoRascunho(destaque)

  return (
    <div className="publicacoes-pendentes">
      <p className="publicacoes-pendentes-texto">
        <span
          aria-hidden="true"
          className="publicacoes-ponto publicacoes-ponto--rascunho"
        />
        <span>
          {quantidade === 1 ? '1 rascunho fora do ar' : `${quantidade} rascunhos fora do ar`}
          {quantidade === 1 ? (
            <span className="publicacoes-pendentes-motivo">
              {' · '}
              {motivo ? `${motivo.toLowerCase()} para publicar` : 'pronto para publicar'}
            </span>
          ) : null}
        </span>
      </p>

      <button
        type="button"
        onClick={onPublicar}
        disabled={publicando || motivo !== null}
        className="foco-painel publicacoes-pendentes-acao disabled:cursor-not-allowed disabled:opacity-50"
      >
        {publicando ? 'Publicando…' : 'Publicar'}
        {publicando ? null : <ArrowRight className="size-3.5" aria-hidden="true" />}
      </button>
    </div>
  )
}

function EsqueletoPublicacoes() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando publicações…</span>
      <ul className="publicacoes-mosaico" aria-hidden="true">
        {Array.from({ length: 10 }, (_, quadro) => (
          <li
            key={quadro}
            className="publicacoes-quadro motion-safe:animate-pulse"
          />
        ))}
      </ul>
    </div>
  )
}

function ErroPublicacoes({ erro, onTentar }: { erro: string; onTentar: () => void }) {
  return (
    <section role="alert" className="publicacoes-erro">
      <h3 className="publicacoes-erro-titulo">Não foi possível abrir as publicações.</h3>
      <p className="publicacoes-erro-texto">
        A lista não chegou do servidor. Confira a conexão e tente de novo.
      </p>
      <button
        type="button"
        onClick={onTentar}
        className="foco-painel btn btn-secondary mt-5 min-h-11 px-4 text-sm font-medium"
      >
        Tentar de novo
      </button>
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-steel-500">Detalhe técnico</summary>
        <p className="mt-2 text-xs leading-relaxed break-words text-steel-500">{erro}</p>
        <p className="mt-2 text-xs leading-relaxed text-steel-500">
          Se a tabela ainda não existe, aplique a migração 08 descrita em supabase/README.md.
        </p>
      </details>
    </section>
  )
}

function AvisoErro({ onTentar }: { onTentar: () => void }) {
  return (
    <div role="alert" className="publicacoes-aviso">
      <p>
        <strong>A lista não atualizou.</strong> Mostrando a última carga.
      </p>
      <button
        type="button"
        onClick={onTentar}
        className="foco-painel inline-flex min-h-11 items-center px-1 text-xs font-semibold text-steel-300 transition-colors hover:text-paper"
      >
        Tentar de novo
      </button>
    </div>
  )
}

interface EntradaUploadProps {
  enviando: boolean
  onEscolher: () => void
  onTirarFoto: () => void
  onArquivos: (arquivos: FileList) => void
}

function VazioPublicacoes({
  enviando,
  onEscolher,
  onTirarFoto,
  onArquivos,
}: EntradaUploadProps) {
  return (
    <div className="publicacoes-vazio">
      <div className="publicacoes-vazio-prova" aria-hidden="true">
        {[0, 1, 2, 3].map((quadro) => (
          <span key={quadro} className="publicacoes-vazio-quadro numeros">
            {String(quadro + 1).padStart(2, '0')}
          </span>
        ))}
      </div>

      <div>
        <p className="publicacoes-vazio-titulo">Nenhuma publicação no mural ainda.</p>
        <p className="publicacoes-vazio-descricao">
          Escolha as fotos da entrega e elas entram no mural do site.
        </p>
        <div className="mt-4">
          <AreaUploadFoto
            enviando={enviando}
            rotulo="Adicionar foto"
            resumo="Escolher da galeria ou tirar na hora"
            onEscolher={onEscolher}
            onTirarFoto={onTirarFoto}
            onArquivos={onArquivos}
          />
        </div>
      </div>
    </div>
  )
}

function GaleriaPublicacoes({
  posts,
  removendo,
  onApagar,
}: {
  posts: EntregaRegistro[]
  removendo: boolean
  onApagar: (post: EntregaRegistro, indice: number) => void
}) {
  return (
    <ul className="publicacoes-mosaico">
      {posts.flatMap((post) => {
        const data = dataCurta(post.entregueEm)
        // "Publicação" era o nome genérico das versões antigas: é
        // ausência de informação, não um modelo de moto.
        const nome = post.motoNome === 'Publicação' ? '' : post.motoNome.trim()
        const total = Math.max(post.fotos.length, 1)
        const descricao = nome ? `da ${nome}` : 'da entrega'
        const legenda = data ? `${descricao}, em ${data}` : descricao

        return Array.from({ length: total }, (_, indice) => {
          const src = post.imagens[indice] ?? null
          const semFoto = post.fotos.length === 0
          // Quadro de publicação sem foto não apaga imagem nenhuma:
          // ele tira a publicação do mural.
          const rotuloApagar = semFoto
            ? `Tirar a publicação ${legenda} do mural`
            : `Apagar a foto ${indice + 1} ${legenda}`

          return (
            <li key={`${post.id}-${indice}`} className="publicacoes-quadro">
              {src ? (
                <img
                  src={src}
                  alt={`Foto ${indice + 1} ${legenda}`}
                  width={960}
                  height={1200}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="publicacoes-quadro-vazia" aria-hidden="true">
                  <ImageOff className="size-5" />
                  {semFoto ? 'Sem fotos' : 'Foto indisponível'}
                </span>
              )}

              <span aria-hidden="true" className="publicacoes-quadro-sombra" />

              <div className="publicacoes-quadro-info">
                {post.status !== 'publicada' ? (
                  <span className="publicacoes-quadro-fora">Fora do ar</span>
                ) : null}
                <p className="publicacoes-quadro-meta numeros">{data || 'Sem data'}</p>
              </div>

              <div className="publicacoes-quadro-acoes">
                <button
                  type="button"
                  onClick={() => onApagar(post, indice)}
                  disabled={removendo}
                  aria-label={rotuloApagar}
                  title={semFoto ? 'Tirar do mural' : 'Apagar foto'}
                  className="foco-painel publicacoes-quadro-acao publicacoes-quadro-acao--excluir"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          )
        })
      })}
    </ul>
  )
}
