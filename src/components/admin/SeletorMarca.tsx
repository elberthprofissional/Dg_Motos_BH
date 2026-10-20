import { useState } from 'react'
import { iniciaisDaMarca, logoDaMarca } from '../../lib/marcas'

/**
 * ============================================================
 * SELETOR DE MARCA — círculos, estilo concessionária
 * ============================================================
 * Lista fixa das marcas de moto mais comuns no Brasil + as que já
 * existem no estoque (sem repetir).Um toque preenche o campo; digitar
 * à mão continua valendo para marca rara ou nova.
 *
 * Visual: mesmo disco do grid da vitrine (iniciais no placeholder),
 * redondo, vermelho quando é a marca escolhida.
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
      className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6"
    >
      {lista.map((marca) => {
        const ativa = marca === marcaAtiva
        return (
          <DiscoMarcaAdmin key={marca} marca={marca} ativa={ativa} onEscolher={onEscolher} />
        )
      })}
    </div>
  )
}

/** Mesmo disco da vitrine, menor. Logo com fallback para as iniciais. */
function DiscoMarcaAdmin({
  marca,
  ativa,
  onEscolher,
}: {
  marca: string
  ativa: boolean
  onEscolher: (marca: string) => void
}) {
  const [semLogo, setSemLogo] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onEscolher(ativa ? '' : marca)}
      aria-pressed={ativa}
      aria-label={marca}
      className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
    >
      <span
        className={`relative grid size-12 place-items-center overflow-hidden rounded-full border-2 transition-all duration-200 ${
          ativa
            ? 'border-brand-500'
            : 'border-white/15 group-hover:border-white/40 group-active:scale-95'
        }`}
      >
        <span className="absolute inset-0 grid place-items-center bg-[#1d1d1d] transition-colors group-hover:bg-[#242424]">
          {semLogo ? (
            <span
              className={`font-display text-[11px] font-bold tracking-[0.06em] transition-colors ${
                ativa ? 'text-brand-500' : 'text-[#8c8c8c] group-hover:text-[#d9d9d9]'
              }`}
            >
              {iniciaisDaMarca(marca)}
            </span>
          ) : (
            <img
              src={logoDaMarca(marca)}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setSemLogo(true)}
              className="size-full object-contain p-2"
            />
          )}
        </span>
      </span>
      <span
        className={`max-w-full truncate text-[10px] font-medium transition-colors ${
          ativa ? 'text-brand-500' : 'text-steel-500 group-hover:text-paper'
        }`}
      >
        {marca}
      </span>
    </button>
  )
}
