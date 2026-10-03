import { describe, expect, it } from 'vitest'
import { buildBikeMessage, buildDefaultMessage, formatKm, formatPrice } from './format'
import { autoDealerSchema, vehicleSchema } from './schema'
import { motorcycles } from '../data/motorcycles'

describe('formatPrice', () => {
  it('formata em reais sem centavos', () => {
    expect(formatPrice(31900)).toContain('31.900')
  })

  it('formata zero corretamente', () => {
    expect(formatPrice(0)).toBe('R$ 0')
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
    const schema = vehicleSchema({ ...bike, disponibilidade: 'reservada' }) as Record<string, unknown>
    const offer = schema.offers as Record<string, string>
    expect(offer.availability).toContain('SoldOut')
  })

  it('é serializável em JSON (vai para o <head>)', () => {
    expect(() => JSON.stringify(vehicleSchema(bike))).not.toThrow()
  })
})