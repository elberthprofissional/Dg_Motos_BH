import { describe, expect, it } from 'vitest'
import type { Motorcycle } from '../types'
import type { Lead } from './leads'
import {
  camposLead,
  contarLeadsRecentes,
  contarPorStatus,
  filtrarEstoque,
  filtrarLeads,
  formatarValorLead,
  resumirEstoque,
  rotuloCampoLead,
  rotuloOrigemLead,
  rotuloTipoLead,
  tempoRelativo,
} from './painel'

function moto(over: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 'uuid-1',
    slug: 'honda-xre-300-2021',
    marca: 'Honda',
    modelo: 'XRE 300',
    ano: 2021,
    preco: 31_900,
    quilometragem: 12_000,
    cilindrada: 291,
    categoria: 'Trail',
    descricao: '',
    especificacoes: [],
    imagens: [],
    destaque: false,
    disponibilidade: 'disponivel',
    ...over,
  }
}

function lead(over: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    tipo: 'financiamento',
    nome: 'João Silva',
    telefone: '31988887777',
    dados: {},
    origem: '/financiamento',
    criado_em: '2026-10-01T12:00:00.000Z',
    ...over,
  }
}

const AGORA = new Date('2026-10-02T12:00:00.000Z')

describe('resumirEstoque', () => {
  it('soma só as motos disponíveis no valor à venda', () => {
    const r = resumirEstoque([
      moto({ preco: 10_000 }),
      moto({ id: 'uuid-2', preco: 20_000, disponibilidade: 'vendida' }),
      moto({ id: 'uuid-3', preco: 30_000, disponibilidade: 'disponivel' }),
    ])
    expect(r.valorDisponivel).toBe(40_000)
    expect(r.valorTotal).toBe(60_000)
  })

  it('separa reservada de vendida na contagem por status', () => {
    const r = resumirEstoque([
      moto({ disponibilidade: 'disponivel' }),
      moto({ id: 'uuid-2', disponibilidade: 'reservada' }),
      moto({ id: 'uuid-3', disponibilidade: 'vendida' }),
      moto({ id: 'uuid-4', disponibilidade: 'vendida' }),
    ])
    expect(contarPorStatus(r, 'disponivel')).toBe(1)
    expect(contarPorStatus(r, 'reservada')).toBe(1)
    expect(contarPorStatus(r, 'vendida')).toBe(2)
    expect(r.total).toBe(4)
  })

  it('não quebra com estoque vazio', () => {
    expect(resumirEstoque([])).toEqual({
      total: 0,
      disponiveis: 0,
      reservadas: 0,
      vendidas: 0,
      valorDisponivel: 0,
      valorTotal: 0,
    })
  })
})

describe('contarLeadsRecentes', () => {
  it('conta só a janela pedida', () => {
    const leads = [
      lead({ id: 'a', criado_em: '2026-10-01T12:00:00.000Z' }), // 1 dia
      lead({ id: 'b', criado_em: '2026-09-20T12:00:00.000Z' }), // 12 dias
      lead({ id: 'c', criado_em: '2026-01-01T12:00:00.000Z' }), // antigo
    ]
    expect(contarLeadsRecentes(leads, 30, AGORA)).toBe(2)
  })

  it('ignora data corrompida em vez de contar errado', () => {
    expect(contarLeadsRecentes([lead({ criado_em: 'não é data' })], 30, AGORA)).toBe(0)
  })
})

describe('tempoRelativo', () => {
  it('escala de minutos a anos, no singular certo', () => {
    expect(tempoRelativo('2026-10-02T11:59:40.000Z', AGORA)).toBe('agora')
    expect(tempoRelativo('2026-10-02T11:30:00.000Z', AGORA)).toBe('há 30 min')
    expect(tempoRelativo('2026-10-02T09:00:00.000Z', AGORA)).toBe('há 3 h')
    expect(tempoRelativo('2026-10-01T12:00:00.000Z', AGORA)).toBe('há 1 dia')
    expect(tempoRelativo('2026-09-27T12:00:00.000Z', AGORA)).toBe('há 5 dias')
    expect(tempoRelativo('2026-08-18T12:00:00.000Z', AGORA)).toBe('há 1 mês')
    expect(tempoRelativo('2025-10-02T12:00:00.000Z', AGORA)).toBe('há 1 ano')
  })

  it('pula de mês para ano sem mostrar "12 meses"', () => {
    expect(tempoRelativo('2025-08-02T12:00:00.000Z', AGORA)).toBe('há 1 ano')
    expect(tempoRelativo('2023-10-02T12:00:00.000Z', AGORA)).toBe('há 3 anos')
  })

  it('avisa quando a data não existe', () => {
    expect(tempoRelativo('lixo', AGORA)).toBe('data inválida')
  })
})

