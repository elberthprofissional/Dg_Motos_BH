/**
 * ============================================================
 * GRID DE MARCAS — estilo vitrine de concessionária
 * ============================================================
 * Círculos com as marcas do estoque, clicáveis, que filtram a
 * lista. A seleção alimenta o mesmo `filtros.marca` do select — os
 * dois controles ficam sempre em sincronia.
 *
 * Logo: hoje nenhuma marca tem arquivo de logo (o cliente ainda não
 * enviou). Quando mandar, basta colocar o arquivo em
 * `public/marcas/<slug>.webp` (ex.: /marcas/honda.webp) — o slug
 * vem de `logoDaMarca`, em src/lib/marcas.ts — e trocar o placeholder
 * de iniciais pelo <img> indicado abaixo. Sem imagem inventada:
 * enquanto não há logo, as iniciais ocupam o disco.
 */
import { useState } from 'react'
import { iniciaisDaMarca, logoDaMarca } from '../../lib/marcas'

export interface MarcaGridProps {
  /** Marcas presentes no estoque, já ordenadas e únicas. */
  marcas: string[]
  /** Marca filtrada corrente ('' = todas). */
  marcaAtiva: string
  /** Callback com a marca clicada; clicar na ativa limpa o filtro. */
  onSelecionar: (marca: string) => void
}

export function MarcaGrid({ marcas, marcaAtiva, onSelecionar }: MarcaGridProps) {
  if (marcas.length === 0) return null

  return (
    <div
      role="group"
      aria-label="Filtrar por marca"
      className="grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-6 lg:grid-cols-6"
    >
      {marcas.map((marca) => {
        const ativa = marca === marcaAtiva
        return (
          <DiscoMarca key={marca} marca={marca} ativa={ativa} onSelecionar={onSelecionar} />
        )
      })}
    </div>
  )
}

/**
 * Disco de uma marca.
 *
 * O logo vem de `logoDaMarca` (public/marcas/<slug>.webp). Se o arquivo
 * não existir — marca nova digitada no admin, por exemplo — o onError
 * volta para as iniciais em vez de deixar o círculo vazio.
 */
function DiscoMarca({
  marca,
  ativa,
  onSelecionar,
}: {
  marca: string
  ativa: boolean
  onSelecionar: (marca: string) => void
}) {
  const [semLogo, setSemLogo] = useState(false)
  const iniciais = iniciaisDaMarca(marca)

  return (
    <button
      type="button"
      onClick={() => onSelecionar(ativa ? '' : marca)}
      aria-pressed={ativa}
      aria-label={ativa ? `Remover filtro da marca ${marca}` : `Filtrar pela marca ${marca}`}
      className="focus-visible:outline-none group flex flex-col items-center gap-2.5 rounded-md py-1"
    >
      {/* Anel: cinza → vermelho quando ativa. O disco interno
          contrai levemente no active: clique que responde. */}
      <span
        className={`relative grid size-16 place-items-center overflow-hidden rounded-full border-2 transition-all duration-200 sm:size-[68px] ${
          ativa
            ? 'border-[#d91f32]'
            : 'border-white/15 group-hover:border-white/40 group-active:scale-95'
        }`}
      >
        <span className="absolute inset-0 grid place-items-center bg-[#1d1d1d] transition-colors group-hover:bg-[#242424]">
          {semLogo ? (
            <span
              className={`font-display text-lg font-bold tracking-[0.08em] transition-colors ${
                ativa ? 'text-[#d91f32]' : 'text-[#8c8c8c] group-hover:text-[#d9d9d9]'
              }`}
            >
              {iniciais}
            </span>
          ) : (
            <img
              src={logoDaMarca(marca)}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setSemLogo(true)}
              className={`size-full object-contain p-2.5 transition-opacity ${
                ativa ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
              }`}
            />
          )}
        </span>
      </span>

      <span
        className={`font-display text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors ${
          ativa ? 'text-[#d91f32]' : 'text-[#a3a3a3] group-hover:text-[#f5f5f5]'
        }`}
      >
        {marca}
      </span>
    </button>
  )
}
