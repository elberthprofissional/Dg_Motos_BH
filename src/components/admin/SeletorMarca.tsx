import { useEffect, useState } from 'react'
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
 * como um diálogo comum. Esc fecha, igual ao resto do painel.
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

  // Ao abrir: busca começa limpa e o rolar do formulário fica preso
  // (a folha tem rolagem própria — esbarrar na folha não mexe no form).
  useEffect(() => {
    if (!aberto) return
    setBusca('')
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [aberto])

  // Esc fecha; a referência ao onFechar fica valendo do momento em
  // que o efeito rodou — o setter do pai não muda de identidade útil.
  useEffect(() => {
    if (!aberto) return
    function aoEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoEsc)
    return () => window.removeEventListener('keydown', aoEsc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  if (!aberto) return null

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
    onFechar()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escolher a marca da moto"
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar escolha de marca"
        className="absolute inset-0 cursor-default bg-black/65"
      />

      <div className="relative flex max-h-[82vh] w-full flex-col overflow-hidden border-t border-line-forte bg-night-950 sm:max-w-md sm:border">
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-lg font-semibold text-paper">Escolha a marca</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="foco-painel grid size-11 cursor-pointer place-items-center text-steel-400 transition-colors hover:text-paper"
          >
            <X className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        {/* A busca é a única mescla de "achar" e "digitar": se o termo
            não casa com nenhuma marca lista, ele se oferece como
            marca nova Logo embaixo das listas. */}
        <div className="shrink-0 p-4 pb-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-steel-500"
              aria-hidden="true"
            />
            <input
              /* eslint-disable-next-line jsx-a11y/no-autofocus */
              autoFocus
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
    </div>
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
