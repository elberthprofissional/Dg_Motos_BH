import type { Motorcycle, MotorcycleAvailability } from '../types'
import { slugificar } from './catalog'
import type { Lead, LeadStatus } from './leads'
import { statusDoLead } from './leads'

export interface ResumoEstoque {
  total: number
  disponiveis: number
  reservadas: number
  vendidas: number
  valorDisponivel: number
  /** Soma de todas as motos, vendors incluídas — base do patrimônio. */
  valorTotal: number
}

/**
 * Contagem e valor por status.
 *
 * `valorDisponivel` é o número que interessa a operação (quanto está a
 * venda agora); `valorTotal` responde quanto do estoque está preso em
 * moto reservada ou já vendida.
 */
export function resumirEstoque(motos: Motorcycle[]): ResumoEstoque {
  const por = (status: MotorcycleAvailability) => motos.filter((m) => m.disponibilidade === status)
  const disponiveis = por('disponivel')
  const reservadas = por('reservada')
  const vendidas = por('vendida')
  const soma = (lista: Motorcycle[]) => lista.reduce((total, m) => total + m.preco, 0)

  return {
    total: motos.length,
    disponiveis: disponiveis.length,
    reservadas: reservadas.length,
    vendidas: vendidas.length,
    valorDisponivel: soma(disponiveis),
    valorTotal: soma(motos),
  }
}

/** Status do estoque, na ordem em que aparecem em filtro e no resumo. */
export const STATUS_ESTOQUE = ['disponivel', 'reservada', 'vendida'] as const

export function contarPorStatus(resumo: ResumoEstoque, status: MotorcycleAvailability): number {
  if (status === 'disponivel') return resumo.disponiveis
  if (status === 'reservada') return resumo.reservadas
  return resumo.vendidas
}

const DIA_MS = 86_400_000

export function contarLeadsRecentes(leads: Lead[], dias: number, agora = new Date()): number {
  const limite = agora.getTime() - dias * DIA_MS
  return leads.filter((lead) => {
    const quando = Date.parse(lead.criado_em)
    return Number.isFinite(quando) && quando >= limite
  }).length
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
  disponibilidade: MotorcycleAvailability | 'todas'
}

export function filtrarEstoque(motos: Motorcycle[], filtro: FiltroEstoque): Motorcycle[] {
  const termo = slugificar(filtro.busca)

  return motos.filter((moto) => {
    if (filtro.disponibilidade !== 'todas' && moto.disponibilidade !== filtro.disponibilidade) {
      return false
    }
    if (!termo) return true

    const alvo = slugificar(
      `${moto.marca} ${moto.modelo} ${moto.ano} ${moto.categoria} ${moto.slug}`,
    )
    return alvo.includes(termo)
  })
}

export function filtrarLeads(leads: Lead[], busca: string, tipo: string): Lead[] {
  const termo = slugificar(busca)

  return leads.filter((lead) => {
    if (tipo !== 'todas' && lead.tipo !== tipo) return false
    if (!termo) return true

    const alvo = slugificar(`${lead.nome} ${lead.telefone} ${lead.origem ?? ''} ${lead.tipo}`)
    return alvo.includes(termo)
  })
}

/* ============================ RÓTULOS ============================
 *
 * O painel lia as chaves cruas do `dados` jsonb e aplicava `capitalize`,
 * o que imprimia "Moto_interesse" e "Estado_geral" na tela do dono.
 * Os mapas abaixo cobrem exatamente o que os formulários públicos
 * gravam (ver FinanciamentoForm e TrocaForm) — nada foi inventado.
 */

export const ROTULO_TIPO_LEAD: Record<string, string> = {
  financiamento: 'Financiamento',
  troca: 'Troca',
}

export const ROTULO_CAMPO_LEAD: Record<string, string> = {
  moto: 'Motocicleta',
  entrada: 'Entrada',
  quilometragem: 'Quilometragem',
  estadoGeral: 'Estado geral',
  valorPretendido: 'Valor pretendido',
  observacoes: 'Observações',
}

export const ROTULO_ORIGEM_LEAD: Record<string, string> = {
  '/financiamento': 'Formulário de financiamento',
  '/troca': 'Formulário de troca',
}

const CAMPOS_MONETARIOS = new Set(['entrada', 'valorPretendido'])

export function rotuloTipoLead(tipo: string): string {
  return ROTULO_TIPO_LEAD[tipo] ?? tipo
}

