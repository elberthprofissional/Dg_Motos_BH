import type { Motorcycle } from '../types'

export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

export function formatKm(km: number | null): string {
  if (km == null) return 'Km a confirmar'
  return `${km.toLocaleString('pt-BR')} km`
}

/** Mensagem para interesse em uma moto específica (spec do projeto). */
export function buildBikeMessage(marca: string, modelo: string, ano: number): string {
  return `Olá! Tenho interesse na ${marca} ${modelo} ${ano} anunciada no site da DG Motos. Gostaria de receber mais informações.`
}

/** CTA geral de negociação. */
export function buildDefaultMessage(): string {
  return 'Olá! Vim pelo site da DG Motos e gostaria de negociar uma motocicleta.'
}

export function bikeTitle(bike: Motorcycle): string {
  return `${bike.marca} ${bike.modelo}`
}
