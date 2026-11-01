import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  excluirFotosAdicionadas,
  excluirFotosRemovidas,
  montarSlug,
  salvarMoto,
} from '../../lib/catalog'
import type { MotoParaSalvar } from '../../lib/catalog'
import type { Motorcycle } from '../../types'
import { VAZIO, avaliarMoto } from './moto-form/validacao'
import { SecaoAnuncio } from './moto-form/SecaoAnuncio'
import { SecaoComercial } from './moto-form/SecaoComercial'
import { SecaoFichaTecnica } from './moto-form/SecaoFichaTecnica'
import { SecaoIdentificacao } from './moto-form/SecaoIdentificacao'

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
 *
 * As seções em si moram em `moto-form/`; aqui fica só a máquina de
 * estado: rascunho, limpeza de fotos órfãs e o submit. A validação
 * pura está em `validacao.ts` (testada sem render).
 */

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

  // As fotos sobem para o Storage na hora; se a tela for abandonada sem
  // salvar, elas viram arquivos órfãos. Os refs guardam o estado mais
  // recente para a limpeza de desmontagem, e `encerrado` impede que o
  // cancelamento explícito apague duas vezes.
  const fotosRef = useRef(form.imagens)
  const inicialRef = useRef(inicial)
  const encerradoRef = useRef(false)
  useEffect(() => {
    fotosRef.current = form.imagens
  }, [form.imagens])
  useEffect(() => {
    inicialRef.current = inicial
  }, [inicial])
  useEffect(() => {
    return () => {
      if (encerradoRef.current) return
      void excluirFotosAdicionadas(inicialRef.current?.imagens ?? [], fotosRef.current)
    }
  }, [])

  /** Sair sem salvar: devolve ao Storage o mesmo estado de antes. */
  async function cancelar() {
    encerradoRef.current = true
    await excluirFotosAdicionadas(inicial?.imagens ?? [], form.imagens)
    onCancelar()
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Duplo clique: o botão já nasce desabilitado, mas o clique pode
    // passar entre o evento e o re-render. O guard aqui mata de vez.
    if (salvando) return
    setErro(null)

    const problema = avaliarMoto(form)
    if (problema) {
      setErro(problema)
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
    encerradoRef.current = true
    await excluirFotosRemovidas(inicial?.imagens ?? [], form.imagens)
    onSalvo()
  }

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
          onClick={() => void cancelar()}
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
      <div className="space-y-6">
        <SecaoIdentificacao form={form} onSet={set} estoque={estoque} />
        <SecaoComercial form={form} onSet={set} />
        <SecaoFichaTecnica form={form} onSet={set} />
        <SecaoAnuncio
          form={form}
          onSet={set}
          onFotos={(fotos) => {
            // Atualiza o ref já no evento: se a tela sair antes do próximo
            // efeito, a limpeza ainda vê a lista com as fotos novas.
            fotosRef.current = fotos
            set('imagens', fotos)
          }}
        />
      </div>

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
            onClick={() => void cancelar()}
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
