import { describe, expect, it } from 'vitest'
import {
  DIAS_SEMANA,
  formatarHora,
  lerDias,
  lerHoras,
  lerSemana,
  semanaParaFaixas,
  type DiaSemana,
} from './horarios'

function semanaFechada(): DiaSemana[] {
  return DIAS_SEMANA.map(() => ({ aberto: false, abre: '', fecha: '' }))
}

describe('lerDias', () => {
  it('entende intervalo abreviado', () => {
    expect(lerDias('Seg a Sex')).toEqual([0, 1, 2, 3, 4])
  })

  it('entende nomes completos com acento', () => {
    expect(lerDias('segunda à sexta')).toEqual([0, 1, 2, 3, 4])
  })

  it('entende lista com “e”', () => {
    expect(lerDias('Seg, Qua e Sex')).toEqual([0, 2, 4])
  })

  it('entende fim de semana e todos os dias', () => {
    expect(lerDias('fim de semana')).toEqual([5, 6])
    expect(lerDias('todos os dias')).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(lerDias('dias úteis')).toEqual([0, 1, 2, 3, 4])
  })

  it('soma um dia avulso ao intervalo', () => {
    expect(lerDias('Seg a Sex e Sáb')).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('recusa rótulo desconhecido', () => {
    expect(lerDias('Feriados')).toBeNull()
  })
})

describe('lerHoras', () => {
  it('lê o formato publicado', () => {
    expect(lerHoras('9h–18h')).toEqual({ abre: '09:00', fecha: '18:00' })
  })

  it('lê horas com minutos e formatos alternativos', () => {
    expect(lerHoras('09:00 às 18:30')).toEqual({ abre: '09:00', fecha: '18:30' })
    expect(lerHoras('9h30-18h')).toEqual({ abre: '09:30', fecha: '18:00' })
    expect(lerHoras('das 8h às 12h')).toEqual({ abre: '08:00', fecha: '12:00' })
  })

  it('aceita metade preenchida durante a edição', () => {
    expect(lerHoras('9h–')).toEqual({ abre: '09:00', fecha: '' })
    expect(lerHoras('–18h')).toEqual({ abre: '', fecha: '18:00' })
    expect(lerHoras('')).toEqual({ abre: '', fecha: '' })
  })

  it('recusa dois intervalos no mesmo dia', () => {
    expect(lerHoras('9h–12h e 14h–18h')).toBeNull()
  })

  it('recusa hora fora do relógio', () => {
    expect(lerHoras('25h–18h')).toBeNull()
  })
})

describe('lerSemana', () => {
  it('converte o horário de fábrica', () => {
    const semana = lerSemana([
      { dias: 'Seg a Sex', horas: '9h–18h' },
      { dias: 'Sáb', horas: '9h–13h' },
    ])

    expect(semana).not.toBeNull()
    expect(semana?.[0]).toEqual({ aberto: true, abre: '09:00', fecha: '18:00' })
    expect(semana?.[4]).toEqual({ aberto: true, abre: '09:00', fecha: '18:00' })
    expect(semana?.[5]).toEqual({ aberto: true, abre: '09:00', fecha: '13:00' })
    expect(semana?.[6]).toEqual({ aberto: false, abre: '09:00', fecha: '18:00' })
  })

  it('mantém o editor de faixas quando não entende o texto', () => {
    expect(lerSemana([{ dias: 'Feriados', horas: '9h–12h' }])).toBeNull()
    expect(lerSemana([{ dias: 'Seg a Sex', horas: '9h–12h e 14h–18h' }])).toBeNull()
  })

  it('recusa o mesmo dia em duas faixas', () => {
    expect(
      lerSemana([
        { dias: 'Seg a Sex', horas: '9h–18h' },
        { dias: 'Sex', horas: '9h–13h' },
      ]),
    ).toBeNull()
  })
})

describe('semanaParaFaixas', () => {
  it('agrupa dias seguidos com o mesmo horário', () => {
    const semana = semanaFechada()
    for (const indice of [0, 1, 2, 3, 4]) {
      semana[indice] = { aberto: true, abre: '09:00', fecha: '18:00' }
    }
    semana[5] = { aberto: true, abre: '09:00', fecha: '13:00' }

    expect(semanaParaFaixas(semana)).toEqual([
      { dias: 'Seg a Sex', horas: '9h–18h' },
      { dias: 'Sáb', horas: '9h–13h' },
    ])
  })

  it('usa “e” para dois dias e mantém minutos', () => {
    const semana = semanaFechada()
    semana[5] = { aberto: true, abre: '09:00', fecha: '13:30' }
    semana[6] = { aberto: true, abre: '09:00', fecha: '13:30' }

    expect(semanaParaFaixas(semana)).toEqual([{ dias: 'Sáb e Dom', horas: '9h–13h30' }])
  })

  it('devolve lista vazia quando a loja está fechada a semana toda', () => {
    expect(semanaParaFaixas(semanaFechada())).toEqual([])
  })

  it('faz ida e volta com o horário de fábrica', () => {
    const faixas = [
      { dias: 'Seg a Sex', horas: '9h–18h' },
      { dias: 'Sáb', horas: '9h–13h' },
    ]
    const semana = lerSemana(faixas)
    expect(semana).not.toBeNull()
    expect(semanaParaFaixas(semana as DiaSemana[])).toEqual(faixas)
  })

  it('preserva meia faixa enquanto o dono digita', () => {
    const semana = semanaFechada()
    semana[0] = { aberto: true, abre: '09:00', fecha: '' }

    const faixas = semanaParaFaixas(semana)
    expect(faixas).toEqual([{ dias: 'Seg', horas: '9h–' }])
    expect(lerSemana(faixas)?.[0]).toEqual({ aberto: true, abre: '09:00', fecha: '' })
  })
})

describe('formatarHora', () => {
  it('mostra minuto só quando existe', () => {
    expect(formatarHora('09:00')).toBe('9h')
    expect(formatarHora('18:30')).toBe('18h30')
  })
})
