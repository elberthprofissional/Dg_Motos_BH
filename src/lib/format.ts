import type { Motorcycle } from '../types'
import { whatsappUrlCom } from './configLoja'
import { useSiteConfig } from '../hooks/siteConfigContexto'

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

/**
 * Link wa.me com o número configurado pelo dono (banco) ou, na falta,
 * o de src/data/site.ts. `null` = sem número: o componente cai para /contato.
 *
 * Hook: só funciona dentro da vitrine (componentes sob o RootLayout).
 */
export function useWhatsappLink(message: string): string | null {
  const { config } = useSiteConfig()
  return whatsappUrlCom(config, message)
}

export function bikeTitle(bike: Motorcycle): string {
  return `${bike.marca} ${bike.modelo}`
}
