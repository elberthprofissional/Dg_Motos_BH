import { describe, expect, it } from 'vitest'
import {
  FINANCIAMENTO_PADRAO,
  financiamentoFormDeConfig,
  financiamentoFormParaJsonb,
  formFinanciamentoVazio,
  linhaParaFinanciamento,
  QTD_ETAPAS,
} from './financiamento'

describe('linhaParaFinanciamento', () => {
  it('devolve o padrão quando o jsonb é null ou malformado', () => {
    expect(linhaParaFinanciamento(null)).toEqual(FINANCIAMENTO_PADRAO)
    expect(linhaParaFinanciamento(undefined)).toEqual(FINANCIAMENTO_PADRAO)
    expect(linhaParaFinanciamento('lixo')).toEqual(FINANCIAMENTO_PADRAO)
    expect(linhaParaFinanciamento(42)).toEqual(FINANCIAMENTO_PADRAO)
    expect(linhaParaFinanciamento({})).toEqual(FINANCIAMENTO_PADRAO)
  })

  it('usa sempre 4 etapas, mesmo com lista curta no jsonb', () => {
    const c = linhaParaFinanciamento({
      etapas: [{ titulo: 'Só uma', texto: 'única' }],
    })
    expect(c.etapas).toHaveLength(QTD_ETAPAS)
    expect(c.etapas[0].titulo).toBe('Só uma')
    // Slots sem dados caem no padrão
    expect(c.etapas[1].titulo).toBe(FINANCIAMENTO_PADRAO.etapas[1].titulo)
    expect(c.etapas[3].texto).toBe(FINANCIAMENTO_PADRAO.etapas[3].texto)
  })

  it('campos em branco ou com tipos errados caem no padrão', () => {
    const c = linhaParaFinanciamento({
      titulo: '   ',
      subtitulo: 123,
      etapasTitulo: null,
      transparenciaItens: ['Item válido', 7, null, '   ', 'Outro válido'],
    })
    expect(c.titulo).toBe(FINANCIAMENTO_PADRAO.titulo)
    expect(c.subtitulo).toBe(FINANCIAMENTO_PADRAO.subtitulo)
    expect(c.etapasTitulo).toBe(FINANCIAMENTO_PADRAO.etapasTitulo)
    expect(c.transparenciaItens).toEqual(['Item válido', 'Outro válido'])
  })

  it('lista de transparência vazia volta para o padrão', () => {
    const c = linhaParaFinanciamento({ transparenciaItens: [] })
    expect(c.transparenciaItens).toEqual(FINANCIAMENTO_PADRAO.transparenciaItens)
  })

  it('sobrescreve todos os campos quando bem formado', () => {
    const c = linhaParaFinanciamento({
      titulo: 'Meu título',
      subtitulo: 'Meu subtítulo',
      etapasTitulo: 'Como rola',
      etapas: [
        { titulo: 'A', texto: 'a' },
        { titulo: 'B', texto: 'b' },
        { titulo: 'C', texto: 'c' },
        { titulo: 'D', texto: 'd' },
      ],
      transparenciaTitulo: 'Bom saber',
      transparenciaItens: ['Um', 'Dois'],
    })
    expect(c.titulo).toBe('Meu título')
    expect(c.subtitulo).toBe('Meu subtítulo')
    expect(c.etapasTitulo).toBe('Como rola')
    expect(c.etapas.map((e) => e.titulo)).toEqual(['A', 'B', 'C', 'D'])
    expect(c.transparenciaTitulo).toBe('Bom saber')
    expect(c.transparenciaItens).toEqual(['Um', 'Dois'])
  })
})

describe('formFinanciamentoVazio', () => {
  it('vem todo vazio, com 4 etapas', () => {
    const f = formFinanciamentoVazio()
    expect(f.titulo).toBe('')
    expect(f.etapas).toHaveLength(QTD_ETAPAS)
    expect(f.transparenciaItens).toBe('')
  })
})

describe('financiamentoFormDeConfig', () => {
  it('popula o formulário a partir da config', () => {
    const f = financiamentoFormDeConfig(FINANCIAMENTO_PADRAO)
    expect(f.titulo).toBe(FINANCIAMENTO_PADRAO.titulo)
    expect(f.etapas).toHaveLength(QTD_ETAPAS)
    expect(f.transparenciaItens).toBe(FINANCIAMENTO_PADRAO.transparenciaItens.join('\n'))
  })
})

describe('financiamentoFormParaJsonb', () => {
  it('faz ida e volta com o conteúdo do padrão', () => {
    const f = financiamentoFormDeConfig(FINANCIAMENTO_PADRAO)
    const jsonb = financiamentoFormParaJsonb(f)
    expect(linhaParaFinanciamento(jsonb)).toEqual(FINANCIAMENTO_PADRAO)
  })

  it('trim em tudo e descarta linhas vazias dos bullets', () => {
    const f = formFinanciamentoVazio()
    f.transparenciaItens = '  Um  \n\n  Dois \n\n\n'
    const jsonb = financiamentoFormParaJsonb(f)
    expect(jsonb.transparenciaItens).toEqual(['Um', 'Dois'])
    expect(jsonb.titulo).toBe('')
  })

  it('form vazio vira jsonb que recai no padrão ao ser lido', () => {
    const jsonb = financiamentoFormParaJsonb(formFinanciamentoVazio())
    expect(linhaParaFinanciamento(jsonb)).toEqual(FINANCIAMENTO_PADRAO)
  })
})
