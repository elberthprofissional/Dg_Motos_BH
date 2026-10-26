import { useEffect, useRef } from 'react'
import { Check, Download, Share, Smartphone, X } from 'lucide-react'
import type { EstadoInstalarApp } from './useInstalarApp'

/**
 * ============================================================
 * INSTALAR O APP
 * ============================================================
 * O painel vira aplicativo: abre em tela cheia e ganha ícone próprio.
 * O Chrome/Edge têm prompt nativo; no iOS o modal mostra o passo a passo
 * (Compartilhar → Adicionar à Tela). Quando já está instalado, o texto
 * muda para "instalado" em vez de sumir — o dono vê que está tudo certo.
 *
 * O estado vem de `useInstalarApp`; o gatilho fica em cada tela que
 * oferece a instalação (rail do desktop, lista do celular).
 * ============================================================
 */

export function ModalInstalar({ app }: { app: EstadoInstalarApp }) {
  const caixa = useRef<HTMLDivElement>(null)
  const fecharBotao = useRef<HTMLButtonElement>(null)
  // Desestruturado: `fechar` é estável (useCallback) e `aberto` é primitivo,
  // então o efeito só re-registra o listener quando o modal abre/fecha.
  const { aberto, fechar } = app

  useEffect(() => {
    if (!aberto) return
    fecharBotao.current?.focus()

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        fechar()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, fechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:items-center sm:p-4 sm:pb-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={fechar}
        className="absolute inset-0 bg-black/70"
      />

      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-titulo"
        className="relative max-h-full w-full max-w-md overflow-y-auto rounded-xl border border-line bg-night-900 p-6 shadow-2xl shadow-black/60"
      >
        <button
          ref={fecharBotao}
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="foco-painel btn-icone absolute top-4 right-4 border-transparent"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        {/* Ícone do app num selo com o vermelho da loja — a mesma cara
            que ele terá na tela inicial do celular. */}
        <span
          aria-hidden="true"
          className="mx-auto grid size-20 place-items-center rounded-[22%] border border-line bg-night-800"
        >
          <img src="/logo.webp" alt="" width={80} height={80} className="size-[72%] object-contain" />
        </span>

        <h2
          id="app-titulo"
          className="mt-5 text-center font-display text-xl font-semibold tracking-wide text-paper uppercase"
        >
          DG Motos no seu celular
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-steel-400">
          Instale o painel como aplicativo: abre direto no login, em tela
          cheia, e fica na tela inicial junto dos seus apps.
        </p>

        <ul className="mt-5 space-y-3">
          {[
            'Abre em tela cheia, sem barra do navegador',
            'Ícone próprio na tela inicial',
            'Atalho direto para o painel de estoque',
          ].map((texto) => (
            <li key={texto} className="flex items-start gap-3 text-sm text-steel-300">
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-500"
              >
                <Check className="size-3" />
              </span>
              {texto}
            </li>
          ))}
        </ul>

        {app.instalado ? (
          <p className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-steel-300">
            <Check className="size-4 text-ok" aria-hidden="true" />
            O app já está instalado neste aparelho.
          </p>
        ) : app.instrucoesIos ? (
          <InstrucoesIos />
        ) : app.podeInstalar ? (
          <button
            type="button"
            onClick={() => void app.instalar()}
            className="btn btn-primary mt-6 h-12 w-full"
          >
            <Download className="size-4" aria-hidden="true" />
            Instalar agora
          </button>
        ) : (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-line bg-night-800 px-4 py-3">
            <Smartphone className="mt-0.5 size-4 shrink-0 text-steel-400" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-steel-400">
              Abra este site no Chrome do Android (ou Safari no iPhone) para
              instalar. Se a opção não aparecer, use o menu do navegador e
              escolha <span className="text-steel-300">“Adicionar à tela inicial”</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Passo a passo do iOS, onde não existe prompt automático. */
function InstrucoesIos() {
  return (
    <ol className="mt-6 space-y-3 rounded-lg border border-line bg-night-800 p-4">
      <li className="flex items-start gap-3 text-sm text-steel-300">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-claro/5 font-display text-xs font-bold text-steel-300">
          1
        </span>
        <span>
          Toque no botão <Share className="inline size-4 align-text-bottom" aria-hidden="true" />{' '}
          <span className="text-steel-400">Compartilhar</span> do Safari.
        </span>
      </li>
      <li className="flex items-start gap-3 text-sm text-steel-300">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-claro/5 font-display text-xs font-bold text-steel-300">
          2
        </span>
        <span>
          Escolha <span className="text-steel-300">“Adicionar à Tela de Início”</span>.
        </span>
      </li>
      <li className="flex items-start gap-3 text-sm text-steel-300">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-claro/5 font-display text-xs font-bold text-steel-300">
          3
        </span>
        <span>Confirme em “Adicionar”. O ícone aparece na tela inicial.</span>
      </li>
    </ol>
  )
}
