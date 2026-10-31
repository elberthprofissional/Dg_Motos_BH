import { useEffect, useRef, useState } from 'react'
import { Check, Search, X } from 'lucide-react'

/**
 * ============================================================
 * SELETOR DE MARCA — folha inferior (bottom sheet) de escolha
 * ============================================================
 * O grid de pílulas roubava a tela inteira e parecia formulário
 * genérico. Agora o campo do formulário só abre a folha: nela a
 * dona busca, vê as marcas do seu próprio estoque em primeiro
 * lugar, as mais comuns depois — e se a marca não existir em
 * lugar nenhum, a mesma busca serve para digitar uma nova.
 *
 * No celular a folha sobe do rodapé; na mesa aparece centrada,
 * como um diálogo comum — os dois casos vêm da casca `.dialogo`,
 * a mesma dos outros diálogos do painel. `<dialog>` nativo entrega
 * foco preso, Esc e camada superior de graça: aqui dentro a Tab
 * fica na lista, e não pula para o formulário atrás da folha.
 */

const MARCAS_COMUNS = [
  'Honda',
  'Yamaha',
  'Suzuki',
  'Kawasaki',
  'Dafra',
  'TVS',
  'Royal Enfield',
  'BMW',
  'KTM',
  'Ducati',
  'Harley-Davidson',
  'Shineray',
  'Motomel',
  'Gilera',
  'Zanella',
]

interface SeletorMarcaProps {
  /** Marcas que já existem no estoque (vêm antes das comuns). */
  marcasDoEstoque: string[]
  /** Marca atual do formulário ('' = nenhuma). */
  marcaAtiva: string
  onEscolher: (marca: string) => void
  onFechar: () => void
  /** A folha existe somente enquanto a dona está escolhendo. */
  aberto: boolean
}

export function SeletorMarca({
  marcasDoEstoque,
  marcaAtiva,
  onEscolher,
  onFechar,
  aberto,
}: SeletorMarcaProps) {
  const [busca, setBusca] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const buscaRef = useRef<HTMLInputElement>(null)
  const onFecharRef = useRef(onFechar)
  useEffect(() => {
    onFecharRef.current = onFechar
  }, [onFechar])

  // Abrir e fechar são o `aberto` do pai virando showModal()/close().
  // A folha fica montada o tempo todo — o React precisa do nó para a
  // referência, e a lista já nasce com a busca limpa.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (aberto && !dialog.open) {
      setBusca('')
      // O rolar do formulário fica preso: esbarrar na folha não mexe
      // no form atrás dela.
      const anterior = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      dialog.showModal()
      buscaRef.current?.focus()
      return () => {
        document.body.style.overflow = anterior
      }
    }
    if (!aberto && dialog.open) dialog.close()
  }, [aberto])

  // Esc fecha pelo próprio `<dialog>`; o `close` é o único caminho de
  // saída — clique no fundo, ✕ e escolher a marca passam por aqui.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const aoFechar = () => onFecharRef.current()
    dialog.addEventListener('close', aoFechar)
    return () => dialog.removeEventListener('close', aoFechar)
  }, [])

  // Ordem: a marca já escolhida primeiro, depois o estoque, depois
  // as comuns — sem repetir ninguém. A busca filtra esses grupos.
  const todas = [
    ...new Set([...(marcaAtiva ? [marcaAtiva] : []), ...marcasDoEstoque, ...MARCAS_COMUNS]),
  ]
  const termo = busca.trim().toLowerCase()
  const bate = (marca: string) => marca.toLowerCase().includes(termo)

  const achadas = termo ? todas.filter(bate) : todas
  const emEstoque = achadas.filter((marca) => marcasDoEstoque.includes(marca))
  const outras = achadas.filter(
    (marca) => !emEstoque.includes(marca) && (MARCAS_COMUNS.includes(marca) || marca === marcaAtiva),
  )
  const termoNovo = termo && !todas.some((marca) => marca.toLowerCase() === termo)

  function escolher(marca: string) {
    onEscolher(marca)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialogo dialogo-marcas"
      aria-labelledby="marcas-titulo"
      onClick={(evento) => {
        // O fundo é o próprio `<dialog>`: o painel é filho, então um
        // clique fora dele fecha a folha.
        if (evento.target === dialogRef.current) dialogRef.current?.close()
      }}
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
          <h2 id="marcas-titulo" className="font-display text-lg font-semibold text-paper">
            Escolha a marca
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className="foco-painel grid size-11 cursor-pointer place-items-center text-steel-400 transition-colors hover:text-paper"
          >
            <X className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        {/* A busca é a única mescla de "achar" e "digitar": se o termo
            não casa com nenhuma marca lista, ele se oferece como
            marca nova logo embaixo das listas. */}
        <div className="shrink-0 p-4 pb-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-steel-500"
              aria-hidden="true"
            />
            <input
              ref={buscaRef}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar ou digitar a marca"
              aria-label="Buscar ou digitar a marca"
              className="h-11 w-full border border-line bg-night-900/60 pl-10 pr-4 text-sm text-paper placeholder:text-steel-500 outline-none transition-colors focus:border-marca"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
          {emEstoque.length > 0 ? (
            <p className="px-5 pb-1.5 pt-2 text-xs font-medium tracking-wide text-steel-500">
              No seu estoque
            </p>
          ) : null}
          {emEstoque.map((marca) => (
            <LinhaMarca key={marca} marca={marca} ativa={marca === marcaAtiva} onEscolher={escolher} />
          ))}

          {outras.length > 0 ? (
            <p className="px-5 pb-1.5 pt-4 text-xs font-medium tracking-wide text-steel-500">
              {termo ? 'Outras marcas' : 'Marcas mais comuns'}
            </p>
          ) : null}
          {outras.map((marca) => (
            <LinhaMarca key={marca} marca={marca} ativa={marca === marcaAtiva} onEscolher={escolher} />
          ))}

          {termoNovo ? (
            <>
              <p className="px-5 pb-1.5 pt-4 text-xs font-medium tracking-wide text-steel-500">
                Marca nova
              </p>
              <button
                type="button"
                onClick={() => escolher(busca.trim())}
                className="foco-painel flex min-h-12 w-full cursor-pointer items-center gap-3 px-5 text-left text-[15px] text-paper transition-colors hover:bg-painel-3/60"
              >
                Usar “{busca.trim()}”
              </button>
            </>
          ) : null}
        </div>
      </div>
    </dialog>
  )
}

/** Linha da lista: a marca escolhida acende no vermelho da casa e ganha o visto. */
function LinhaMarca({
  marca,
  ativa,
  onEscolher,
}: {
  marca: string
  ativa: boolean
  onEscolher: (marca: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onEscolher(marca)}
      aria-pressed={ativa}
      className={`foco-painel flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-5 text-left text-[15px] transition-colors hover:bg-painel-3/60 ${
        ativa ? 'text-brand-400' : 'text-steel-200'
      }`}
    >
      {marca}
      {ativa ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
    </button>
  )
}