describe('filtrarEstoque', () => {
  const estoque = [
    moto(),
    moto({ id: 'uuid-2', slug: 'yamaha-fazer-250-2020', marca: 'Yamaha', modelo: 'Fazer 250', ano: 2020 }),
    moto({ id: 'uuid-3', slug: 'cg-160-2019', marca: 'Honda', modelo: 'CG 160', ano: 2019, disponibilidade: 'vendida' }),
  ]

  it('busca sem diferenciar acento ou maiúscula', () => {
    expect(filtrarEstoque(estoque, { busca: 'xre', disponibilidade: 'todas' })).toHaveLength(1)
    expect(filtrarEstoque(estoque, { busca: 'FAZER', disponibilidade: 'todas' })[0].modelo).toBe(
      'Fazer 250',
    )
  })

  it('combina busca com status', () => {
    const r = filtrarEstoque(estoque, { busca: 'honda', disponibilidade: 'disponivel' })
    expect(r.map((m) => m.modelo)).toEqual(['XRE 300'])
  })

  it('devolve tudo quando não há filtro', () => {
    expect(filtrarEstoque(estoque, { busca: '   ', disponibilidade: 'todas' })).toHaveLength(3)
  })

  it('filtra só por status quando a busca está vazia', () => {
    const r = filtrarEstoque(estoque, { busca: '', disponibilidade: 'vendida' })
    expect(r.map((m) => m.modelo)).toEqual(['CG 160'])
  })
})

describe('filtrarLeads', () => {
  const leads = [
    lead(),
    lead({ id: 'l2', tipo: 'troca', nome: 'Ana Souza', telefone: '31977776666', origem: '/troca' }),
  ]

  it('filtra por tipo e por texto', () => {
    expect(filtrarLeads(leads, '', 'troca')).toHaveLength(1)
    expect(filtrarLeads(leads, 'ana', 'todas')[0].nome).toBe('Ana Souza')
    expect(filtrarLeads(leads, '3197777', 'todas')[0].nome).toBe('Ana Souza')
  })

  it('não devolve lead que não bate nos dois filtros', () => {
    expect(filtrarLeads(leads, 'ana', 'financiamento')).toHaveLength(0)
  })
})

describe('rótulos de lead', () => {
  it('traduz tipo e origem do formulário público', () => {
    expect(rotuloTipoLead('financiamento')).toBe('Financiamento')
    expect(rotuloTipoLead('troca')).toBe('Troca')
    expect(rotuloOrigemLead('/troca')).toBe('Formulário de troca')
  })

  it('não some com tipo ou origem desconhecidos', () => {
    expect(rotuloTipoLead('indecisao')).toBe('indecisao')
    expect(rotuloOrigemLead('/promocao')).toBe('/promocao')
    expect(rotuloOrigemLead(null)).toBe('Origem não registrada')
  })

  it('traduz a chave camelCase sem inventar campo', () => {
    expect(rotuloCampoLead('moto')).toBe('Motocicleta')
    expect(rotuloCampoLead('valorPretendido')).toBe('Valor pretendido')
    expect(rotuloCampoLead('campoDoFuturo')).toBe('campo Do Futuro')
  })
})

