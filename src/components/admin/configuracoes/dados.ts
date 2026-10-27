import { formatPrice } from '../../../lib/format'
import type { ConfigLoja } from '../../../lib/configLoja'

/**
 * Regras puras da mesa de configurações: validação, normalização e
 * mesclagem dos blocos. Sem React aqui — só dados.
 */

export type Secao = 'contato' | 'instagram' | 'endereco' | 'horarios' | 'lixeira'
export type SecaoConfig = Exclude<Secao, 'lixeira'>

export interface DescricaoSecao {
  id: Secao
  rotulo: string
  descricao: string
  campos: readonly (keyof ConfigLoja)[]
  resumo: (config: ConfigLoja, naLixeira: number, valorLixeira: number) => string
  rotuloSalvar?: string
  mensagemSalva?: string
}

export function formatarWhatsapp(numero: string | null): string {
  if (!numero) return 'Sem número'
  const digitos = numero.replace(/\D/g, '')

  if (digitos.startsWith('55') && digitos.length === 13) {
    return `+55 (${digitos.slice(2, 4)}) ${digitos.slice(4, 9)}-${digitos.slice(9)}`
  }
  if (digitos.startsWith('55') && digitos.length === 12) {
    return `+55 (${digitos.slice(2, 4)}) ${digitos.slice(4, 8)}-${digitos.slice(8)}`
  }
  return digitos ? `+${digitos}` : 'Sem número'
}

