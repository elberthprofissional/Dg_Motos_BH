import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { EntregaRegistro } from '../../data/entregas'
import { DialogoConfirmacao } from '../ui/DialogoConfirmacao'
import type { PedidoConfirmacao } from '../ui/DialogoConfirmacao'
import { FotosEntregaInput } from './FotosEntregaInput'

export type SalvamentoPublicacao = 'publicada' | 'rascunho' | null

interface PublicacaoEditorProps {
  registro: EntregaRegistro
  emEdicao: boolean
  salvando: SalvamentoPublicacao
  arquivando: boolean
  onVoltar: () => void
  onChange: (patch: Partial<EntregaRegistro>) => void
  onFotosChange: (fotos: string[], imagens: string[]) => void
  onSalvar: (status: 'rascunho' | 'publicada') => void
  onArquivar: () => void | Promise<void>
}

/**
 * ============================================================
 * EDITOR DA PUBLICAÇÃO — a prova de contato
 * ============================================================
 * A postagem é só o carrossel: fotos, autorização e publicar. A
 * primeira foto vira a capa do card; data, ordem e anotação ficam
 * com o valor que já existe e não pedem nada de quem publica.
 */
export function PublicacaoEditor({
  registro,
  emEdicao,
  salvando,
  arquivando,
  onVoltar,
  onChange,
  onFotosChange,
  onSalvar,
  onArquivar,
}: PublicacaoEditorProps) {
  const [pedidoArquivo, setPedidoArquivo] = useState<PedidoConfirmacao | null>(null)

  const temFoto = registro.fotos.length > 0
  const autorizado = registro.autorizacaoPublicacao
  const publicada = registro.status === 'publicada'
  const podePublicar = temFoto && autorizado
  const ocupado = salvando !== null

  const faltas = [
    !temFoto ? 'uma foto' : null,
    !autorizado ? 'a autorização do cliente' : null,
  ].filter((item): item is string => item !== null)
  const aviso = faltas.length
    ? `Para ${publicada ? 'manter no ar' : 'publicar'}, falta ${faltas.join(' e ')}.`
    : null

  function pedirArquivamento() {
    setPedidoArquivo({
      titulo: 'Arquivar publicação',
      descricao:
        'Ela sai do mural e desta lista. As fotos continuam guardadas no armazenamento, mas a publicação não pode ser reaberta pelo painel.',
      rotuloConfirmar: 'Arquivar',
      rotuloOcupado: 'Arquivando…',
      onConfirmar: async () => {
        await onArquivar()
        setPedidoArquivo(null)
      },
    })
  }

  return (
    <section className="mx-auto max-w-6xl pb-4" aria-labelledby="publicacao-titulo">
      <button
        type="button"
        onClick={onVoltar}
        disabled={ocupado}
        className="foco-painel inline-flex min-h-11 items-center gap-2 text-sm text-steel-400 transition-colors hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Publicações
      </button>

      <header className="mt-2 flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            id="publicacao-titulo"
            className="font-display text-3xl font-semibold tracking-[-0.02em] text-paper sm:text-[2rem]"
          >
            {emEdicao ? 'Editar publicação' : 'Nova publicação'}
          </h2>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-steel-400">
            Escolha as fotos e confirme a autorização do cliente. O site mostra só as imagens e o
            mês.
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs">
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${
              publicada ? 'bg-ok' : 'border border-steel-500'
            }`}
          />
          <span className={publicada ? 'text-steel-300' : 'text-steel-400'}>
            {publicada ? 'No ar' : 'Rascunho'}
          </span>
        </span>
      </header>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0 bg-painel p-4 sm:p-6" aria-labelledby="publicacao-fotos">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 id="publicacao-fotos" className="text-base font-semibold text-paper">
              Fotos
            </h3>
            <span className="numeros text-xs text-steel-500">
              {registro.fotos.length} de 10 fotos
            </span>
          </div>
          <p className="mt-1 max-w-[64ch] text-xs leading-relaxed text-steel-500">
            A primeira foto é a capa do card; todas entram no carrossel.
          </p>

          <div className="mt-4">
            <FotosEntregaInput
              entregaId={registro.id}
              paths={registro.fotos}
              urls={registro.imagens}
              descricao="publicação da DG Motos"
              onChange={onFotosChange}
            />
          </div>
        </section>

        <aside
          className="bg-painel p-4 sm:p-5 lg:sticky lg:top-20"
          aria-label="Ações da publicação"
        >
          <label
            htmlFor="publicacao-autorizacao"
            className="flex cursor-pointer items-start gap-3 bg-painel-2 p-3.5 transition-colors hover:bg-painel-3"
          >
            <input
              id="publicacao-autorizacao"
              type="checkbox"
              checked={autorizado}
              onChange={(e) => onChange({ autorizacaoPublicacao: e.target.checked })}
              className="mt-0.5 size-[1.05rem] shrink-0 accent-marca"
            />
            <span>
              <span className="block text-sm font-medium text-paper">
                O cliente liberou as fotos
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-steel-500">
                Sem esta confirmação, a publicação fica como rascunho.
              </span>
            </span>
          </label>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => onSalvar('publicada')}
              disabled={ocupado || !podePublicar}
              aria-busy={salvando === 'publicada' || undefined}
              aria-describedby={!podePublicar && aviso ? 'publicacao-faltas' : undefined}
              className="foco-painel inline-flex min-h-11 w-full items-center justify-center bg-paper px-4 text-sm font-semibold text-night-950 transition-colors hover:bg-steel-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando === 'publicada'
                ? publicada
                  ? 'Salvando…'
                  : 'Publicando…'
                : publicada
                  ? 'Salvar alterações'
                  : 'Publicar'}
            </button>
            <button
              type="button"
              onClick={() => onSalvar('rascunho')}
              disabled={ocupado}
              aria-busy={salvando === 'rascunho' || undefined}
              className="foco-painel inline-flex min-h-11 w-full items-center justify-center border border-line-forte px-4 text-sm font-medium text-steel-300 transition-colors hover:border-steel-400 hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando === 'rascunho'
                ? publicada
                  ? 'Despublicando…'
                  : 'Salvando…'
                : publicada
                  ? 'Despublicar'
                  : 'Salvar rascunho'}
            </button>
          </div>

          {aviso ? (
            <p id="publicacao-faltas" className="mt-2 text-xs leading-relaxed text-alerta">
              {aviso}
            </p>
          ) : null}

          {emEdicao ? (
            <div className="mt-4 border-t border-line pt-3">
              <button
                type="button"
                onClick={pedirArquivamento}
                disabled={ocupado || arquivando}
                className="foco-painel inline-flex min-h-11 w-full items-center justify-center text-xs text-steel-500 transition-colors hover:text-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {arquivando ? 'Arquivando…' : 'Arquivar publicação'}
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      <DialogoConfirmacao
        pedido={pedidoArquivo}
        onFechar={() => setPedidoArquivo(null)}
        ocupado={arquivando}
      />
    </section>
  )
}