describe('formatarValorLead', () => {
  // O Intl pt-BR separa "R$" do número com espaço não separável (U+00A0).
  // Normalizar evita escrever um caractere invisível no teste.
  const brl = (texto: string) => texto.replace(/\u00a0/g, ' ')

  it('formata dinheiro e quilometragem conforme o campo', () => {
    expect(brl(formatarValorLead('entrada', 5000))).toBe('R$ 5.000')
    expect(brl(formatarValorLead('valorPretendido', '32500'))).toBe('R$ 32.500')
    expect(formatarValorLead('quilometragem', 12000)).toBe('12.000 km')
  })

  it('usa travessão para campo vazio em vez de "undefined"', () => {
    expect(formatarValorLead('observacoes', null)).toBe('—')
    expect(formatarValorLead('entrada', '')).toBe('—')
  })

  it('mantém texto livre como texto', () => {
    expect(formatarValorLead('estadoGeral', 'Bem revisada')).toBe('Bem revisada')
  })

  it('monta as linhas do detalhe já formatadas', () => {
    const linhas = camposLead({ moto: 'Honda XRE 300 2021', entrada: 5000, observacoes: null }).map(
      (linha) => ({ ...linha, valor: brl(linha.valor) }),
    )
    expect(linhas).toEqual([
      { chave: 'moto', rotulo: 'Motocicleta', valor: 'Honda XRE 300 2021' },
      { chave: 'entrada', rotulo: 'Entrada', valor: 'R$ 5.000' },
      { chave: 'observacoes', rotulo: 'Observações', valor: '—' },
    ])
  })
})
/* ======================= CRM / FINANCEIRO / RELATÓRIOS ======================= */

import {
  conversaoLeads,
  filtrarLeadsPorStatus,
  linhaCsvLead,
  leadsPorSemana,
  motoDoLead,
  resumoFinanceiro,
  ROTULO_STATUS_LEAD,
  ticketMedio,
  tempoMedioVenda,
  vendasPorCategoria,
} from './painel'

describe('filtrarLeadsPorStatus', () => {
  it('filtra pelo status e devolve todos quando "todos"', () => {
    const lista = [
      lead({ id: 'a' }),
      lead({ id: 'b', status: 'negociando' }),
      lead({ id: 'c', status: 'fechado' }),
    ]
    expect(filtrarLeadsPorStatus(lista, 'todos')).toHaveLength(3)
    expect(filtrarLeadsPorStatus(lista, 'novo')).toHaveLength(1)
    expect(filtrarLeadsPorStatus(lista, 'fechado')).toEqual([lista[2]])
  })

  it('lead sem coluna status (base antiga) conta como novo', () => {
    expect(filtrarLeadsPorStatus([lead({ status: null })], 'novo')).toHaveLength(1)
  })
})

describe('motoDoLead', () => {
  const estoque = [
    moto({ slug: 'honda-xre-300-2021' }),
    moto({ id: 'uuid-2', slug: 'honda-titan-2022', modelo: 'Titan', ano: 2022 }),
  ]

  it('liga o lead à moto pelo texto do formulário', () => {
    const l = lead({ dados: { moto: 'Honda XRE 300 2021' } })
    expect(motoDoLead(l, estoque)?.slug).toBe('honda-xre-300-2021')
  })

  it('tolera acento e maiúscula/minúscula', () => {
    const l = lead({ dados: { moto: 'honda titan 2022' } })
    expect(motoDoLead(l, estoque)?.modelo).toBe('Titan')
  })

  it('devolve null quando não bate ou não veio moto', () => {
    expect(motoDoLead(lead({ dados: {} }), estoque)).toBeNull()
    expect(motoDoLead(lead({ dados: { moto: 'Biz 110i' } }), estoque)).toBeNull()
  })
})

describe('linhaCsvLead', () => {
  it('usa rótulos legíveis e data pt-BR', () => {
    const l = lead({ status: 'fechado', nota: '  fecha\nna terça  ' })
    const linha = linhaCsvLead(l)
    expect(linha.status).toBe(ROTULO_STATUS_LEAD.fechado)
    expect(linha.nota).toBe('fecha na terça')
    expect(linha.criadoEm).toMatch(/01\/10\/2026/)
  })
})

