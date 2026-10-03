import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Motorcycle } from '../../types'
import { formatKm, formatPrice } from '../../lib/format'
import { SmartImage } from '../ui/SmartImage'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

interface ComparePanelProps {
  bikes: Motorcycle[]
  onRemove: (slug: string) => void
  onClear: () => void
}

/** Linha da tabela comparativa. */
function Row({ label, values }: { label: string; values: (string | null)[] }) {
  return (
    <div className="grid grid-cols-[110px_repeat(3,1fr)] items-center gap-3 border-b border-white/5 py-2.5 text-sm sm:grid-cols-[140px_repeat(3,1fr)]">
      <span className="text-[11px] font-semibold tracking-[0.14em] text-steel-400 uppercase">
        {label}
      </span>
      {values.map((v, i) => (
        <span key={i} className="text-paper">{v ?? '—'}</span>
      ))}
    </div>
  )
}

export function ComparePanel({ bikes, onRemove, onClear }: ComparePanelProps) {
  if (bikes.length < 2) {
    return (
      <p className="text-sm text-steel-400">
        Selecione pelo menos 2 motos nos cards acima para comparar.
      </p>
    )
  }

  return (
    <div className="surface rounded-lg p-4 sm:p-6">
      <div className="grid grid-cols-[110px_repeat(3,1fr)] gap-3 sm:grid-cols-[140px_repeat(3,1fr)]">
        <span aria-hidden="true" />
        {bikes.map((bike) => (
          <div key={bike.id} className="relative">
            <button
              type="button"
              onClick={() => onRemove(bike.slug)}
              aria-label={`Remover ${bike.marca} ${bike.modelo} da comparação`}
              className="absolute -top-2 -right-2 z-10 grid size-6 place-items-center rounded-full bg-night-700 text-steel-300 transition-colors hover:text-brand-500"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
            <Link to={`/moto/${bike.slug}`} className="block">
              <SmartImage
                src={bike.imagens[0]?.src ?? PLACEHOLDER_CARD}
                alt={`${bike.marca} ${bike.modelo}`}
                className="aspect-[4/3] w-full rounded"
                width={320}
                height={240}
              />
              <span className="mt-2 block font-display text-sm font-semibold uppercase">
                {bike.marca} {bike.modelo}
              </span>
              <span className="block text-xs text-steel-400">{bike.ano}</span>
            </Link>
          </div>
        ))}
        {/* Preenche colunas vazias para manter o grid alinhado */}
        {Array.from({ length: 3 - bikes.length }).map((_, i) => (
          <div key={`vazia-${i}`} aria-hidden="true" />
        ))}
      </div>

      <div className="mt-6 border-t border-white/10">
        <Row label="Preço" values={bikes.map((b) => formatPrice(b.preco))} />
        <Row label="Ano" values={bikes.map((b) => String(b.ano))} />
        <Row label="Quilometragem" values={bikes.map((b) => formatKm(b.quilometragem))} />
        <Row
          label="Cilindrada"
          values={bikes.map((b) => (b.cilindrada ? `${b.cilindrada} cc` : null))}
        />
        <Row label="Categoria" values={bikes.map((b) => b.categoria)} />
        <Row
          label="Disponibilidade"
          values={bikes.map((b) =>
            b.disponibilidade === 'disponivel' ? 'Disponível' : 'Reservada',
          )}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {bikes.map((bike) => (
          <Link
            key={bike.id}
            to={`/moto/${bike.slug}`}
            className="inline-flex items-center rounded border border-white/20 px-4 py-2 font-display text-xs font-semibold tracking-[0.08em] uppercase transition-colors hover:border-white/40 hover:bg-white/5"
          >
            Ver {bike.modelo}
          </Link>
        ))}
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-xs font-medium text-steel-400 transition-colors hover:text-paper"
        >
          Limpar comparação
        </button>
      </div>
    </div>
  )
}
