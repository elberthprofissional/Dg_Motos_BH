/**
 * Horários da loja em duas formas:
 *
 * - `FaixaHorario[]` é o que o site e o banco guardam: rótulos livres,
 *   como "Seg a Sex" e "9h–18h".
 * - `DiaSemana[]` é o que o painel edita: sete dias fixos, cada um aberto
 *   ou fechado.
 *
 * A conversão é conservadora: se um rótulo não puder ser entendido (por
 * exemplo "Feriados" ou dois intervalos no mesmo dia), `lerSemana`
 * devolve `null` e o painel mantém o editor por faixas, sem perder texto.
 */

export interface FaixaHorario {
  dias: string
  horas: string
}

export interface DiaSemana {
  aberto: boolean
  abre: string
  fecha: string
}

export const DIAS_SEMANA = [
  { curto: 'Seg', nome: 'segunda-feira' },
  { curto: 'Ter', nome: 'terça-feira' },
  { curto: 'Qua', nome: 'quarta-feira' },
  { curto: 'Qui', nome: 'quinta-feira' },
  { curto: 'Sex', nome: 'sexta-feira' },
  { curto: 'Sáb', nome: 'sábado' },
  { curto: 'Dom', nome: 'domingo' },
] as const

const TOKENS: [RegExp, number][] = [
  [/^dom/, 6],
  [/^seg/, 0],
  [/^ter/, 1],
  [/^qua/, 2],
  [/^qui/, 3],
  [/^sex/, 4],
  [/^sab/, 5],
]

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function indiceDoToken(token: string): number | null {
  for (const [padrao, indice] of TOKENS) {
    if (padrao.test(token)) return indice
  }
  return null
}

function horaValida(hora: string, minuto?: string): string | null {
  const h = Number(hora)
  const m = minuto ? Number(minuto) : 0
  if (!Number.isInteger(h) || h < 0 || h > 23) return null
  if (!Number.isInteger(m) || m < 0 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "Seg a Sex", "segunda à sexta", "Seg, Qua e Sex", "fim de semana"… */
export function lerDias(texto: string): number[] | null {
  const normal = normalizarTexto(texto)
  if (!normal) return null

  if (/\btodos os dias\b/.test(normal)) {
    return normal.includes('uteis') ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6]
  }
  if (/\bdias uteis\b/.test(normal)) return [0, 1, 2, 3, 4]
  if (/\bfim de semana\b/.test(normal)) return [5, 6]

  const dias = new Set<number>()
  const intervalo = normal.match(
    /\b(dom|seg|ter|qua|qui|sex|sab)\w*\s*(?:as|ate|a|–|—|-)\s*(dom|seg|ter|qua|qui|sex|sab)\w*/,
  )

  if (intervalo) {
    const inicio = indiceDoToken(intervalo[1])
    const fim = indiceDoToken(intervalo[2])
    if (inicio === null || fim === null || fim < inicio) return null
    for (let dia = inicio; dia <= fim; dia += 1) dias.add(dia)

    const resto = normal.replace(intervalo[0], ' ')
    for (const token of resto.matchAll(/\b(dom|seg|ter|qua|qui|sex|sab)\w*/g)) {
      const indice = indiceDoToken(token[1])
      if (indice === null) return null
      dias.add(indice)
    }
  } else {
    for (const token of normal.matchAll(/\b(dom|seg|ter|qua|qui|sex|sab)\w*/g)) {
      const indice = indiceDoToken(token[1])
      if (indice === null) return null
      dias.add(indice)
    }
  }

  return dias.size > 0 ? [...dias].sort((a, b) => a - b) : null
}

/**
 * "9h–18h", "09:00 às 18:00" ou uma metade só ("9h–") enquanto o dono
 * digita. Devolve `null` para formatos que não dá para representar sem
 * perder informação, como dois intervalos no mesmo dia.
 */
export function lerHoras(texto: string): { abre: string; fecha: string } | null {
  const valor = texto.trim().toLowerCase()
  if (!valor) return { abre: '', fecha: '' }

  const encontrado = valor.match(
    /^(?:(?:das?|de)\s+)?(\d{1,2})?(?:\s*[:h]\s*(\d{2}))?\s*h?\s*(?:–|—|-|às|as|até|ate|a)\s*(\d{1,2})?(?:\s*[:h]\s*(\d{2}))?\s*h?$/,
  )
  if (!encontrado) return null
  if (!encontrado[1] && !encontrado[3]) return { abre: '', fecha: '' }

  const abre = encontrado[1] ? horaValida(encontrado[1], encontrado[2]) : ''
  const fecha = encontrado[3] ? horaValida(encontrado[3], encontrado[4]) : ''
  if (abre === null || fecha === null) return null
  return { abre, fecha }
}

export function formatarHora(hora: string): string {
  const [h, m] = hora.split(':')
  return m && m !== '00' ? `${Number(h)}h${m}` : `${Number(h)}h`
}

function rotuloDias(inicio: number, fim: number): string {
  if (inicio === fim) return DIAS_SEMANA[inicio].curto
  return `${DIAS_SEMANA[inicio].curto} ${fim === inicio + 1 ? 'e' : 'a'} ${DIAS_SEMANA[fim].curto}`
}

/** Converte as faixas guardadas para a semana do painel. */
export function lerSemana(faixas: FaixaHorario[]): DiaSemana[] | null {
  const semana: DiaSemana[] = DIAS_SEMANA.map(() => ({
    aberto: false,
    abre: '09:00',
    fecha: '18:00',
  }))
  const vistos = new Set<number>()

  for (const faixa of faixas) {
    const dias = lerDias(faixa.dias)
    if (!dias) return null
    const horas = lerHoras(faixa.horas)
    if (!horas) return null

    for (const indice of dias) {
      if (vistos.has(indice)) return null
      vistos.add(indice)
      semana[indice] = { aberto: true, abre: horas.abre, fecha: horas.fecha }
    }
  }

  return semana
}

function mesmaHora(a: DiaSemana, b: DiaSemana): boolean {
  return a.abre === b.abre && a.fecha === b.fecha
}

function horasDaFaixa(dia: DiaSemana): string {
  if (!dia.abre && !dia.fecha) return ''
  return `${dia.abre ? formatarHora(dia.abre) : ''}–${dia.fecha ? formatarHora(dia.fecha) : ''}`
}

/** Junta dias seguidos com o mesmo horário em uma faixa. */
export function semanaParaFaixas(semana: DiaSemana[]): FaixaHorario[] {
  const faixas: FaixaHorario[] = []
  let indice = 0

  while (indice < DIAS_SEMANA.length) {
    const dia = semana[indice]
    if (!dia.aberto) {
      indice += 1
      continue
    }

    let fim = indice
    while (
      fim + 1 < semana.length &&
      semana[fim + 1].aberto &&
      mesmaHora(semana[fim + 1], dia)
    ) {
      fim += 1
    }

    faixas.push({ dias: rotuloDias(indice, fim), horas: horasDaFaixa(dia) })
    indice = fim + 1
  }

  return faixas
}
