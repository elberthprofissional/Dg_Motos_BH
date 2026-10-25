import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CircleDollarSign,
  Settings,
  User,
  LogOut,
  Package,
  Images,
} from 'lucide-react'
import { atualizarStatus, buscarCatalogo, excluirMoto, motoParaFormulario } from '../lib/catalog'
import type { MotoParaSalvar, ResultadoCatalogo } from '../lib/catalog'
import { usePageMeta } from '../hooks/usePageMeta'
import { useAuth } from '../hooks/authContexto'
import { EstoqueTab } from '../components/admin/EstoqueTab'
import { ConfiguracoesTab } from '../components/admin/ConfiguracoesTab'
import { VendidasTab } from '../components/admin/VendidasTab'
import { PublicacoesTab } from '../components/admin/PublicacoesTab'
import { DialogoConfirmacao } from '../components/ui/DialogoConfirmacao'
import type { PedidoConfirmacao } from '../components/ui/DialogoConfirmacao'
import { Toast } from '../components/ui/Toast'
import type { Feedback } from '../components/ui/Toast'
import type { Motorcycle, MotorcycleStatus } from '../types'

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
   vive no menu do avatar, no topo. */
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
 * loja (contato, endereço, horários). Sem dashboard, financeiro ou
 * relatórios — o que a operação usa de verdade cabe nestas telas.
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
  const contaRef = useRef<HTMLDivElement>(null)

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
    aplicarResultado(await buscarCatalogo())
  }, [aplicarResultado])

  useEffect(() => {
    let vivo = true
    void buscarCatalogo().then((r) => {
      if (vivo) aplicarResultado(r)
    })
    return () => {
      vivo = false
    }
  }, [aplicarResultado])

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

  function pedirExclusao(moto: Motorcycle) {
    setConfirmacao({
      titulo: 'Excluir moto',
      descricao: `"${moto.marca} ${moto.modelo} ${moto.ano}" sai do site e do painel. As fotos também são removidas e não é possível desfazer.`,
      rotuloConfirmar: 'Excluir',
      rotuloOcupado: 'Excluindo...',
      onConfirmar: async () => {
        setExcluindo(true)
        const r = await excluirMoto(moto.id)
        setExcluindo(false)
        setConfirmacao(null)
        if (!r.ok) {
          avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível excluir a moto.' })
          return
        }
        await concluirAcao(`${moto.marca} ${moto.modelo} foi excluída do estoque.`)
      },
    })
  }

  /** Atalho de status: vender, reativar ou marcar como indisponível. */
  async function alterarStatus(moto: Motorcycle, status: MotorcycleStatus) {
    const r = await atualizarStatus(moto.id, status)
    if (!r.ok) {
      avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível alterar o status.' })
      return
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

  const rotuloAba = ABAS.find((a) => a.id === aba)?.rotulo ?? 'Painel'
  const tituloTopbar = editando
    ? editando.id
      ? 'Editar moto'
      : 'Nova moto'
    : aba !== 'estoque'
      ? rotuloAba
      : ''
  const topbarSemContexto = aba === 'estoque' && !editando

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
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-semibold tracking-[0.12em] text-paper uppercase">
                DG Motos BH
              </span>
              <span className="mt-0.5 block text-xs leading-none text-steel-500">Painel da loja</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-medium text-steel-500">
            Gerenciar
          </p>
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
        {/* Topbar. Só carrega título quando há contexto a informar (edição
            de moto, seção de configurações). Na listagem do estoque o
            título é da própria página — repetir aqui era ruído. No celular
            a marca ocupa o canto, já que a sidebar está escondida. */}
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

            {tituloTopbar ? (
              <h1 className="min-w-0 flex-1 truncate text-center text-sm font-medium text-steel-500 lg:text-left">
                {tituloTopbar}
              </h1>
            ) : (
              <div className="flex-1" />
            )}

            {/* Com o formulário aberto, o "voltar" sobe pra topbar — mas
                só na mesa. No celular a única saída é a seta do próprio
                formulário no canto superior esquerdo: dois caminhos de
                volta brigando é o que dá cara de adaptação mal feita. */}
            {aba === 'estoque' && editando && (
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="foco-painel hidden items-center gap-1.5 rounded-lg border border-line-forte px-3 py-1.5 text-xs font-medium text-steel-300 transition-colors hover:border-claro/25 hover:text-paper lg:inline-flex"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Voltar ao estoque
              </button>
            )}

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
                  <p className="border-b border-line px-4 pb-2.5 pt-3">
                    <span className="block font-display text-sm font-semibold text-paper">DG Motos BH</span>
                    <span className="mt-0.5 block text-xs text-steel-500">Painel da loja</span>
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
                    Configurações
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

        <main className="mx-auto w-full max-w-[105rem] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          {aba === 'estoque' ? (
            <EstoqueTab
              motos={motos}
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
          ) : null}
          <div className={aba === 'vendidas' ? '' : 'hidden'}>
            <VendidasTab
              motos={motos ?? []}
              onEditar={editarVendida}
              onIrParaEstoque={() => trocarAba('estoque')}
            />
          </div>
          <div className={aba === 'publicacoes' ? '' : 'hidden'}>
            <PublicacoesTab onFeedback={avisar} />
          </div>
          {aba === 'configuracoes' ? <ConfiguracoesTab /> : null}
        </main>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Navegação inferior — só no celular                            */}
      {/* ---------------------------------------------------------- */}
      <nav
        aria-label="Navegação do painel"
        // Com o formulário aberto, a barra de salvar/artefato do
        // formulário ocupa o rodapé — a navegação sai de cena para
        // as duas faixas não brigarem pelo mesmo espaço.
        className={
          editando
            ? 'hidden'
            : 'safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-sidebar lg:hidden'
        }
      >
        <div className="grid grid-cols-3">
          {ABAS_CELLULAR.map(({ id, rotulo, icone: Icone }) => {
            const ativa = aba === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => trocarAba(id)}
                aria-current={ativa ? 'page' : undefined}
                className={`foco-painel relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1.5 py-2 transition-colors ${
                  ativa ? 'text-paper' : 'text-steel-500'
                }`}
              >
                {ativa && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-[2px] w-8 bg-brand-500"
                  />
                )}
                <span className="relative">
                  <Icone
                    className={`size-[22px] ${ativa ? 'text-steel-300' : ''}`}
                    strokeWidth={ativa ? 2.2 : 1.8}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-xs leading-none font-medium">{rotulo}</span>
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

      <Toast feedback={feedback} onFechar={() => setFeedback(null)} acimaDaBarra />
    </div>
  )
}
