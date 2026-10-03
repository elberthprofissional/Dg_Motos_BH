import { describe, expect, it } from 'vitest'
import { linhaParaConfig, validarFormConfig, whatsappUrlCom, configPadrao } from './configLoja'

describe('linhaParaConfig', () => {
  it('devolve os defaults quando a linha é null (banco vazio)', () => {
    const c = linhaParaConfig(null)
    const padrao = configPadrao()
    expect(c).toEqual(padrao)
  })

  it('sobrescreve apenas os campos preenchidos (config parcial)', () => {
    const c = linhaParaConfig({
      whatsapp: '5531999999999',
      instagram_handle: null,
      instagram_url: null,
      telefone_exibicao: null,
      endereco_rua: null,
      endereco_cidade_uf: null,
      maps_url: null,
      horarios: [],
      financiamento: null,
    })
    expect(c.whatsapp).toBe('5531999999999')
    // Instagram/endereço continuam do fallback
    expect(c.instagramHandle).toBe(configPadrao().instagramHandle)
    expect(c.enderecoRua).toBe(configPadrao().enderecoRua)
  })

  it('ignora strings em branco (só espaços) e mantém o default', () => {
    const c = linhaParaConfig({
      whatsapp: '   ',
      instagram_handle: '  ',
      instagram_url: '',
      telefone_exibicao: null,
      endereco_rua: '',
      endereco_cidade_uf: '  ',
      maps_url: '',
      horarios: [],
      financiamento: null,
    })
    expect(c.whatsapp).toBe(configPadrao().whatsapp)
    expect(c.instagramHandle).toBe(configPadrao().instagramHandle)
  })

  it('filtra horários malformados do jsonb', () => {
    const c = linhaParaConfig({
      whatsapp: null,
      instagram_handle: null,
      instagram_url: null,
      telefone_exibicao: null,
      endereco_rua: null,
      endereco_cidade_uf: null,
      maps_url: null,
      horarios: [
        { dias: 'Seg a Sex', horas: '08h às 18h' },
        { dias: 123, horas: 'xx' },
        null,
        { dias: 'Sáb' },
      ],
      financiamento: null,
    })
    expect(c.horarios).toEqual([{ dias: 'Seg a Sex', horas: '08h às 18h' }])
  })

  it('usa os horários do fallback quando o banco tem lista vazia', () => {
    const c = linhaParaConfig({
      whatsapp: null,
      instagram_handle: null,
      instagram_url: null,
      telefone_exibicao: null,
      endereco_rua: null,
      endereco_cidade_uf: null,
      maps_url: null,
      horarios: [],
      financiamento: null,
    })
    expect(c.horarios).toEqual(configPadrao().horarios)
  })
})

describe('validarFormConfig', () => {
  const base = {
    whatsapp: '',
    instagramHandle: '',
    instagramUrl: '',
    telefoneExibicao: '',
    enderecoRua: '',
    enderecoCidadeUf: '',
    mapsUrl: '',
  }

  it('aceita formulário vazio (tudo opcional)', () => {
    expect(validarFormConfig(base)).toBeNull()
  })

  it('aceita WhatsApp válido com DDI e DDD', () => {
    expect(validarFormConfig({ ...base, whatsapp: '5531987654321' })).toBeNull()
  })

  it('aceita WhatsApp com máscara, limpando para dígitos', () => {
    expect(validarFormConfig({ ...base, whatsapp: '(31) 98765-4321' })).toBeNull()
  })

  it('rejeita WhatsApp curto demais', () => {
    expect(validarFormConfig({ ...base, whatsapp: '3198765' })).toMatch(/WhatsApp/)
  })

  it('rejeita URL de Instagram que não seja do instagram.com', () => {
    expect(
      validarFormConfig({ ...base, instagramUrl: 'https://twitter.com/dgmotosbh' }),
    ).toMatch(/Instagram/)
  })

  it('aceita URL de Instagram válida', () => {
    expect(
      validarFormConfig({ ...base, instagramUrl: 'https://instagram.com/dgmotosbh' }),
    ).toBeNull()
  })
})

describe('whatsappUrlCom', () => {
  it('devolve null sem número (CTA cai para /contato)', () => {
    expect(whatsappUrlCom({ whatsapp: null })).toBeNull()
    expect(whatsappUrlCom({ whatsapp: '' })).toBeNull()
  })

  it('monta o link wa.me sem mensagem', () => {
    expect(whatsappUrlCom({ whatsapp: '5531987654321' })).toBe('https://wa.me/5531987654321')
  })

  it('monta o link wa.me com mensagem codificada', () => {
    const url = whatsappUrlCom({ whatsapp: '5531987654321' }, 'Olá, tudo bem?')
    expect(url).toBe('https://wa.me/5531987654321?text=Ol%C3%A1%2C%20tudo%20bem%3F')
  })
})
