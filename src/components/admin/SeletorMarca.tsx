/**
 * ============================================================
 * SELETOR DE MARCA — grid de pílulas interativas
 * ============================================================
 * Lista fixa das marcas de moto mais comuns no Brasil + as que já
 * existem no estoque (sem repetir). Um toque preenche o campo; digitar
 * à mão continua valendo para marca rara ou nova (o campo de texto
 * segue no formulário, logo abaixo do grid).
 *
 * Visual: pílulas compactas em grid; a escolhida acende em vermelho
 * com brilho sutil — o mesmo vocabulário do resto do painel.
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

export function SeletorMarca({
  marcasDoEstoque,
  marcaAtiva,
  onEscolher,
}: {
  /** Marcas que já existem no estoque (vêm antes das comuns). */
  marcasDoEstoque: string[]
  /** Marca atual do formulário ('' = nenhuma). */
  marcaAtiva: string
  onEscolher: (marca: string) => void
}) {
  // Estoque primeiro (relevância), depois as comuns, sem duplicatas.
  const todas = [...new Set([...marcasDoEstoque, ...MARCAS_COMUNS])]
  const lista = marcaAtiva && !todas.includes(marcaAtiva) ? [...todas, marcaAtiva] : todas

  return (
    <div
      role="group"
      aria-label="Marcas rápidas"
      className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6"
    >
      {lista.map((marca) => {
        const ativa = marca === marcaAtiva
        return (
          <button
            key={marca}
            type="button"
            onClick={() => onEscolher(ativa ? '' : marca)}
            aria-pressed={ativa}
            className={`foco-painel inline-flex min-h-11 cursor-pointer items-center justify-center truncate rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
              ativa
                ? /* taste-skill-ignore: micro-animacao de seletor */
                  'border-red-600 bg-red-950/20 text-white shadow-lg shadow-red-950/30 scale-[1.02]'
                : 'border-neutral-800 bg-black/40 text-neutral-400 hover:border-neutral-700 hover:text-white'
            }`}
          >
            {marca}
          </button>
        )
      })}
    </div>
  )
}
