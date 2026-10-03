import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { buscarCatalogo, excluirMoto, marcarComoVendida } from '../lib/catalog'
import type { MotoParaSalvar } from '../lib/catalog'
import { buscarLeads } from '../lib/leads'
import type { Lead } from '../lib/leads'
import { contarLeadsRecentes } from '../lib/painel'
import { usePageMeta } from '../hooks/useNavigation'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { AdminBottomNav, AdminMenuPlanilha } from '../components/admin/AdminBottomNav'
import { DashboardTab } from '../components/admin/DashboardTab'
import { EstoqueTab } from '../components/admin/EstoqueTab'
import { LeadsTab } from '../components/admin/LeadsTab'
import { FinanceiroTab } from '../components/admin/FinanceiroTab'
import { RelatoriosTab } from '../components/admin/RelatoriosTab'
import { ConfiguracoesTab } from '../components/admin/ConfiguracoesTab'
import { DialogoConfirmacao } from '../components/ui/DialogoConfirmacao'
import type { PedidoConfirmacao } from '../components/ui/DialogoConfirmacao'
import { Toast } from '../components/ui/Toast'
import type { Feedback } from '../components/ui/Toast'
import { PublicacaoStatus } from '../components/admin/PublicacaoStatus'
import { tituloDaAba } from '../components/admin/tiposAdmin'
import type { AbaAdmin } from '../components/admin/tiposAdmin'
import type { Motorcycle } from '../types'

/**
 * Casca do painel: carrega os dados uma vez, controla a aba ativa e
 * distribui o feedback das operações.
 *
 * Cada aba é um componente próprio (DashboardTab, EstoqueTab, LeadsTab,
 * ConfiguracoesTab). Antes elas viviam todas neste arquivo, que passou de
 * mil linhas — separar em arquivos para que mexer no Leads não arriscasse
 * o Estoque.
 *
 * A busca do estoque mora aqui porque o campo fica no cabeçalho da aba de
 * estoque e na busca é recarregar a lista inteira; assim o texto sobrevive
 * à troca de aba.
 *
 * ============================================================
 * NAVEGAÇÃO
 * ============================================================
 * Duas leituras para a mesma lista de seis seções:
 *
 *   lg+  → `AdminSidebar` fixa, com as seis. A largura que sobra num
 *          monitor largo torna aceitável ler rótulos por extenso.
 *   <lg  → `AdminBottomNav` fixa, com quatro destinos, e a planilha do
 *          "Menu" para as três seções de consulta.
 *
 * Só uma das duas existe por breakpoint. Não há menu hamburger: com a
 * barra inferior no lugar, ele repetiria a navegação e comeria largura
 * de tela justamente onde ela é escassa.
 */
