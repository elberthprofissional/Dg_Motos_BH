import type { Motorcycle, MotorcycleSpec } from '../types'

/**
 * ============================================================
 * FICHA DE REFERÊNCIA DA LINHA — quando a unidade não tem ficha
 * ============================================================
 *
 * A ficha nasce no cadastro da moto (campo `especificacoes`). Quando
 * a loja ainda não preencheu, a página não pode ficar vazia nem
 * inventar dados daquela unidade. Aqui ficam só dados públicos e
 * verificáveis do MODELO — o que vale para qualquer XRE Rally 300 —,
 * sempre exibidos como referência, nunca como laudo desta moto.
 *
 * Regras:
 * - nada de "revisão em dia", "único dono", "sem detalhes" ou qualquer
 *   afirmação sobre o estado da unidade;
 * - grupos e valores técnicos apenas de fonte pública (Honda/imprensa
 *   especializada), com a ressalva de que o ano pode variar;
 * - a descrição é editorial e serve para explicar a moto, não para
 *   vender uma condição que ninguém conferiu.
 */

export interface GrupoFicha {
  titulo: string
  itens: MotorcycleSpec[]
}

export interface DestaqueFicha {
  valor: string
  rotulo: string
  texto: string
}

export interface FichaModelo {
  /** Nome de exibição da linha, sem a marca. */
  modelo: string
  /** Frase de apoio do topo — factual, sem promessa. */
  resumo: string
  descricao: string[]
  destaques: DestaqueFicha[]
  grupos: GrupoFicha[]
  /** Ressalva exibida junto dos dados de referência. */
  nota: string
}

const XRE_RALLY_300: FichaModelo = {
  modelo: 'XRE Rally 300',
  resumo:
    'Trail de 291,6 cm³ para o asfalto da semana e a estrada de terra do fim de semana.',
  descricao: [
    'A XRE Rally 300 é a versão aventureira da XRE 300. O motor monocilíndrico de 291,6 cm³ é arrefecido a ar, alimentado por injeção PGM-FI e acoplado a um câmbio de cinco marchas. Com gasolina, rende 25,4 cv a 7.500 rpm e 2,76 kgf.m de torque a 6.000 rpm.',
    'A proposta é uma trail de uso misto: suspensões de 245 mm na frente e 225 mm atrás, rodas de 21 e 18 polegadas, freios ABS em disco nas duas rodas e 259 mm de vão livre do solo. O tanque leva 13,8 litros, o assento fica a 860 mm do chão e o peso seco é de 148 kg. A versão Rally se diferencia pelo grafismo vermelho; a base mecânica é a mesma da linha XRE 300.',
  ],
  destaques: [
    {
      valor: '291,6 cm³',
      rotulo: 'Monocilíndrico DOHC',
      texto: '25,4 cv a 7.500 rpm, injeção PGM-FI e câmbio de cinco marchas.',
    },
    {
      valor: '245 / 225 mm',
      rotulo: 'Curso das suspensões',
      texto: 'Garfo telescópico na frente, Pro-Link atrás e rodas de 21 e 18 polegadas.',
    },
    {
      valor: 'ABS',
      rotulo: 'Freios nas duas rodas',
      texto: 'Discos de 256 mm e 220 mm, tanque de 13,8 L e assento a 860 mm do chão.',
    },
  ],
  grupos: [
    {
      titulo: 'Motor',
      itens: [
        { label: 'Tipo', value: 'Monocilíndrico DOHC, 4 tempos, arrefecido a ar' },
        { label: 'Cilindrada', value: '291,6 cm³' },
        {
          label: 'Potência máxima',
          value: '25,4 cv a 7.500 rpm (gasolina) · 25,6 cv (etanol)',
        },
        {
          label: 'Torque máximo',
          value: '2,76 kgf.m a 6.000 rpm (gasolina) · 2,80 kgf.m (etanol)',
        },
        { label: 'Alimentação', value: 'Injeção eletrônica PGM-FI' },
        { label: 'Câmbio', value: '5 marchas' },
      ],
    },
    {
      titulo: 'Ciclo e freios',
      itens: [
        { label: 'Suspensão dianteira', value: 'Garfo telescópico, 245 mm de curso' },
        { label: 'Suspensão traseira', value: 'Pro-Link, 225 mm de curso' },
        { label: 'Freio dianteiro', value: 'Disco de 256 mm com ABS' },
        { label: 'Freio traseiro', value: 'Disco de 220 mm com ABS' },
        { label: 'Pneus', value: '90/90-21 na frente · 120/80-18 atrás' },
        { label: 'Chassi', value: 'Berço semiduplo em tubos de aço' },
      ],
    },
    {
      titulo: 'Dimensões',
      itens: [
        { label: 'Tanque', value: '13,8 L, com reserva de 3,9 L' },
        { label: 'Altura do assento', value: '860 mm' },
        { label: 'Distância do solo', value: '259 mm' },
        { label: 'Distância entre eixos', value: '1.417 mm' },
        { label: 'Peso seco', value: '148 kg' },
        { label: 'Comprimento × largura × altura', value: '2.195 × 838 × 1.215 mm' },
      ],
    },
  ],
  nota: 'Dados de referência da linha XRE 300. O estado desta unidade, a documentação e o histórico de revisões são confirmados com a loja.',
}

const FICHAS: Record<string, FichaModelo> = {
  'honda|xre rally 300': XRE_RALLY_300,
}

/** Chave estável do modelo: sem acento, sem caixa e com espaços colapsados. */
export function chaveDoModelo(marca: string, modelo: string): string {
  const limpar = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .replace(/\s+/g, ' ')
      .trim()
  return `${limpar(marca)}|${limpar(modelo)}`
}

/**
 * Devolve a ficha de referência do modelo, ou null quando não há uma
 * ficha pública verificada para ele. Nunca usa ano como chave: a ficha
 * é da linha, e a página deixa isso explícito na tela.
 *
 * O cadastro pode repetir a marca no campo de modelo ("Honda XRE Rally
 * 300"); nesse caso a busca usa o nome já sem a repetição.
 */
export function fichaDeReferencia(
  moto: Pick<Motorcycle, 'marca' | 'modelo'>,
): FichaModelo | null {
  const direta = FICHAS[chaveDoModelo(moto.marca, moto.modelo)]
  if (direta) return direta

  const prefixo = `${moto.marca.trim().toLocaleLowerCase('pt-BR')} `
  const modelo = moto.modelo.trim()
  if (!prefixo.trim() || !modelo.toLocaleLowerCase('pt-BR').startsWith(prefixo)) {
    return null
  }

  return FICHAS[chaveDoModelo(moto.marca, modelo.slice(prefixo.length))] ?? null
}