export function limparHandle(entrada: string): string {
  return entrada
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .split(/[?#]/)[0]
    .replace(/^@+/, '')
    .replace(/\/+$/, '')
    .trim()
}

export function handleComArroba(entrada: string): string {
  const limpo = limparHandle(entrada)
  return limpo ? `@${limpo}` : ''
}

export function urlDoHandle(entrada: string): string {
  const limpo = limparHandle(entrada)
  return limpo ? `https://instagram.com/${limpo}` : ''
}

export function validarWhatsapp(numero: string | null): string | null {
  if (!numero) return null
  const digitos = numero.replace(/\D/g, '')
  if (digitos.length < 12 || digitos.length > 15) {
    return 'Informe DDI + DDD + número, só dígitos. Ex.: 5531999999999.'
  }
  return null
}

export function validarHandle(entrada: string): string | null {
  const limpo = limparHandle(entrada)
  if (!limpo) return 'Informe o @ do perfil.'
  if (limpo.length > 30) return 'O @ do Instagram tem no máximo 30 caracteres.'
  if (!/^[a-zA-Z0-9._]+$/.test(limpo)) {
    return 'Use apenas letras, números, ponto e sublinhado — sem espaços.'
  }
  return null
}

export function errosDaSecao(secao: SecaoConfig, config: ConfigLoja): Record<string, string> {
  const erros: Record<string, string> = {}

  if (secao === 'contato') {
    const erro = validarWhatsapp(config.whatsapp)
    if (erro) erros.whatsapp = erro
  }

  if (secao === 'instagram') {
    const erro = validarHandle(config.instagramHandle)
    if (erro) erros.instagramHandle = erro
  }

  if (secao === 'endereco') {
    if (!config.enderecoRua.trim()) erros.enderecoRua = 'Informe a rua e o número.'
    if (!config.enderecoCidadeUf.trim()) erros.enderecoCidadeUf = 'Informe a cidade e o estado.'
  }

  if (secao === 'horarios') {
    const incompleta = config.horarios.some(
      (horario) => !horario.dias.trim() || !horario.horas.trim(),
    )
    if (incompleta) {
      erros.horarios =
        'Cada faixa precisa de dias e de horário. Preencha ou remova a linha em branco.'
    }
  }

  return erros
}

export function normalizarSecao(secao: SecaoConfig, config: ConfigLoja): ConfigLoja {
  if (secao === 'contato') {
    return {
      ...config,
      whatsapp: config.whatsapp ? config.whatsapp.replace(/\D/g, '') : null,
    }
  }

  if (secao === 'instagram') {
    const handle = handleComArroba(config.instagramHandle)
    return {
      ...config,
      instagramHandle: handle,
      instagramUrl: urlDoHandle(handle),
    }
  }

  if (secao === 'endereco') {
    return {
      ...config,
      enderecoRua: config.enderecoRua.trim(),
      enderecoCidadeUf: config.enderecoCidadeUf.trim(),
    }
  }

  return {
    ...config,
    horarios: config.horarios.map((horario) => ({
      dias: horario.dias.trim(),
      horas: horario.horas.trim(),
    })),
  }
}

export function mesclarSecao(base: ConfigLoja, rascunho: ConfigLoja, secao: SecaoConfig): ConfigLoja {
  if (secao === 'contato') return { ...base, whatsapp: rascunho.whatsapp }

  if (secao === 'instagram') {
    return {
      ...base,
      instagramHandle: rascunho.instagramHandle,
      instagramUrl: rascunho.instagramUrl,
    }
  }

  if (secao === 'endereco') {
    return {
      ...base,
      enderecoRua: rascunho.enderecoRua,
      enderecoCidadeUf: rascunho.enderecoCidadeUf,
    }
  }

  return { ...base, horarios: rascunho.horarios }
}

export function comCampos<T extends object>(base: T, origem: T, campos: Iterable<keyof T>): T {
  const proximo = { ...base }
  for (const campo of campos) proximo[campo] = origem[campo]
  return proximo
}

export function horaAgora(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

export function primeiroCampoInvalido(secao: SecaoConfig, config: ConfigLoja): string | null {
  if (secao === 'contato') return validarWhatsapp(config.whatsapp) ? 'cfg-whatsapp' : null
  if (secao === 'instagram') return validarHandle(config.instagramHandle) ? 'cfg-instagram' : null
  if (secao === 'endereco') {
    if (!config.enderecoRua.trim()) return 'cfg-endereco-rua'
    if (!config.enderecoCidadeUf.trim()) return 'cfg-endereco-cidade'
    return null
  }

  const indice = config.horarios.findIndex(
    (horario) => !horario.dias.trim() || !horario.horas.trim(),
  )
  if (indice < 0) return null
  return !config.horarios[indice].dias.trim()
    ? `cfg-horario-dias-${indice}`
    : `cfg-horario-horas-${indice}`
}

export const SECOES: DescricaoSecao[] = [
  {
    id: 'contato',
    rotulo: 'Contato',
    descricao:
      'O número que abre os botões de WhatsApp do site. Só dígitos, com DDI e DDD — sem espaços, traços ou parênteses.',
    campos: ['whatsapp'],
    resumo: (config) =>
      config.whatsapp ? formatarWhatsapp(config.whatsapp) : 'Sem número definido',
    rotuloSalvar: 'Salvar contato',
    mensagemSalva: 'Contato salvo. Os botões do site já usam o novo número.',
  },
  {
    id: 'instagram',
    rotulo: 'Instagram',
    descricao:
      'O @ publicado no cabeçalho, no rodapé e na página de contato. O link final é montado a partir dele.',
    campos: ['instagramHandle', 'instagramUrl'],
    resumo: (config) => config.instagramHandle || 'Sem perfil definido',
    rotuloSalvar: 'Salvar Instagram',
    mensagemSalva: 'Instagram salvo. O link do perfil já foi atualizado no site.',
  },
  {
    id: 'endereco',
    rotulo: 'Endereço',
    descricao:
      'Rua, número e cidade usados no rodapé e no botão de rota do Google Maps. O link do mapa nasce desta ficha.',
    campos: ['enderecoRua', 'enderecoCidadeUf'],
    resumo: (config) => config.enderecoRua || 'Sem endereço definido',
    rotuloSalvar: 'Salvar endereço',
    mensagemSalva: 'Endereço salvo. O mapa e o rodapé já usam o novo endereço.',
  },
  {
    id: 'horarios',
    rotulo: 'Horários',
    descricao:
      'As faixas de atendimento exibidas no rodapé e na página de contato. A ordem das linhas é a ordem publicada.',
    campos: ['horarios'],
    resumo: (config) =>
      config.horarios.length === 0
        ? 'Nenhuma faixa'
        : config.horarios.map((horario) => `${horario.dias} ${horario.horas}`).join(' · '),
    rotuloSalvar: 'Salvar horários',
    mensagemSalva: 'Horários salvos. O rodapé e a página de contato já mostram as novas faixas.',
  },
  {
    id: 'lixeira',
    rotulo: 'Lixeira',
    descricao:
      'Motos excluídas do estoque. Restaure para voltar ao pátio; o que ficar 30 dias aqui é apagado de vez, junto com as fotos.',
    campos: [],
    resumo: (_config, naLixeira, valorLixeira) =>
      naLixeira === 0
        ? 'Vazia'
        : `${naLixeira} ${naLixeira === 1 ? 'moto' : 'motos'} · ${formatPrice(valorLixeira)}`,
  },
]

export function metaDaSecao(id: Secao): DescricaoSecao {
  return SECOES.find((secao) => secao.id === id) ?? SECOES[0]
}

export function secaoSuja(secao: Secao, config: ConfigLoja, salvo: ConfigLoja): boolean {
  const { campos } = metaDaSecao(secao)
  return campos.some(
    (campo) => JSON.stringify(config[campo]) !== JSON.stringify(salvo[campo]),
  )
}