export function Admin() {
  const [aba, setAba] = useState<AbaAdmin>('painel')
  const [menuAberto, setMenuAberto] = useState(false) // planilha do "Menu" (celular)
  const [busca, setBusca] = useState('')
  const [motos, setMotos] = useState<Motorcycle[] | null>(null)
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [editando, setEditando] = useState<{ id?: string; dados?: MotoParaSalvar } | null>(null)
  const [confirmacao, setConfirmacao] = useState<PedidoConfirmacao | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  usePageMeta('Painel | DG Motos', 'Área restrita do proprietário.')

  const carregar = useCallback(async () => {
    const [catalogo, lista] = await Promise.all([buscarCatalogo(), buscarLeads()])
    return { motos: catalogo.motos, leads: lista }
  }, [])

  const recarregar = useCallback(async () => {
    const dados = await carregar()
    setMotos(dados.motos)
    setLeads(dados.leads)
  }, [carregar])

  useEffect(() => {
    let vivo = true
    void carregar().then((dados) => {
      if (!vivo) return
      setMotos(dados.motos)
      setLeads(dados.leads)
    })
    return () => {
      vivo = false
    }
  }, [carregar])

  const leadsRecentes = useMemo(() => contarLeadsRecentes(leads ?? [], 30), [leads])
  const carregando = motos === null || leads === null

  function irPara(proxima: AbaAdmin) {
    setAba(proxima)
    setMenuAberto(false)
  }

  function abrirNovaMoto() {
    setEditando({})
    irPara('estoque')
  }

  function avisar(novo: Feedback) {
    setFeedback(novo)
  }

  /** Salvar/excluir mexem no banco: a lista precisa voltar do servidor. */
  async function concluirAcao(texto: string) {
    await recarregar()
    avisar({ tipo: 'ok', texto })
  }

  function pedirExclusao(moto: Motorcycle) {
    setConfirmacao({
      titulo: 'Excluir moto',
      descricao: `"${moto.marca} ${moto.modelo} ${moto.ano}" sai do site e do painel. As fotos no Storage continuam lá e o preço não pode ser recuperado por este caminho.`,
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

  /**
   * CRM → Estoque: cliente fechou negócio. Um clique marca a moto como
   * vendida (com data, que alimenta o financeiro e os relatórios).
   */
  function pedirVenda(moto: Motorcycle, leadNome: string) {
    setConfirmacao({
      titulo: 'Fechar negócio',
      descricao: `${leadNome} fechou com a ${moto.marca} ${moto.modelo} ${moto.ano}. Marcar como vendida no estoque? Ela sai da vitrine e entra no financeiro com a data de hoje.`,
      rotuloConfirmar: 'Marcar como vendida',
      onConfirmar: async () => {
        const r = await marcarComoVendida(moto.id)
        setConfirmacao(null)
        if (!r.ok) {
          avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível marcar a venda.' })
          return
        }
        await concluirAcao(
          `${moto.marca} ${moto.modelo} marcada como vendida. O financeiro já registra a venda.`,
        )
      },
    })
  }

  return (
    <div className="flex min-h-dvh bg-night-950">
      {/* Sidebar fixa (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-white/10 bg-night-900 p-4 lg:block">
        <AdminSidebar aba={aba} onNavegar={irPara} leadsRecentes={leadsRecentes} />
      </aside>

      <AdminMenuPlanilha
        aberto={menuAberto}
        aba={aba}
        onFechar={() => setMenuAberto(false)}
        onNavegar={irPara}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar: identificação da seção + avisos.
            Sem backdrop: o painel é denso e o desfoque só competia com o
            texto. No celular é uma barra de 48px — o logotipo ocupa 24px
            e o título fica em `truncate` para nunca quebrar layout com
            nomes longos. */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-night-950">
          <div className="flex h-12 items-center gap-2.5 px-4 sm:h-14 sm:gap-3 sm:px-6">
            <Link
              to="/"
              aria-label="DG Motos — ver o site"
              className="foco-painel shrink-0 rounded sm:hidden"
            >
              <img src="/logo.webp" alt="" width={24} height={24} className="size-6 object-contain" />
            </Link>

            <h1 className="min-w-0 flex-1 truncate font-display text-xs font-semibold tracking-[0.16em] text-steel-300 uppercase sm:text-sm">
              {tituloDaAba(aba)}
            </h1>

            {/* No celular a pílula de publicação vira só o ícone: o texto
                "Publica em 42s" roubaria a largura do título. O `title`
                preserva a informação no hover, e o leitor de tela continua
                recebendo o texto via aria-label. */}
            <span className="hidden sm:contents">
              <PublicacaoStatus />
            </span>
            <PublicacaoStatus compacto />

            <button
              type="button"
              onClick={() => irPara('clientes')}
              aria-label={`Clientes: ${leadsRecentes} nos últimos 30 dias`}
              className="foco-painel toque-minimo relative -mr-1.5 rounded-md p-2 text-steel-300 transition-colors hover:bg-white/5 hover:text-paper"
            >
              <Bell className="size-5" aria-hidden="true" />
              {leadsRecentes > 0 && (
                <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-brand-500 text-[9px] font-bold text-white tabular-nums">
                  {leadsRecentes > 9 ? '9+' : leadsRecentes}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* `max-w-7xl` em vez de `max-w-6xl`: o painel é uma ferramenta
            de trabalho, não uma vitrine — em monitor largo, limitar a
            1152px deixava a tabela do Financeiro e os cards de Configurações
            perdidos no meio da tela. */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-[calc(var(--spacing-nav-painel)+1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-6 lg:px-8 lg:pb-10">
          {aba === 'painel' && (
            <DashboardTab
              motos={motos}
              leads={leads}
              carregando={carregando}
              onNavegar={irPara}
              onNovaMoto={abrirNovaMoto}
            />
          )}

          {aba === 'estoque' && (
            <EstoqueTab
              motos={motos}
              busca={busca}
              onBusca={setBusca}
              editando={editando}
              onEditando={(v) => {
                setEditando(v)
                avisar({
                  tipo: 'ok',
                  texto: v === null ? 'Estoque atualizado.' : '',
                })
              }}
              onPedirExclusao={pedirExclusao}
            />
          )}

          {aba === 'clientes' && (
            <LeadsTab
              leads={leads}
              motos={motos ?? []}
              onMotoVendida={pedirVenda}
            />
          )}

          {aba === 'financeiro' && (
            <FinanceiroTab motos={motos} carregando={carregando} />
          )}

          {aba === 'relatorios' && (
            <RelatoriosTab leads={leads} motos={motos} carregando={carregando} />
          )}

          {aba === 'config' && <ConfiguracoesTab onFeedback={avisar} />}
        </main>

        <AdminBottomNav
          aba={aba}
          menuAberto={menuAberto}
          onNavegar={irPara}
          onAbrirMenu={() => setMenuAberto(true)}
        />
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