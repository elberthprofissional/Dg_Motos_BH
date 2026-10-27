import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CircleDollarSign,
  Settings,
  User,
  LogOut,
  Package,
  Images,
} from 'lucide-react'
import {
  atualizarStatus,
  buscarCatalogo,
  excluirMotoDefinitivamente,
  excluirMotosDefinitivamente,
  moverParaLixeira,
  motoParaFormulario,
  restaurarMoto,
} from '../lib/catalog'
import type { MotoParaSalvar, ResultadoCatalogo } from '../lib/catalog'
import {
  DIAS_NA_LIXEIRA,
  motosAtivas,
  motosNaLixeira,
  motosVencidasNaLixeira,
} from '../lib/painel'
import { usePageMeta } from '../hooks/usePageMeta'
import { useAuth } from '../hooks/authContexto'
import { useVendas } from '../hooks/vendasContexto'
import { EstoqueTab } from '../components/admin/EstoqueTab'
import { PreviaMoto } from '../components/admin/PreviaMoto'
import { ConfiguracoesTab } from '../components/admin/ConfiguracoesTab'
import { VendidasTab } from '../components/admin/VendidasTab'
import { PublicacoesTab } from '../components/admin/PublicacoesTab'
import { DialogoRegistrarVenda } from '../components/admin/DialogoRegistrarVenda'
import { DialogoConfirmacao } from '../components/ui/DialogoConfirmacao'
import type { PedidoConfirmacao } from '../components/ui/DialogoConfirmacao'
import { Toast } from '../components/ui/Toast'
import type { Feedback } from '../components/ui/Toast'
import type { Motorcycle, MotorcycleStatus, Venda } from '../types'

type Aba = 'estoque' | 'vendidas' | 'publicacoes' | 'configuracoes'

/* "Vendidas" é o eco do estoque: toda moto vendida entra aqui, com a
   ficha editável. As fotos de entrega vivem em "Publicações". */
const ABAS: { id: Aba; rotulo: string; icone: typeof Package }[] = [
  { id: 'estoque', rotulo: 'Estoque', icone: Package },
  { id: 'vendidas', rotulo: 'Vendidas', icone: CircleDollarSign },
  { id: 'publicacoes', rotulo: 'Publicações', icone: Images },
  { id: 'configuracoes', rotulo: 'Configurações', icone: Settings },
]

/* Barra inferior do celular: as três áreas de trabalho. Configurações
   — e a Lixeira, dentro dela — vive no menu do avatar, no topo. */
const ABAS_CELLULAR: { id: Aba; rotulo: string; icone: typeof Package }[] = [
  { id: 'estoque', rotulo: 'Estoque', icone: Package },
  { id: 'vendidas', rotulo: 'Vendidas', icone: CircleDollarSign },
  { id: 'publicacoes', rotulo: 'Publicações', icone: Images },
]

/**
 * ============================================================
 * PAINEL DO PROPRIETÁRIO
 * ============================================================
 * Áreas: estoque, vendidas, publicações da galeria e configurações da
 * loja (contato, endereço, horários e lixeira). Sem dashboard, financeiro
 * ou relatórios — o que a operação usa de verdade cabe nestas telas.
 *
 * Navegação: sidebar lateral no desktop e, no celular, barra inferior
 * fixa no celular para manter as três áreas principais ao alcance.
 */
