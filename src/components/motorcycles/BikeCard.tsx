import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gauge, GitCompare } from 'lucide-react'
import type { Motorcycle, MotorcycleAvailability } from '../../types'
import { formatKm, formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { useCompare } from '../../hooks/useCompare'

interface BikeCardProps {
  bike: Motorcycle
  /** Prioriza o carregamento da primeira dobra (home). */
  priority?: boolean
}

export function BikeCard({ bike, priority = false }: BikeCardProps) {
  const title = `${bike.marca} ${bike.modelo}`
  const capa = bike.imagens[0]
  const { toggle, isSelected, MAX } = useCompare()
  const selecionada = isSelected(bike.slug)
  const [aviso, setAviso] = useState<string | null>(null)

  function comparar() {
    const ok = toggle(bike.slug)
    setAviso(
      ok
        ? null
        : `Você já tem ${MAX} motos na comparação. Remova uma para adicionar esta.`,
    )
    if (!ok) window.setTimeout(() => setAviso(null), 4000)
  }

  // `disponibilidade` tem três estados. Tratar como binário rotulava uma moto
  // vendida como "Reservada", que é informação errada na vitrine.
  const SELO: Record<MotorcycleAvailability, { texto: string; classe: string }> = {
    disponivel: { texto: 'Disponível', classe: 'border-white/15 bg-night-950/85 text-paper' },
    reservada: { texto: 'Reservada', classe: 'border-brand-500/40 bg-night-950/85 text-brand-500' },
    vendida: { texto: 'Vendida', classe: 'border-white/10 bg-night-950/85 text-steel-500' },
  }
  const selo = SELO[bike.disponibilidade] ?? SELO.disponivel

  return (
    <article className="group surface flex flex-col overflow-hidden transition-colors duration-300 hover:border-line-forte">
      {/* 4:5 é a proporção real das fotos do catálogo (960x1200). Uma caixa
          horizontal cortaria a moto ao meio — por isso o container é
          vertical, e não 3/2. */}
      <div className="relative">
        <Link
          to={`/moto/${bike.slug}`}
          className="block aspect-4/5 overflow-hidden bg-night-800"
          aria-label={`Ver detalhes de ${title} ${bike.ano}`}
        >
          <img
            src={capa?.src ?? PLACEHOLDER_CARD}
            alt={capa?.alt ?? `${title} ${bike.ano}`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            width={960}
            height={1200}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>

        <span
          className={`pointer-events-none absolute top-3 left-3 rounded-sm border px-2 py-1 font-display text-[10px] font-semibold tracking-[0.14em] uppercase ${selo.classe}`}
        >
          {selo.texto}
        </span>

        {/* Botão de comparação. Sempre visível: `opacity-0` no hover só
            funciona com mouse, e no celular a função sumia. */}
        <button
          type="button"
          onClick={comparar}
          aria-pressed={selecionada}
          aria-label={
            selecionada
              ? `Remover ${title} da comparação`
              : `Adicionar ${title} à comparação`
          }
          title={selecionada ? 'Remover da comparação' : 'Comparar'}
          className={`absolute top-3 right-3 grid size-10 place-items-center rounded-sm border transition-colors ${
            selecionada
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-white/15 bg-night-950/85 text-steel-300 hover:text-paper'
          }`}
        >
          <GitCompare className="size-4" aria-hidden="true" />
        </button>

        {aviso && (
          <p
            role="status"
            className="absolute inset-x-3 bottom-3 rounded-sm bg-night-950/95 px-3 py-2 text-[11px] leading-snug text-steel-300"
          >
            {aviso}
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-steel-500 uppercase">
          {bike.marca}
        </p>
        <h3 className="mt-1 font-display text-xl leading-tight font-semibold tracking-wide uppercase">
          <Link to={`/moto/${bike.slug}`} className="link-editorial">
            {bike.modelo}
          </Link>
        </h3>

        <p className="mt-1.5 text-sm text-steel-400">
          {bike.ano}
          {bike.cilindrada ? ` · ${bike.cilindrada} cc` : ''}
          {bike.quilometragem != null ? ` · ${formatKm(bike.quilometragem)}` : ''}
        </p>

        <p className="valor-moeda mt-5 font-display text-2xl font-semibold text-paper">
          {formatPrice(bike.preco)}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] text-steel-500 uppercase">
            {bike.quilometragem != null ? <Gauge className="size-3.5" aria-hidden="true" /> : null}
            {bike.categoria}
          </span>
          <Link
            to={`/moto/${bike.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
          >
            Ver detalhes
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  )
}