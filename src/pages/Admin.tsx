import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  Settings,
  LogOut,
  Menu as MenuIcon,
  Package,
  X,
} from 'lucide-react'
import { atualizarStatus, buscarCatalogo, excluirMoto } from '../lib/catalog'
import type { MotoParaSalvar } from '../lib/catalog'
import { usePageMeta } from '../hooks/useNavigation'
import { useAuth } from '../hooks/authContexto'
import { EstoqueTab } from '../components/admin/EstoqueTab'
import { ConfiguracoesTab } from '../components/admin/ConfiguracoesTab'
import { DialogoConfirmacao } from '../components/ui/DialogoConfirmacao'
import type { PedidoConfirmacao } from '../components/ui/DialogoConfirmacao'
import { Toast } from '../components/ui/Toast'
import type { Feedback } from '../components/ui/Toast'
import type { Motorcycle, MotorcycleStatus } from '../types'

type Aba = 'estoque' | 'configuracoes'

const ABAS: { id: Aba; rotulo: string; icone: typeof Package }[] = [
  { id: 'estoque', rotulo: 'Estoque', icone: Package },
  { id: 'configuracoes', rotulo: 'Configurações', icone: Settings },
]

/**
 * ============================================================
 * PAINEL DO PROPRIETÁRIO
 * ============================================================
 * Duas áreas: gestão de estoque e configurações da loja (contato,
 * endereço, horários). Sem dashboard, financeiro ou relatórios — o
 * que a operação usa de verdade cabe nestas duas telas.
 *
 * Navegação por menu lateral fixo no desktop; no celular vira drawer
 * sobreposto acionado pelo hamburger da topbar.
 */
export function Admin() {
  const { sessao, sair } = useAuth()
  const [aba, setAba] = useState<Aba>('estoque')
  const [menuAberto, setMenuAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [motos, setMotos] = useState<Motorcycle[] | null>(null)
  const [editando, setEditando] = useState<{ id?: string; dados?: MotoParaSalvar } | null>(null)
  const [confirmacao, setConfirmacao] = useState<PedidoConfirmacao | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  usePageMeta('Painel | DG Motos', 'Área restrita do proprietário.')

  const recarregar = useCallback(async () => {
    const r = await buscarCatalogo()
    setMotos(r.motos)
  }, [])

  useEffect(() => {
    let vivo = true
    void buscarCatalogo().then((r) => {
      if (vivo) setMotos(r.motos)
    })
    return () => {
      vivo = false
    }
  }, [])

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
      vendida: `${moto.marca} ${moto.modelo} foi marcada como vendida.`,
    }
    await concluirAcao(texto[status])
  }

  function trocarAba(proxima: Aba) {
    setAba(proxima)
    setMenuAberto(false)
  }

  const rotuloAba = ABAS.find((a) => a.id === aba)?.rotulo ?? 'Painel'

  return (
    <div className="flex min-h-dvh bg-night-950">
      {/* ---------------------------------------------------------- */}
      {/* Sidebar — fixa no desktop, drawer no celular                 */}
      {/* ---------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-night-900 transition-transform duration-300 lg:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu do painel"
      >
        {/* Faixa vermelha de topo, mesma assinatura do site */}
        <div aria-hidden="true" className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[#d91f32] via-[#d91f32] to-[#8a1220]" />

        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 lg:h-16">
          <Link
            to="/"
            aria-label="DG Motos — ver o site"
            className="foco-painel flex items-center gap-2.5 rounded"
          >
            <img src="/logo.webp" alt="" width={28} height={28} className="size-7 object-contain" />
            <span className="font-display text-base font-bold tracking-[0.18em] text-paper uppercase">
              DG Motos
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
            className="foco-painel toque-minimo grid size-9 place-items-center rounded-md text-steel-400 transition-colors hover:text-paper lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-2 pb-2 font-display text-[10px] font-semibold tracking-[0.22em] text-steel-600 uppercase">
            Gerenciar
          </p>
          {ABAS.map(({ id, rotulo, icone: Icone }) => {
            const ativa = aba === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => trocarAba(id)}
                aria-current={ativa ? 'page' : undefined}
                className={`foco-painel item-linha relative w-full rounded-md text-sm font-medium transition-colors ${
                  ativa
                    ? 'bg-brand-500/10 text-paper before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-500'
                    : 'text-steel-300 hover:bg-white/5 hover:text-paper'
                }`}
              >
                <Icone
                  className={`size-4 shrink-0 ${ativa ? 'text-brand-500' : 'text-steel-500'}`}
                  aria-hidden="true"
                />
                {rotulo}
                {id === 'estoque' && motos !== null ? (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[11px] leading-4 tabular-nums ${
                      ativa ? 'bg-brand-500/20 text-brand-500' : 'bg-white/5 text-steel-500'
                    }`}
                  >
                    {motos.length}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
          <p className="truncate px-2 pb-1 text-xs text-steel-500" title={sessao?.user.email}>
            {sessao?.user.email ?? 'Conta'}
          </p>
          <Link
            to="/"
            className="foco-painel item-linha w-full rounded-md text-sm text-steel-300 transition-colors hover:bg-white/5 hover:text-paper"
          >
            <ExternalLink className="size-4 shrink-0 text-steel-500" aria-hidden="true" />
            Ver o site
          </Link>
          <button
            type="button"
            onClick={() => void sair()}
            className="foco-painel item-linha w-full rounded-md text-sm text-steel-300 transition-colors hover:bg-white/5 hover:text-brand-500"
          >
            <LogOut className="size-4 shrink-0 text-steel-500" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      {/* Backdrop do drawer no celular */}
      {menuAberto && (
        <div
          aria-hidden="true"
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* ---------------------------------------------------------- */}
      {/* Conteúdo                                                     */}
      {/* ---------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-night-950/95 backdrop-blur-sm">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
              className="foco-painel toque-minimo grid size-10 place-items-center rounded-md text-steel-300 transition-colors hover:bg-white/5 hover:text-paper lg:hidden"
            >
              <MenuIcon className="size-5" aria-hidden="true" />
            </button>

            <h1 className="min-w-0 flex-1 truncate font-display text-sm font-semibold tracking-[0.16em] text-paper uppercase">
              {editando ? (editando.id ? 'Editar moto' : 'Nova moto') : rotuloAba}
            </h1>

            {/* Com o formulário aberto, o "voltar" sobe para a topbar:
                fecha a edição e volta à lista, fora do rolar do form. */}
            {aba === 'estoque' && editando && (
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="foco-painel inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-steel-300 transition-colors hover:border-white/30 hover:text-paper"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Voltar ao estoque
              </button>
            )}

            {aba === 'estoque' && !editando && (
              <Link
                to="/"
                className="foco-painel hidden items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-steel-300 transition-colors hover:border-white/30 hover:text-paper lg:inline-flex"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Ver no site
              </Link>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {aba === 'estoque' ? (
            <EstoqueTab
              motos={motos}
              busca={busca}
              onBusca={setBusca}
              editando={editando}
              onEditando={setEditando}
              onPedirExclusao={pedirExclusao}
              onAlterarStatus={alterarStatus}
              onSalva={aoSalvarMoto}
            />
          ) : (
            <ConfiguracoesTab />
          )}
        </main>
      </div>

      <DialogoConfirmacao
        pedido={confirmacao}
        onFechar={() => setConfirmacao(null)}
        ocupado={excluindo}
      />

      <Toast feedback={feedback} onFechar={() => setFeedback(null)} />
    </div>
  )
}
