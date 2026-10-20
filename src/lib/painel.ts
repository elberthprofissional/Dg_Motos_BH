import type { Motorcycle, MotorcycleStatus } from '../types'
import { slugificar } from './catalog'

export interface ResumoEstoque {
  total: number
  disponiveis: number
  indisponiveis: number
  vendidas: number
  /** Soma do que está à venda agora — o número que interessa à operação. */
  valorDisponivel: number
  /** Soma de todas as motos, vendidas incluídas. */
  valorTotal: number
}

/** Contagem e valor por status. */
export function resumirEstoque(motos: Motorcycle[]): ResumoEstoque {
  const por = (status: MotorcycleStatus) => motos.filter((m) => m.status === status)
  const disponiveis = por('disponivel')
  const indisponiveis = por('indisponivel')
  const vendidas = por('vendida')
  const soma = (lista: Motorcycle[]) => lista.reduce((total, m) => total + m.preco, 0)

  return {
    total: motos.length,
    disponiveis: disponiveis.length,
    indisponiveis: indisponiveis.length,
    vendidas: vendidas.length,
    valorDisponivel: soma(disponiveis),
    valorTotal: soma(motos),
  }
}

/** Status do estoque, na ordem em que aparecem em filtro e no resumo. */
export const STATUS_ESTOQUE = ['disponivel', 'indisponivel', 'vendida'] as const

export function contarPorStatus(resumo: ResumoEstoque, status: MotorcycleStatus): number {
  if (status === 'disponivel') return resumo.disponiveis
  if (status === 'indisponivel') return resumo.indisponiveis
  return resumo.vendidas
}

export function tempoRelativo(iso: string, agora = new Date()): string {
  const quando = Date.parse(iso)
  if (!Number.isFinite(quando)) return 'data inválida'

  const minutos = Math.floor((agora.getTime() - quando) / 60_000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`

  const dias = Math.floor(horas / 24)
  if (dias < 30) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`

  const meses = Math.floor(dias / 30)
  if (meses < 12) return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`

  // A partir de 360 dias o dono quer ler "ano", nunca "12 meses".
  const anos = Math.max(1, Math.floor(dias / 365))
  return `há ${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

export interface FiltroEstoque {
  busca: string
  status: MotorcycleStatus | 'todas'
}

export function filtrarEstoque(motos: Motorcycle[], filtro: FiltroEstoque): Motorcycle[] {
  const termo = slugificar(filtro.busca)

  return motos.filter((moto) => {
    if (filtro.status !== 'todas' && moto.status !== filtro.status) return false
    if (!termo) return true

    const alvo = slugificar(
      `${moto.marca} ${moto.modelo} ${moto.ano} ${moto.categoria} ${moto.slug}`,
    )
    return alvo.includes(termo)
  })
}
