import type { Motorcycle, MotorcycleStatus, Venda } from '../types'
import { slugificar } from './catalog'

export interface ResumoEstoque {
  total: number
  disponiveis: number
  indisponiveis: number
  vendidas: number
  /** Soma do que está à venda agora — o número que interessa à operação. */
  valorDisponivel: number
  /** Soma do que está fisicamente no estoque (disponíveis + indisponíveis). */
  valorEmEstoque: number
  /** Soma de todas as motos, vendidas incluídas. */
  valorTotal: number
}

/** Motos que ainda vivem no painel — a lixeira não entra em conta. */
export function motosAtivas(motos: Motorcycle[]): Motorcycle[] {
  return motos.filter((moto) => !moto.lixeiraEm)
}

/** Motos na lixeira, da exclusão mais recente para a mais antiga. */
export function motosNaLixeira(motos: Motorcycle[]): Motorcycle[] {
  return motos
    .filter((moto) => Boolean(moto.lixeiraEm))
    .sort((a, b) => (b.lixeiraEm ?? '').localeCompare(a.lixeiraEm ?? ''))
}

/**
 * Prazo da lixeira: passado esse tempo, a moto é apagada de vez.
 * Vale só para o que está na lixeira — o estoque ativo não expira.
 */
export const DIAS_NA_LIXEIRA = 30

/**
 * Dias inteiros que faltam para a moto sair sozinha da lixeira.
 * `0` = já venceu (apaga na próxima abertura do painel).
 * `null` = sem data legível, então nunca expira por conta própria.
 */
export function diasAteApagar(moto: Motorcycle, agora = new Date()): number | null {
  if (!moto.lixeiraEm) return null
  const quando = Date.parse(moto.lixeiraEm)
  if (!Number.isFinite(quando)) return null

  const diasPassados = Math.floor((agora.getTime() - quando) / 86_400_000)
  return Math.max(0, DIAS_NA_LIXEIRA - diasPassados)
}

/** Motos cujo prazo na lixeira venceu — é o que a limpeza automática apaga. */
export function motosVencidasNaLixeira(
  motos: Motorcycle[],
  agora = new Date(),
): Motorcycle[] {
  return motosNaLixeira(motos).filter((moto) => diasAteApagar(moto, agora) === 0)
}

/** Contagem e valor por status. Ignora o que está na lixeira. */
export function resumirEstoque(motos: Motorcycle[]): ResumoEstoque {
  const vivas = motosAtivas(motos)
  const por = (status: MotorcycleStatus) => vivas.filter((m) => m.status === status)
  const disponiveis = por('disponivel')
  const indisponiveis = por('indisponivel')
  const vendidas = por('vendida')
  const soma = (lista: Motorcycle[]) => lista.reduce((total, m) => total + m.preco, 0)

  return {
    total: vivas.length,
    disponiveis: disponiveis.length,
    indisponiveis: indisponiveis.length,
    vendidas: vendidas.length,
    valorDisponivel: soma(disponiveis),
    valorEmEstoque: soma([...disponiveis, ...indisponiveis]),
    valorTotal: soma(vivas),
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

// ── Vendas ─────────────────────────────────────────────────────────────
// As abas trabalham com a lista já em ordem de registro (a mais nova
// primeiro). Estas funções só fazem conta: nada de acesso ao banco aqui,
// para poder testar sem rede.

export interface ResumoVendas {
  quantidade: number
  /** Soma do que as motos venderam. */
  faturamento: number
  /** Soma de (valor - custo); ignorando vendas sem custo conhecido. */
  lucro: number
  /** Quantas vendas têm custo informado — base real do lucro. */
  comCusto: number
  ticketMedio: number
}

export function resumirVendas(vendas: Venda[]): ResumoVendas {
  const faturamento = vendas.reduce((total, v) => total + v.valor, 0)
  const comCusto = vendas.filter((v) => v.custo != null)
  const lucro = comCusto.reduce((total, v) => total + (v.valor - (v.custo ?? 0)), 0)

  return {
    quantidade: vendas.length,
    faturamento,
    lucro,
    comCusto: comCusto.length,
    ticketMedio: vendas.length === 0 ? 0 : Math.round(faturamento / vendas.length),
  }
}

/**
 * Lucro por mês, para o gráfico de barras da aba. O mês é etiquetado
 * como 'yyyy-MM' (a ordenação é textual e estável) e o rótulo bonito
 * ('jan/26') fica por conta do componente.
 */
export function lucroPorMes(vendas: Venda[]): { mes: string; lucro: number; faturamento: number }[] {
  const mapa = new Map<string, { lucro: number; faturamento: number }>()
  for (const v of vendas) {
    const mes = v.vendidaEm.slice(0, 7)
    const atual = mapa.get(mes) ?? { lucro: 0, faturamento: 0 }
    atual.faturamento += v.valor
    if (v.custo != null) atual.lucro += v.valor - v.custo
    mapa.set(mes, atual)
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, dados]) => ({ mes, ...dados }))
}

export interface FiltroVendas {
  busca: string
  /** 'todas' ou um mês 'yyyy-MM'. */
  mes: string
}

export function filtrarVendas(vendas: Venda[], filtro: FiltroVendas): Venda[] {
  const termo = slugificar(filtro.busca)
  return vendas.filter((v) => {
    if (filtro.mes !== 'todas' && v.vendidaEm.slice(0, 7) !== filtro.mes) return false
    if (!termo) return true
    const alvo = slugificar(
      `${v.marca} ${v.modelo} ${v.ano} ${v.comprador ?? ''} ${v.telefone ?? ''}`,
    )
    return alvo.includes(termo)
  })
}

/** Rótulo do mês '2026-01' em 'jan/2026', para cabeçalho e gráfico. */
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function rotuloMes(yyyyMm: string): string {
  const [ano, mes] = yyyyMm.split('-').map(Number)
  if (!ano || !mes || mes < 1 || mes > 12) return yyyyMm
  return `${MESES[mes - 1]}/${ano}`
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
