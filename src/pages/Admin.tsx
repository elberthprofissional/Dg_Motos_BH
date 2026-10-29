import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motoParaFormulario } from '../lib/catalog'
import { usePageMeta } from '../hooks/usePageMeta'
import { useCatalogoAdmin } from '../hooks/useCatalogoAdmin'
import { useLimpezaLixeira } from '../hooks/useLimpezaLixeira'
import { usePreviaRota } from '../hooks/usePreviaRota'
import { useAcoesPainel } from '../hooks/useAcoesPainel'
import { EstoqueTab } from '../components/admin/EstoqueTab'
import { PreviaMoto } from '../components/admin/PreviaMoto'
import { ConfiguracoesTab } from '../components/admin/ConfiguracoesTab'
import { VendidasTab } from '../components/admin/VendidasTab'
import { PublicacoesTab } from '../components/admin/PublicacoesTab'
import { SidebarPainel } from '../components/admin/SidebarPainel'
import { MenuConta } from '../components/admin/MenuConta'
import { NavegacaoPainel } from '../components/admin/NavegacaoPainel'
import type { Aba } from '../components/admin/NavegacaoPainel'
import { DialogoRegistrarVenda } from '../components/admin/DialogoRegistrarVenda'
import { DialogoConfirmacao } from '../components/ui/DialogoConfirmacao'
import { Toast } from '../components/ui/Toast'
import type { Feedback } from '../components/ui/Toast'
import type { MotoParaSalvar } from '../lib/catalog'
import type { Motorcycle } from '../types'

/**
 * ============================================================
 * PAINEL DO PROPRIETÁRIO
 * ============================================================
 * Áreas: estoque, vendidas, publicações da galeria e configurações da
 * loja (contato, endereço, horários e lixeira). Sem dashboard, financeiro
 * ou relatórios — o que a operação usa de verdade cabe nestas telas.
 *
 * Navegação: sidebar lateral no desktop e, no celular, barra inferior
 * fixa para manter as três áreas principais ao alcance.
 *
 * O comportamento (lixeira, status, vendas, confirmações) mora em
 * `useAcoesPainel`; este arquivo é a montagem: estado de navegação,
 * respiro do formulário e as telas em si.
 */
export function Admin() {
  const [aba, setAba] = useState<Aba>('estoque')
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<{ id?: string; dados?: MotoParaSalvar } | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const {
    erro,
    fotosLixeira,
    erroFotosLixeira,
    ativas,
    naLixeira,
    totalNaLixeira,
    revisao: revisaoPublicacoes,
    recarregar,
    recarregarFotosLixeira,
    recarregarLixeira,
  } = useCatalogoAdmin()

  const avisar = useCallback((novo: Feedback) => setFeedback(novo), [])

  const navigate = useNavigate()

  usePageMeta('Painel | DG Motos', 'Área restrita do proprietário.')

  const { previaId, motoDaPrevia } = usePreviaRota({ ativas, onFeedback: avisar })

  useLimpezaLixeira({
    naLixeira,
    fotosLixeira,
    recarregar,
    recarregarFotosLixeira,
    onFeedback: avisar,
  })

  const acoes = useAcoesPainel({
    naLixeira,
    fotosLixeira,
    previaId,
    recarregar,
    recarregarFotosLixeira,
    avisar,
  })

  /** O formulário salvou (novo cadastro ou edição): recarrega o estoque. */
  async function aoSalvarMoto() {
    const eraNova = !editando?.id
    setEditando(null)
    await recarregar()
    avisar({ tipo: 'ok', texto: eraNova ? 'Moto adicionada ao estoque.' : 'Alterações salvas.' })
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
      <SidebarPainel
        aba={aba}
        totalNaLixeira={totalNaLixeira}
        onTrocarAba={trocarAba}
        onPedirSaida={acoes.pedirSaida}
      />

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

            <MenuConta
              aba={aba}
              totalNaLixeira={totalNaLixeira}
              onIrParaConfiguracoes={() => trocarAba('configuracoes')}
              onPedirSaida={acoes.pedirSaida}
            />
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
              onPedirExclusao={acoes.pedirExclusao}
              onAlterarStatus={acoes.alterarStatus}
              onSalva={aoSalvarMoto}
              onRecarregar={recarregar}
              onIrParaVendidas={() => trocarAba('vendidas')}
            />
          </div>
          <div className={aba === 'vendidas' ? '' : 'hidden'}>
            <VendidasTab
              motos={ativas ?? []}
              vendas={acoes.vendas}
              onEditar={editarVendida}
              onRegistrarVenda={acoes.abrirVenda}
              onIrParaEstoque={() => trocarAba('estoque')}
              onReativar={(moto) => void acoes.alterarStatus(moto, 'disponivel')}
            />
          </div>
          <div className={aba === 'publicacoes' ? '' : 'hidden'}>
            <PublicacoesTab
              onFeedback={avisar}
              onFotoNaLixeira={() => void recarregarFotosLixeira()}
              revisao={revisaoPublicacoes}
            />
          </div>
          {aba === 'configuracoes' ? (
            <ConfiguracoesTab
              lixeira={naLixeira}
              fotosLixeira={fotosLixeira}
              erroLixeira={erro}
              erroFotosLixeira={erroFotosLixeira}
              onRestaurarDaLixeira={acoes.restaurarDaLixeira}
              onApagarDeVez={acoes.pedirExclusaoDefinitiva}
              onRestaurarFoto={acoes.restaurarFotoExcluida}
              onApagarFoto={acoes.pedirApagarFoto}
              onEsvaziarLixeira={acoes.pedirEsvaziarLixeira}
              onIrParaEstoque={() => trocarAba('estoque')}
              onRecarregar={recarregarLixeira}
            />
          ) : null}

          {previaId !== null ? (
            motoDaPrevia ? (
              <PreviaMoto
                moto={motoDaPrevia}
                onVoltar={voltarAoEstoque}
                onEditar={() => editarDaPrevia(motoDaPrevia)}
                onVender={() => void acoes.alterarStatus(motoDaPrevia, 'vendida')}
                onExcluir={() => acoes.pedirExclusao(motoDaPrevia)}
              />
            ) : ativas === null && !erro ? (
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
        <NavegacaoPainel
          variante="inferior"
          aba={aba}
          totalNaLixeira={totalNaLixeira}
          onTrocarAba={trocarAba}
        />
      </nav>

      <DialogoConfirmacao
        pedido={acoes.confirmacao}
        onFechar={acoes.fecharConfirmacao}
        ocupado={acoes.ocupado}
      />

      <DialogoRegistrarVenda
        moto={acoes.vendaAberta?.moto ?? null}
        venda={acoes.vendaAberta?.venda ?? null}
        onFechar={acoes.fecharVenda}
        onSalvo={acoes.vendaSalva}
      />

      <Toast feedback={feedback} onFechar={() => setFeedback(null)} acimaDaBarra />
    </div>
  )
}