export function rotuloOrigemLead(origem: string | null): string {
  if (!origem) return 'Origem não registrada'
  return ROTULO_ORIGEM_LEAD[origem] ?? origem
}

/** Converte a chave crua em rótulo legível, sem inventar campo. */
export function rotuloCampoLead(chave: string): string {
  return ROTULO_CAMPO_LEAD[chave] ?? chave.replace(/([a-z])([A-Z])/g, '$1 $2')
}

/**
 * Formata o valor de um campo do lead conforme o que ele representa:
 * dinheiro em BRL, quilometragem em km, texto como texto. Vazio e null
 * viram "—", nunca "undefined" na tela.
 */
export function formatarValorLead(chave: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'

  const numero = typeof valor === 'number' ? valor : Number(String(valor).replace(/\./g, '').replace(',', '.'))

  if (CAMPOS_MONETARIOS.has(chave) && Number.isFinite(numero)) {
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  if (chave === 'quilometragem' && Number.isFinite(numero)) {
    return `${numero.toLocaleString('pt-BR')} km`
  }

  return String(valor)
}

/** Linhas prontas para o <dl> da tela de leads, na ordem em que aparecem. */
export function camposLead(dados: Record<string, unknown>): {
  chave: string
  rotulo: string
  valor: string
}[] {
  return Object.entries(dados).map(([chave, valor]) => ({
    chave,
    rotulo: rotuloCampoLead(chave),
    valor: formatarValorLead(chave, valor),
  }))
}

/* ============================ CRM ============================ */

export const ROTULO_STATUS_LEAD: Record<LeadStatus, string> = {
  novo: 'Novo',
  negociando: 'Em negociação',
  fechado: 'Fechou negócio',
  nao_fechou: 'Não fechou',
}

/** Variantes do Badge para cada status do CRM. */
export const VARIANTE_STATUS_LEAD: Record<LeadStatus, 'ok' | 'marca' | 'atencao' | 'apagado' | 'neutro'> = {
  novo: 'marca',
  negociando: 'atencao',
  fechado: 'ok',
  nao_fechou: 'apagado',
}

export function filtrarLeadsPorStatus(leads: Lead[], status: LeadStatus | 'todos'): Lead[] {
  if (status === 'todos') return leads
  return leads.filter((l) => statusDoLead(l) === status)
}

/**
 * Moto de interesse de um lead de financiamento.
 *
 * O formulário grava `dados.moto` como "Marca Modelo Ano". Para ligar o
 * lead à moto do estoque comparo normalizado (slugificar), tolerando
 * variação de acento/espaço. O ano vai junto para evitar falso positivo
 * entre "Titan 2022" e "Titan 2024".
 */
export function motoDoLead(lead: Lead, motos: Motorcycle[]): Motorcycle | null {
  const texto = typeof lead.dados?.moto === 'string' ? lead.dados.moto : ''
  if (!texto.trim()) return null
  const alvo = slugificar(texto)
  if (!alvo) return null
  return (
    motos.find((m) =>
      slugificar(`${m.marca} ${m.modelo} ${m.ano}`).includes(alvo) ||
      alvo.includes(slugificar(`${m.marca} ${m.modelo} ${m.ano}`)),
    ) ?? null
  )
}

/** Texto dos detalhes do lead + nota do dono, prontos para CSV. */
export function linhaCsvLead(lead: Lead): { nome: string; telefone: string; tipo: string; status: string; origem: string; criadoEm: string; nota: string } {
  return {
    nome: lead.nome,
    telefone: lead.telefone,
    tipo: rotuloTipoLead(lead.tipo),
    status: ROTULO_STATUS_LEAD[statusDoLead(lead)],
    origem: rotuloOrigemLead(lead.origem),
    criadoEm: Number.isFinite(Date.parse(lead.criado_em))
      ? new Date(lead.criado_em).toLocaleString('pt-BR')
      : '',
    nota: (lead.nota ?? '').replace(/\s+/g, ' ').trim(),
  }
}

/** Monta e baixa um CSV (puro browser: Blob + link temporário). */
export function baixarCsv(nomeArquivo: string, linhas: Record<string, string>[]): void {
  if (linhas.length === 0) return
  const cabecalho = Object.keys(linhas[0])
  const escapar = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  const csv =
    cabecalho.map(escapar).join(';') +
    '\n' +
    linhas.map((l) => cabecalho.map((c) => escapar(l[c] ?? '')).join(';')).join('\n')

  // \uFEFF (BOM) faz o Excel entender UTF-8 sem quebrar acentos.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

/* ========================= FINANCEIRO ========================= */

export interface LinhaMes {
  /** "2026-10" — chave do mês de referência da VENDA. */
  mes: string
  vendas: number
  faturamento: number
  custo: number
  /** faturamento − custo (motos sem preço de compra não somam custo). */
  lucro: number
}

/**
 * Agrupa as motos VENDIDAS por mês de `vendidoEm`.
 *
 * Sem preço de compra, o lucro da linha fica igual ao faturamento (e o
 * dono que não controla custo simplesmente lê "faturamento").
 */
export function resumoFinanceiro(motos: Motorcycle[]): LinhaMes[] {
  const meses = new Map<string, LinhaMes>()
  for (const m of motos) {
    if (m.disponibilidade !== 'vendida' || !m.vendidoEm) continue
    const data = new Date(m.vendidoEm)
    if (Number.isNaN(data.getTime())) continue
    const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
    const linha = meses.get(mes) ?? { mes, vendas: 0, faturamento: 0, custo: 0, lucro: 0 }
    linha.vendas += 1
    linha.faturamento += m.preco
    linha.custo += m.precoCompra ?? 0
    linha.lucro = linha.faturamento - linha.custo
    meses.set(mes, linha)
  }
  return [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes))
}

/** Ticket médio das vendas com data registrada. */
export function ticketMedio(motos: Motorcycle[]): number {
  const vendas = motos.filter((m) => m.disponibilidade === 'vendida' && m.vendidoEm)
  if (vendas.length === 0) return 0
  return Math.round(vendas.reduce((s, m) => s + m.preco, 0) / vendas.length)
}

/* ========================== RELATÓRIOS ========================== */

export interface PontoSemana {
  /** Rótulo curto ("12/09"); `iso` é o domingo da semana. */
  rotulo: string
  iso: string
  leads: number
}

/**
 * Leads por semana (domingo a sábado) das últimas N semanas,
 * incluindo semanas vazias — assim o gráfico mostra a real, sem buracos.
 */
export function leadsPorSemana(leads: Lead[], semanas = 8, agora = new Date()): PontoSemana[] {
  const pontos: PontoSemana[] = []
  const hoje = new Date(agora)
  hoje.setHours(0, 0, 0, 0)
  // Domingo da semana corrente (getDay: 0 = domingo).
  hoje.setDate(hoje.getDate() - hoje.getDay())

  for (let i = semanas - 1; i >= 0; i--) {
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - i * 7)
    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 7)

    const qtd = leads.filter((l) => {
      const quando = Date.parse(l.criado_em)
      return Number.isFinite(quando) && quando >= inicio.getTime() && quando < fim.getTime()
    }).length

    pontos.push({
      rotulo: inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      iso: inicio.toISOString(),
      leads: qtd,
    })
  }
  return pontos
}