export function Admin() {
  const { sair } = useAuth()
  const [aba, setAba] = useState<Aba>('estoque')
  const [busca, setBusca] = useState('')
  const [motos, setMotos] = useState<Motorcycle[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<{ id?: string; dados?: MotoParaSalvar } | null>(null)
  const [confirmacao, setConfirmacao] = useState<PedidoConfirmacao | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [menuConta, setMenuConta] = useState(false)
  // Venda no diálogo: lançamento logo após sair do pátio, ou correção
  // vinda da aba Vendidas.
  const [vendaAberta, setVendaAberta] = useState<{
    moto: Motorcycle
    venda: Venda | null
  } | null>(null)
  const contaRef = useRef<HTMLDivElement>(null)
  const { vendas, desvincularVenda } = useVendas()

  // A prévia tem endereço próprio (/admin/estoque/:id): recarregar ou
  // voltar pelo navegador devolve o dono à mesma tela.
  const navigate = useNavigate()
  const params = useParams()
  const subrota = params['*'] ?? ''
  const previaId = /^estoque\/([^/]+)\/?$/.exec(subrota)?.[1] ?? null

  usePageMeta('Painel | DG Motos', 'Área restrita do proprietário.')

  // Menu do avatar (celular): fecha com Esc e clique fora — o painel
  // fica preso ao header; os itens podem trocar de aba sem recarregar.
  useEffect(() => {
    if (!menuConta) return
    function aoCliqueFora(evento: MouseEvent) {
      if (contaRef.current && !contaRef.current.contains(evento.target as Node)) {
        setMenuConta(false)
      }
    }
    function aoEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setMenuConta(false)
    }
    window.addEventListener('mousedown', aoCliqueFora)
    window.addEventListener('keydown', aoEsc)
    return () => {
      window.removeEventListener('mousedown', aoCliqueFora)
      window.removeEventListener('keydown', aoEsc)
    }
  }, [menuConta])

  const aplicarResultado = useCallback((r: ResultadoCatalogo) => {
    if (!r.doBanco) {
      setErro(r.erro ?? 'Não foi possível carregar o estoque.')
      setMotos(null)
      return
    }
    setErro(null)
    setMotos(r.motos)
  }, [])

  const recarregar = useCallback(async () => {
    aplicarResultado(await buscarCatalogo({ incluirLixeira: true }))
  }, [aplicarResultado])

  useEffect(() => {
    let vivo = true
    void buscarCatalogo({ incluirLixeira: true }).then((r) => {
      if (vivo) aplicarResultado(r)
    })
    return () => {
      vivo = false
    }
  }, [aplicarResultado])

  // A lixeira sai da vida do painel: contas, pátio e Vendidas usam só as
  // ativas. Assim nenhuma aba precisa repetir essa regra.
  const ativas = useMemo(() => (motos === null ? null : motosAtivas(motos)), [motos])
  const naLixeira = useMemo(() => (motos === null ? null : motosNaLixeira(motos)), [motos])

  const motoDaPrevia = useMemo(
    () =>
      previaId === null || ativas === null
        ? null
        : (ativas.find((moto) => moto.id === previaId) ?? null),
    [previaId, ativas],
  )

  // Rota desconhecida dentro do painel volta para a mesa de estoque.
  useEffect(() => {
    if (subrota && previaId === null) navigate('/admin', { replace: true })
  }, [subrota, previaId, navigate])

  // A prévia só existe enquanto a moto está no pátio. Se ela sair por
  // outro caminho (outra aba, lixeira), o dono volta para a lista em
  // vez de ficar numa tela vazia.
  const previaOrfa = previaId !== null && motos !== null && motoDaPrevia === null
  useEffect(() => {
    if (!previaOrfa) return
    avisar({ tipo: 'erro', texto: 'Essa moto não está mais no estoque.' })
    navigate('/admin', { replace: true })
  }, [previaOrfa, navigate])

  // Abrir a prévia começa do topo; voltar devolve a lista à posição em
  // que estava (o Estoque continua montado por baixo). O `instant`
  // ignora o scroll suave global — animar aqui faria a tela "escorrer"
  // sozinha logo depois do clique, e o carregamento das fotos ainda
  // cancelava o destino no meio do caminho.
  const rolagemAntesDaPrevia = useRef(0)
  const jaAbriuPrevia = useRef(false)
  useEffect(() => {
    if (previaId !== null) {
      rolagemAntesDaPrevia.current = window.scrollY
      jaAbriuPrevia.current = true
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (jaAbriuPrevia.current) {
      jaAbriuPrevia.current = false
      window.scrollTo({ top: rolagemAntesDaPrevia.current, behavior: 'instant' })
    }
  }, [previaId])

  // A lixeira tem prazo: passados 30 dias, a moto (e as fotos) saem de
  // vez. A limpeza roda ao abrir o painel — é o único momento em que a
  // sessão do dono tem permissão para apagar no banco e no Storage. A ref
  // garante uma passada por montagem, mesmo com o catálogo recarregando.
  const limpouLixeira = useRef(false)
  useEffect(() => {
    if (limpouLixeira.current || naLixeira === null) return
    limpouLixeira.current = true

    const vencidas = motosVencidasNaLixeira(naLixeira)
    if (vencidas.length === 0) return

    void (async () => {
      const r = await excluirMotosDefinitivamente(vencidas.map((moto) => moto.id))
      if (!r.ok) return
      await recarregar()
      avisar({
        tipo: 'ok',
        texto:
          vencidas.length === 1
            ? `Uma moto ficou ${DIAS_NA_LIXEIRA} dias na lixeira e foi apagada de vez.`
            : `${vencidas.length} motos ficaram ${DIAS_NA_LIXEIRA} dias na lixeira e foram apagadas de vez.`,
      })
    })()
  }, [naLixeira, recarregar])

  function avisar(novo: Feedback) {
    setFeedback(novo)
  }

  async function concluirAcao(texto: string) {
    await recarregar()
    avisar({ tipo: 'ok', texto })
  }

  /** O formulário salvou (novo cadastro ou edição): recarrega o estoque. */
  async function aoSalvarMoto() {
    const eraNova = !editando?.id
    setEditando(null)
    await recarregar()
    avisar({ tipo: 'ok', texto: eraNova ? 'Moto adicionada ao estoque.' : 'Alterações salvas.' })
  }

  /** Excluir no Estoque agora é reversível: a moto vai para a Lixeira. */
  function pedirExclusao(moto: Motorcycle) {
    setConfirmacao({
      titulo: 'Excluir moto',
      descricao: `Tem certeza que deseja excluir a moto "${moto.marca} ${moto.modelo} ${moto.ano}"? Ela será encaminhada para a Lixeira, em Configurações, e pode ser restaurada depois.`,
      rotuloConfirmar: 'Sim',
      rotuloCancelar: 'Não',
      rotuloOcupado: 'Movendo...',
      onConfirmar: async () => {
        setExcluindo(true)
        const r = await moverParaLixeira(moto.id)
        setExcluindo(false)
        setConfirmacao(null)
        if (!r.ok) {
          avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível mover a moto para a lixeira.' })
          return
        }
        if (previaId) navigate('/admin')
        await concluirAcao(`${moto.marca} ${moto.modelo} foi para a Lixeira em Configurações.`)
      },
    })
  }

  async function restaurarDaLixeira(moto: Motorcycle) {
    const r = await restaurarMoto(moto.id)
    if (!r.ok) {
      avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível restaurar a moto.' })
      return
    }
    const destino = moto.status === 'vendida' ? 'Vendidas' : 'o estoque'
    await concluirAcao(`${moto.marca} ${moto.modelo} voltou para ${destino}.`)
  }

  function pedirExclusaoDefinitiva(moto: Motorcycle) {
    setConfirmacao({
      titulo: 'Apagar de vez',
      descricao: `"${moto.marca} ${moto.modelo} ${moto.ano}" e as fotos serão removidas do banco e do armazenamento. Não dá para restaurar depois.`,
      rotuloConfirmar: 'Apagar de vez',
      rotuloOcupado: 'Apagando...',
      onConfirmar: async () => {
        setExcluindo(true)
        const r = await excluirMotoDefinitivamente(moto.id)
        setExcluindo(false)
        setConfirmacao(null)
        if (!r.ok) {
          avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível apagar a moto.' })
          return
        }
        await concluirAcao(`${moto.marca} ${moto.modelo} foi apagada de vez.`)
      },
    })
  }

  function pedirEsvaziarLixeira() {
    const alvo = naLixeira ?? []
    if (alvo.length === 0) return
    setConfirmacao({
      titulo: 'Esvaziar a lixeira',
      descricao: `${alvo.length === 1 ? 'A moto na lixeira será apagada' : `As ${alvo.length} motos na lixeira serão apagadas`} de vez, junto com as fotos. Não dá para restaurar depois.`,
      rotuloConfirmar: 'Esvaziar lixeira',
      rotuloOcupado: 'Apagando...',
      onConfirmar: async () => {
        setExcluindo(true)
        const r = await excluirMotosDefinitivamente(alvo.map((moto) => moto.id))
        setExcluindo(false)
        setConfirmacao(null)
        if (!r.ok) {
          avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível esvaziar a lixeira.' })
          return
        }
        await concluirAcao('A lixeira foi esvaziada.')
      },
    })
  }

  /** Venda lançada para uma moto (null = nunca registrada). */
  const vendaDaMoto = useCallback(
    (motoId: string) => vendas.find((venda) => venda.motoId === motoId) ?? null,
    [vendas],
  )

  /** Clique em "Comprou…" na aba Vendidas. */
  function abrirVenda(moto: Motorcycle) {
    setVendaAberta({ moto, venda: vendaDaMoto(moto.id) })
  }

  /** Atalho de status: vender, reativar ou marcar como indisponível. */
  async function alterarStatus(moto: Motorcycle, status: MotorcycleStatus) {
    // Vender: o dono confirma antes — a moto sai do site na hora, e
    // o clique errado acontecia sem freio. Errar ainda vira nada:
    // em Vendidas a moto volta com "Devolver ao estoque".
    if (status === 'vendida') {
      setConfirmacao({
        titulo: 'Marcar como vendida',
        descricao: `"${moto.marca} ${moto.modelo} ${moto.ano}" sai do estoque e vai para a aba Vendidas. Se foi clique errado, dá para reverter lá mesmo, com "Devolver ao estoque".`,
        rotuloConfirmar: 'Marcar como vendida',
        rotuloOcupado: 'Marcando...',
        tom: 'neutro',
        onConfirmar: async () => {
          const r = await atualizarStatus(moto.id, 'vendida')
          setConfirmacao(null)
          if (!r.ok) {
            avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível alterar o status.' })
            return
          }
          if (previaId) navigate('/admin')
          await concluirAcao(`${moto.marca} ${moto.modelo} saiu do pátio e já está em Vendidas.`)
          setVendaAberta({ moto, venda: vendaDaMoto(moto.id) })
        },
      })
      return
    }

    const eraVendida = moto.status === 'vendida'
    const r = await atualizarStatus(moto.id, status)
    if (!r.ok) {
      avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível alterar o status.' })
      return
    }

    // Vender sai antes, pelo diálogo de confirmação. Aqui só chegam
    // reativação e indisponibilidade.

    // Voltou pro pátio: a venda continua no histórico com a foto dos
    // dados do dia, só sem apontar para a moto à venda de novo.
    if (eraVendida) {
      const motivoDesvinculo = await desvincularVenda(moto.id)
      if (motivoDesvinculo) {
        await recarregar()
        avisar({
          tipo: 'erro',
          texto: `A moto voltou ao pátio, mas a venda não foi desvinculada: ${motivoDesvinculo}`,
        })
        return
      }
    }

    const texto: Record<MotorcycleStatus, string> = {
      disponivel: `${moto.marca} ${moto.modelo} está disponível de novo.`,
      indisponivel: `${moto.marca} ${moto.modelo} foi marcada como indisponível.`,
      vendida: `${moto.marca} ${moto.modelo} saiu do pátio e já está em Vendidas.`,
    }
    await concluirAcao(texto[status])
  }

  function trocarAba(proxima: Aba) {
    setAba(proxima)
    if (previaId) navigate('/admin')
  }

  /** Volta da prévia para a lista, preservando busca e ordem. */
  function voltarAoEstoque() {
    setAba('estoque')
    navigate('/admin')
  }

  /** Editar na prévia é editar a moto: abre a ficha no Estoque. */
  function editarDaPrevia(moto: Motorcycle) {
    setEditando({ id: moto.id, dados: motoParaFormulario(moto) })
    voltarAoEstoque()
  }

  /** Editar uma vendida é editar a moto: abre a ficha no Estoque. */
  function editarVendida(moto: Motorcycle) {
    setEditando({ id: moto.id, dados: motoParaFormulario(moto) })
    setAba('estoque')
  }

  /** Sair pede confirmação: o botão fica junto de "Ver o site" e um
      toque errado derrubaria a sessão no meio de uma edição. */
  function pedirSaida() {
    setConfirmacao({
      titulo: 'Sair do painel',
      descricao: 'Tem certeza que deseja sair?',
      rotuloConfirmar: 'Sair',
      tom: 'neutro',
      onConfirmar: async () => {
        setConfirmacao(null)
        await sair()
      },
    })
  }

  // A topbar não carrega título: o nome da seção já está no próprio
  // conteúdo (Estoque, Vendidas, Configurações). No desktop ela só existe
  // para abrigar a seta de volta enquanto o formulário de moto está
  // aberto na aba Estoque; no celular carrega a marca e o avatar.
  const editandoMoto = aba === 'estoque' && editando !== null
  const topbarSemContexto = !editandoMoto

  return (
    <div className="flex min-h-dvh bg-fundo" data-tema="painel">
      {/* ---------------------------------------------------------- */}
      {/* Sidebar — só no desktop. No celular a navegação é a barra     */}
      {/* inferior fixa (mais abaixo).                                  */}
      {/* ---------------------------------------------------------- */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-sidebar lg:flex"
        aria-label="Menu do painel"
      >
        {/* Marca: logo + wordmark, sem ornamento — o vermelho do painel
            fica para os itens ativos e para o que é ação. */}
        <div className="flex h-[4.75rem] shrink-0 items-center gap-3 border-b border-line px-5">
          <Link
            to="/"
            aria-label="DG Motos — ver o site"
            className="foco-painel group flex min-w-0 items-center gap-3 rounded-lg"
          >
            <span className="relative grid size-10 shrink-0 place-items-center">
              <img src="/logo.webp" alt="" width={40} height={40} className="size-10 object-contain" />
            </span>
            <span className="min-w-0 truncate font-display text-sm font-semibold tracking-[0.12em] text-paper uppercase">
              DG Motos BH
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {ABAS.map(({ id, rotulo, icone: Icone }) => {
              const ativa = aba === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => trocarAba(id)}
                  aria-current={ativa ? 'page' : undefined}
                  className={`foco-painel nav-item ${
                    ativa
                      ? 'nav-item-ativo text-paper'
                      : 'text-steel-400 hover:bg-claro/[0.03] hover:text-paper'
                  }`}
                >
                  <Icone
                    className={`size-[17px] shrink-0 ${ativa ? 'text-steel-300' : 'text-steel-500'}`}
                    strokeWidth={ativa ? 2.2 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate">{rotulo}</span>
                  {id === 'configuracoes' && (naLixeira?.length ?? 0) > 0 ? (
                    <span
                      title={`${naLixeira?.length} na lixeira`}
                      className="min-w-5 rounded-full bg-claro/10 px-1.5 py-0.5 text-center text-[11px] leading-none text-steel-300"
                    >
                      {naLixeira?.length}
                      <span className="sr-only"> na lixeira</span>
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <button
            type="button"
            onClick={pedirSaida}
            className="foco-painel nav-item text-steel-400 hover:bg-claro/[0.03] hover:text-paper"
          >
            <LogOut className="size-[17px] shrink-0 text-steel-500" strokeWidth={1.8} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------------- */}
      {/* Conteúdo                                                     */}
      {/* ---------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] lg:pb-0 lg:pl-60">
        {/* Topbar sem título: no desktop ela só aparece com o formulário
            de moto aberto, para abrigar a seta de volta. No celular fica
            sempre, porque ali a marca e o avatar moram nela (a sidebar
            está escondida). */}
        <header
          className={`sticky top-0 z-30 border-b border-line bg-night-950 ${
            topbarSemContexto ? 'lg:hidden' : ''
          }`}
        >
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
            <Link
              to="/"
              aria-label="DG Motos — ver o site"
              className="foco-painel flex items-center gap-2.5 rounded-lg lg:hidden"
            >
              <img src="/logo.webp" alt="" width={24} height={24} className="size-6 object-contain" />
              <span className="font-display text-sm font-semibold tracking-[0.12em] text-paper uppercase">
                DG Motos BH
              </span>
            </Link>

            {/* Com o formulário aberto, a volta mora aqui — só na mesa e
                como seta seca, sem moldura: é a primeira coisa à esquerda
                do título, onde o olho procura. No celular a topbar não
                ganha seta; a saída continua sendo a do próprio formulário. */}
            {editandoMoto && (
              <button
                type="button"
                onClick={() => setEditando(null)}
                aria-label="Voltar ao estoque"
                title="Voltar ao estoque"
                className="foco-painel hidden size-10 shrink-0 cursor-pointer place-items-center text-steel-400 transition-colors hover:text-paper lg:grid"
              >
                <ArrowLeft className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}

            <div className="flex-1" />

            {/* Avatar da conta (só no celular): o caminho para Configurações
                e Sair, que saíram da barra inferior. Desktop é sidebar. */}
            <div className="ml-auto relative lg:hidden" ref={contaRef}>
              <button
                type="button"
                onClick={() => setMenuConta((v) => !v)}
                aria-expanded={menuConta}
                aria-haspopup="menu"
                aria-label="Menu da conta"
                className={`foco-painel grid size-10 place-items-center rounded-full border transition-colors ${
                  menuConta
                    ? 'border-brand-500/60 bg-brand-500/10 text-paper'
                    : 'border-line-forte bg-painel-2 text-steel-400 hover:border-claro/25 hover:text-paper'
                }`}
              >
                <User className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </button>

              {menuConta ? (
                <div
                  role="menu"
                  aria-label="Conta"
                  className="absolute right-0 top-[3.25rem] z-50 w-52 overflow-hidden rounded-lg border border-line bg-sidebar shadow-xl shadow-black/40"
                >
                  <p className="border-b border-line px-4 py-3 font-display text-sm font-semibold text-paper">
                    DG Motos BH
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuConta(false)
                      trocarAba('configuracoes')
                    }}
                    className={`foco-painel flex min-h-11 w-full items-center gap-3 px-4 text-sm transition-colors ${
                      aba === 'configuracoes'
                        ? 'text-paper'
                        : 'text-steel-300 hover:bg-claro/[0.04] hover:text-paper'
                    }`}
                  >
                    <Settings className="size-4 shrink-0 text-steel-500" aria-hidden="true" />
                    <span className="flex-1 text-left">Configurações</span>
                    {(naLixeira?.length ?? 0) > 0 ? (
                      <span className="min-w-5 rounded-full bg-claro/10 px-1.5 py-0.5 text-center text-[11px] leading-none text-steel-300">
                        {naLixeira?.length}
                        <span className="sr-only"> na lixeira</span>
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuConta(false)
                      pedirSaida()
                    }}
                    className="foco-painel flex min-h-11 w-full items-center gap-3 border-t border-line px-4 text-sm text-steel-300 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut className="size-4 shrink-0 text-steel-500" aria-hidden="true" />
                    Sair
                  </button>
                </div>
              ) : null}
            </div>

          </div>
        </header>

        {/* O respiro embaixo é estrutura, não remendo: a barra de abas é
            fixa no celular, então o conteúdo paga a altura dela (64px
            + área segura) para nada terminar escondido sob a barra.
            Com o formulário aberto a barra sai de cena e o respiro
            também — quem reserve espaço é a barra dele. */}
        <main
          className={`mx-auto w-full max-w-[105rem] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-9 ${
            editandoMoto
              ? ''
              : 'pb-[calc(5.75rem_+_env(safe-area-inset-bottom,0px))] lg:pb-9'
          }`}
        >
          {/* O Estoque continua montado (escondido) durante a prévia:
              busca, ordem e filtros estão intactos quando o dono volta. */}
          <div className={aba === 'estoque' && previaId === null ? '' : 'hidden'}>
            <EstoqueTab
              motos={ativas}
              erro={erro}
              busca={busca}
              onBusca={setBusca}
              editando={editando}
              onEditando={setEditando}
              onPedirExclusao={pedirExclusao}
              onAlterarStatus={alterarStatus}
              onSalva={aoSalvarMoto}
              onRecarregar={recarregar}
              onIrParaVendidas={() => trocarAba('vendidas')}
            />
          </div>
          <div className={aba === 'vendidas' ? '' : 'hidden'}>
            <VendidasTab
              motos={ativas ?? []}
              vendas={vendas}
              onEditar={editarVendida}
              onRegistrarVenda={abrirVenda}
              onIrParaEstoque={() => trocarAba('estoque')}
              onReativar={(moto) => void alterarStatus(moto, 'disponivel')}
            />
          </div>
          <div className={aba === 'publicacoes' ? '' : 'hidden'}>
            <PublicacoesTab onFeedback={avisar} />
          </div>
          {aba === 'configuracoes' ? (
            <ConfiguracoesTab
              lixeira={naLixeira}
              erroLixeira={erro}
              onRestaurarDaLixeira={restaurarDaLixeira}
              onApagarDeVez={pedirExclusaoDefinitiva}
              onEsvaziarLixeira={pedirEsvaziarLixeira}
              onIrParaEstoque={() => trocarAba('estoque')}
              onRecarregar={recarregar}
            />
          ) : null}

          {previaId !== null ? (
            motoDaPrevia ? (
              <PreviaMoto
                moto={motoDaPrevia}
                onVoltar={voltarAoEstoque}
                onEditar={() => editarDaPrevia(motoDaPrevia)}
                onVender={() => void alterarStatus(motoDaPrevia, 'vendida')}
                onExcluir={() => pedirExclusao(motoDaPrevia)}
              />
            ) : motos === null && !erro ? (
              <div role="status" className="flex min-h-[45vh] items-center justify-center">
                <span className="sr-only">Abrindo a prévia</span>
                <span
                  aria-hidden="true"
                  className="size-8 animate-spin rounded-full border-2 border-claro/15 border-t-brand-500"
                />
              </div>
            ) : (
              <div className="mx-auto max-w-md py-20">
                <h2 className="font-display text-xl font-semibold text-paper">
                  Não deu para abrir a prévia agora
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-steel-400">
                  {erro ?? 'Essa moto não está mais no estoque.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void recarregar()}
                    className="estoque-btn-primario"
                  >
                    Tentar novamente
                  </button>
                  <button
                    type="button"
                    onClick={voltarAoEstoque}
                    className="foco-painel inline-flex h-10 items-center border border-line px-4 text-sm font-medium text-steel-300 transition-colors hover:border-claro/25 hover:text-paper"
                  >
                    Voltar ao estoque
                  </button>
                </div>
              </div>
            )
          ) : null}
        </main>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Navegação inferior — só no celular                            */}
      {/* ---------------------------------------------------------- */}
      <nav
        aria-label="Navegação do painel"
        // Com o formulário aberto, a barra de salvar/artefato do
        // formulário ocupa o rodapé — a navegação sai de cena para
        // as duas faixas não brigarem pelo mesmo espaço. As ações de
        // publicação são diálogos, que já cobrem a barra com o backdrop.
        className={
          editandoMoto
            ? 'hidden'
            : 'safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-sidebar lg:hidden'
        }
      >
        <div className="grid grid-cols-3">
          {ABAS_CELLULAR.map(({ id, rotulo, icone: Icone }) => {
            const ativa = aba === id
            // Um item da barra: 64px de área de toque, rótulo no mínimo
            // legível da casa (13px) e indicador superior no ativo. A
            // área segura do aparelho fica na própria .safe-bottom da
            // nav — o botão paga só o seu respiro.
            return (
              <button
                key={id}
                type="button"
                onClick={() => trocarAba(id)}
                aria-current={ativa ? 'page' : undefined}
                className={`foco-painel relative flex min-h-[4rem] flex-1 flex-col items-center justify-center gap-1 pb-3 pt-2 transition-colors ${
                  ativa ? 'text-paper' : 'text-steel-500'
                }`}
              >
                {ativa && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-[2px] w-9 bg-brand-500"
                  />
                )}
                <span className="relative">
                  <Icone
                    className={`size-[22px] ${ativa ? 'text-steel-300' : ''}`}
                    strokeWidth={ativa ? 2.2 : 1.8}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-[13px] leading-none font-medium">{rotulo}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <DialogoConfirmacao
        pedido={confirmacao}
        onFechar={() => setConfirmacao(null)}
        ocupado={excluindo}
      />

      <DialogoRegistrarVenda
        moto={vendaAberta?.moto ?? null}
        venda={vendaAberta?.venda ?? null}
        onFechar={() => setVendaAberta(null)}
        onSalvo={(texto) => {
          setVendaAberta(null)
          avisar({ tipo: 'ok', texto })
        }}
      />

      <Toast feedback={feedback} onFechar={() => setFeedback(null)} acimaDaBarra />
    </div>
  )
}
