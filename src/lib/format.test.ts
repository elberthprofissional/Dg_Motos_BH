import { describe, expect, it } from 'vitest'
import {
  bikeTitle,
  buildBikeMessage,
  buildDefaultMessage,
  formatarNumeroBR,
  formatKm,
  formatPrice,
  parseNumeroBR,
  precoPareceIncompleto,
  precoRequerConfirmacao,
} from './format'
import { autoDealerSchema, vehicleSchema } from './schema'
import { motorcycles } from '../data/motorcycles'

describe('formatPrice', () => {
  it('formata em reais sem centavos', () => {
    expect(formatPrice(31900)).toContain('31.900,00')
  })

  it('preserva casas decimais cadastradas no preço', () => {
    expect(formatPrice(31900.5)).toContain('31.900,50')
  })

  it('formata zero corretamente', () => {
    expect(formatPrice(0)).toBe('R$ 0,00')
  })
  it('formata preços altos com separadores e centavos brasileiros', () => {
    expect(formatPrice(15000000)).toContain('15.000.000,00')
  })

  it('sinaliza valores fora da faixa para confirmação sem alterar o preço', () => {
    expect(precoRequerConfirmacao(15000000)).toBe(true)
    expect(precoRequerConfirmacao(31900)).toBe(false)
    expect(formatPrice(15000000)).toContain('15.000.000,00')
  })
})

describe('parseNumeroBR', () => {
  it('lê milhar com ponto como o dono digita', () => {
    expect(parseNumeroBR('23.000')).toBe(23000)
    expect(parseNumeroBR('R$ 23.000')).toBe(23000)
    expect(parseNumeroBR('23.000,50')).toBe(23000.5)
    expect(parseNumeroBR('1.234.567,89')).toBe(1234567.89)
  })

  it('lê "23 mil" e "1,5 milhão"', () => {
    expect(parseNumeroBR('23 mil')).toBe(23000)
    expect(parseNumeroBR('R$ 32,5 mil')).toBe(32500)
    expect(parseNumeroBR('1,5 milhão')).toBe(1500000)
  })

  it('mantém decimal com ponto quando não é grupo de milhar', () => {
    expect(parseNumeroBR('291.6')).toBe(291.6)
    expect(parseNumeroBR('291,6')).toBe(291.6)
  })

  it('rejeita texto sem número', () => {
    expect(parseNumeroBR('')).toBeNull()
    expect(parseNumeroBR('abc')).toBeNull()
    expect(parseNumeroBR('23.00.00')).toBeNull()
    expect(parseNumeroBR('23,,5')).toBeNull()
  })

  it('formata de volta para edição sem perder centavos', () => {
    expect(formatarNumeroBR(23000)).toBe('23.000')
    expect(formatarNumeroBR(23000.5)).toBe('23.000,5')
    expect(parseNumeroBR(formatarNumeroBR(23000.5))).toBe(23000.5)
  })

  it('sinaliza preço que provavelmente perdeu um zero', () => {
    expect(precoPareceIncompleto(23)).toBe(true)
    expect(precoPareceIncompleto(0)).toBe(true)
    expect(precoPareceIncompleto(23000)).toBe(false)
  })
})

describe('formatKm', () => {
  it('mostra aviso quando a quilometragem não foi confirmada', () => {
    expect(formatKm(null)).toBe('Km a confirmar')
  })

  it('formata a quilometragem com separador de milhar', () => {
    expect(formatKm(32500)).toBe('32.500 km')
  })

  it('aceita zero como valor válido', () => {
    expect(formatKm(0)).toBe('0 km')
  })
})

describe('mensagens de WhatsApp', () => {
  it('a mensagem da moto cita marca, modelo e ano', () => {
    const msg = buildBikeMessage('Honda', 'XRE 300', 2021)
    expect(msg).toContain('Honda')
    expect(msg).toContain('XRE 300')
    expect(msg).toContain('2021')
  })

  it('a mensagem geral menciona a loja', () => {
    expect(buildDefaultMessage()).toContain('DG Motos')
  })
  it('não repete a marca quando o modelo já começa com ela', () => {
    const bike = { ...motorcycles[3], modelo: 'HondaHonda CG 160 Start' }
    expect(bikeTitle(bike)).toBe('Honda CG 160 Start')
    expect(buildBikeMessage('Honda', bike.modelo, bike.ano)).toContain('Honda CG 160 Start')
  })
})

describe('autoDealerSchema', () => {
  const schema = autoDealerSchema() as Record<string, unknown>

  it('é um AutoDealer válido', () => {
    expect(schema['@type']).toBe('AutoDealer')
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('declara endereço com país', () => {
    const endereco = schema.address as Record<string, unknown>
    expect(endereco.addressCountry).toBe('BR')
    expect(endereco.streetAddress).toBeTruthy()
  })

  it('declara coordenadas geográficas numéricas', () => {
    const geo = schema.geo as Record<string, number>
    expect(typeof geo.latitude).toBe('number')
    expect(typeof geo.longitude).toBe('number')
  })
})

describe('vehicleSchema', () => {
  const bike = motorcycles[0]

  it('descreve a moto com oferta em reais', () => {
    const schema = vehicleSchema(bike) as Record<string, unknown>
    const offer = schema.offers as Record<string, unknown>
    expect(schema.name).toContain(bike.marca)
    expect(offer.price).toBe(bike.preco)
    expect(offer.priceCurrency).toBe('BRL')
  })

  it('não duplica a marca no nome estruturado se o modelo já a inclui', () => {
    const schema = vehicleSchema({ ...bike, modelo: 'HondaHonda CG 160 Start' }) as Record<string, unknown>
    expect(schema.name).toBe(`Honda CG 160 Start ${bike.ano}`)
    expect(schema.model).toBe('CG 160 Start')
  })

  it('não publica preço fora da faixa como oferta estruturada até confirmação', () => {
    const schema = vehicleSchema({ ...bike, preco: 15000000 }) as Record<string, unknown>
    const offer = schema.offers as Record<string, unknown>
    expect(offer.price).toBeUndefined()
  })

  it('marca motos seminovas como usadas', () => {
    const schema = vehicleSchema(bike) as Record<string, unknown>
    const offer = schema.offers as Record<string, string>
    expect(offer.itemCondition).toContain('UsedCondition')
  })

  it('omite quilometragem quando não confirmada', () => {
    const semKm = { ...bike, quilometragem: null }
    const schema = vehicleSchema(semKm) as Record<string, unknown>
    expect(schema.mileageFromOdometer).toBeUndefined()
  })

  it('inclui quilometragem quando informada', () => {
    const schema = vehicleSchema({ ...bike, quilometragem: 32500 }) as Record<string, unknown>
    expect(schema.mileageFromOdometer).toBeTruthy()
  })

  it('marca como esgotada a moto que não está disponível', () => {
    const schema = vehicleSchema({ ...bike, status: 'indisponivel' }) as Record<string, unknown>
    const offer = schema.offers as Record<string, string>
    expect(offer.availability).toContain('SoldOut')
  })

  it('é serializável em JSON (vai para o <head>)', () => {
    expect(() => JSON.stringify(vehicleSchema(bike))).not.toThrow()
  })
})