/**
 * Tempo médio (em dias) entre cadastro e venda das motos vendidas
 * com as duas datas preenchidas.
 */
export function tempoMedioVenda(motos: Motorcycle[]): number | null {
  const dias: number[] = motos
    .filter((m) => m.disponibilidade === 'vendida' && m.vendidoEm && m.criadoEm)
    .map((m) => {
      const t = Date.parse(m.vendidoEm as string) - Date.parse(m.criadoEm as string)
      return Number.isFinite(t) ? Math.max(0, Math.round(t / 86_400_000)) : NaN
    })
    .filter((d) => !Number.isNaN(d))
  if (dias.length === 0) return null
  return Math.round(dias.reduce((s, d) => s + d, 0) / dias.length)
}

/** Vendas por categoria (para o relatório de demanda). */
export function vendasPorCategoria(motos: Motorcycle[]): { categoria: string; vendas: number }[] {
  const contagem = new Map<string, number>()
  for (const m of motos) {
    if (m.disponibilidade !== 'vendida') continue
    contagem.set(m.categoria, (contagem.get(m.categoria) ?? 0) + 1)
  }
  return [...contagem.entries()]
    .map(([categoria, vendas]) => ({ categoria, vendas }))
    .sort((a, b) => b.vendas - a.vendas)
}

/** Taxa de conversão: leads fechados / leads totais (%). */
export function conversaoLeads(leads: Lead[]): number | null {
  if (leads.length === 0) return null
  const fechados = leads.filter((l) => statusDoLead(l) === 'fechado').length
  return Math.round((fechados / leads.length) * 100)
}