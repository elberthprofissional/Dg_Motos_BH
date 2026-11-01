import { Download, Share, X } from 'lucide-react'
import type { EstadoConvitePwa } from './useConvitePwa'

/**
 * ============================================================
 * CONVITE DE INSTALAÇÃO (CARTÃO AUTOMÁTICO)
 * ============================================================
 * O convite encontra o dono: aparece uma vez só, quando o navegador
 * oferece instalação (Android) ou quando resta o caminho manual (iOS).
 * Some para sempre no primeiro "fechar" — ninguém é cobrado duas vezes.
 *
 * A lógica (quando aparecer, o que fazer em cada SO) mora em
 * `useConvitePwa`; aqui é só a casca e as ações.
 */

export function ConvitePwa({ convite }: { convite: EstadoConvitePwa }) {
  if (!convite.visivel) return null

  return (
    <div
      role="dialog"
      aria-labelledby="convite-pwa-titulo"
      // Acima da barra inferior do celular (z-40) e dos avisos (Toast);
      // fixed, então não desloca o conteúdo nem cobre a edição inteira.
      className="safe-bottom fixed inset-x-3 bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] z-50 mx-auto max-w-md rounded-xl border border-line bg-night-900 p-4 shadow-2xl shadow-black/60 sm:inset-x-4"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-[22%] border border-line bg-night-800"
        >
          <img src="/logo.webp" alt="" width={40} height={40} className="size-[72%] object-contain" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 id="convite-pwa-titulo" className="font-display text-sm font-semibold tracking-wide text-paper uppercase">
            Instalar o painel
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-steel-400">
            {convite.ios
              ? 'No iPhone, toque em Compartilhar e depois em “Adicionar à Tela de Início”.'
              : 'Abre em tela cheia, com ícone próprio, direto na tela inicial.'}
          </p>
        </div>

        <button
          type="button"
          onClick={convite.fechar}
          aria-label="Não quero instalar"
          title="Fechar"
          className="foco-painel -mt-1 -mr-1 grid size-8 shrink-0 place-items-center text-steel-400 transition-colors hover:text-paper"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {convite.ios ? (
        // iOS não tem prompt: é o mesmo passo a passo do modal, enxuto.
        <ol className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs text-steel-300">
          <li className="flex items-center gap-2">
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-claro/5 font-display text-[10px] font-bold">
              1
            </span>
            Toque no botão <Share className="size-3.5 shrink-0" aria-hidden="true" /> Compartilhar.
          </li>
          <li className="flex items-center gap-2">
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-claro/5 font-display text-[10px] font-bold">
              2
            </span>
            Escolha “Adicionar à Tela de Início”.
          </li>
        </ol>
      ) : (
        <button
          type="button"
          onClick={() => void convite.instalar()}
          className="btn btn-primary mt-3 h-11 w-full"
        >
          <Download className="size-4" aria-hidden="true" />
          Instalar agora
        </button>
      )}
    </div>
  )
}