describe('resumoFinanceiro', () => {
  it('agrupa vendas por mês com custo e lucro', () => {
    const vendidas = [
      moto({ id: 'v1', disponibilidade: 'vendida', preco: 20_000, precoCompra: 15_000, vendidoEm: '2026-09-10T10:00:00Z', criadoEm: '2026-08-01T10:00:00Z' }),
      moto({ id: 'v2', disponibilidade: 'vendida', preco: 30_000, precoCompra: 22_000, vendidoEm: '2026-09-25T10:00:00Z', criadoEm: '2026-08-02T10:00:00Z' }),
      moto({ id: 'v3', disponibilidade: 'vendida', preco: 10_000, precoCompra: 8_000, vendidoEm: '2026-10-01T10:00:00Z', criadoEm: '2026-09-01T10:00:00Z' }),
    ]
    const meses = resumoFinanceiro(vendidas)
    expect(meses).toHaveLength(2)
    const set = meses.find((m) => m.mes === '2026-09')
    expect(set?.vendas).toBe(2)
    expect(set?.faturamento).toBe(50_000)
    expect(set?.custo).toBe(37_000)
    expect(set?.lucro).toBe(13_000)
  })

  it('ignora disponíveis e vendidas sem data', () => {
    const lista = [
      moto({ disponibilidade: 'disponivel', vendidoEm: '2026-09-01T10:00:00Z' }),
      moto({ id: 'v2', disponibilidade: 'vendida' }),
    ]
    expect(resumoFinanceiro(lista)).toEqual([])
  })
})

describe('ticketMedio', () => {
  it('média das vendas com data; zero sem vendas', () => {
    const lista = [
      moto({ disponibilidade: 'vendida', preco: 20_000, vendidoEm: '2026-09-01T10:00:00Z' }),
      moto({ id: 'v2', disponibilidade: 'vendida', preco: 30_000, vendidoEm: '2026-09-02T10:00:00Z' }),
      moto({ id: 'v3', disponibilidade: 'vendida', preco: 99_000 }),
    ]
    expect(ticketMedio(lista)).toBe(25_000)
    expect(ticketMedio([])).toBe(0)
  })
})

describe('leadsPorSemana', () => {
  it('devolve 8 semanas com as vazias incluídas', () => {
    const pontos = leadsPorSemana([lead()], 8, AGORA)
    expect(pontos).toHaveLength(8)
    expect(pontos.reduce((s, p) => s + p.leads, 0)).toBe(1)
  })

  it('agrupa leads da mesma semana', () => {
    const pontos = leadsPorSemana([lead(), lead({ id: 'b' }), lead({ id: 'c', criado_em: '2026-09-15T10:00:00Z' })], 8, AGORA)
    const atual = pontos[pontos.length - 1]
    expect(atual.leads).toBe(2)
  })
})

describe('tempoMedioVenda', () => {
  it('média de dias entre cadastro e venda', () => {
    const lista = [
      moto({ disponibilidade: 'vendida', criadoEm: '2026-08-01T10:00:00Z', vendidoEm: '2026-08-31T10:00:00Z' }),
      moto({ id: 'v2', disponibilidade: 'vendida', criadoEm: '2026-08-01T10:00:00Z', vendidoEm: '2026-08-11T10:00:00Z' }),
    ]
    expect(tempoMedioVenda(lista)).toBe(20)
  })

  it('null sem vendas datadas', () => {
    expect(tempoMedioVenda([moto()])).toBeNull()
  })
})

describe('vendasPorCategoria e conversaoLeads', () => {
  it('ordena categorias por vendas', () => {
    const lista = [
      moto({ disponibilidade: 'vendida', categoria: 'Trail', vendidoEm: '2026-09-01T10:00:00Z' }),
      moto({ id: 'v2', disponibilidade: 'vendida', categoria: 'Trail', vendidoEm: '2026-09-02T10:00:00Z' }),
      moto({ id: 'v3', disponibilidade: 'vendida', categoria: 'Street', vendidoEm: '2026-09-03T10:00:00Z' }),
    ]
    expect(vendasPorCategoria(lista)[0]).toEqual({ categoria: 'Trail', vendas: 2 })
  })

  it('conversão = fechados / total', () => {
    const lista = [lead(), lead({ id: 'b', status: 'fechado' }), lead({ id: 'c', status: 'negociando' })]
    expect(conversaoLeads(lista)).toBe(33)
    expect(conversaoLeads([])).toBeNull()
  })
})
