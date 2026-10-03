import type { Motorcycle } from '../types'

/**
 * ============================================================
 * CATÁLOGO DE MOTOCICLETAS — DG MOTOS
 * ============================================================
 * Fonte única do estoque exibido no site.
 *
 * CONFIRMAÇÃO PENDENTE DO CLIENTE (ver docs/PENDENCIAS-CLIENTE.md):
 * - Marca/modelo/ano/preço dos 5 registros abaixo vieram do
 *   site atual e devem ser validados antes da publicação.
 * - Quilometragem (`quilometragem: null`) só deve ser
 *   preenchida quando confirmada — o site exibe
 *   "Km a confirmar" enquanto estiver nula.
 * - Descrições e especificações são rascunho editorial para
 *   revisão do proprietário.
 * - Imagens: colocar os arquivos reais em
 *   public/motos/<pasta>/ e manter os mesmos nomes.
 */
export const motorcycles: Motorcycle[] = [
  {
    id: 'xre-300-2021',
    slug: 'honda-xre-300-2021',
    marca: 'Honda',
    modelo: 'XRE 300',
    ano: 2021,
    preco: 31900,
    quilometragem: null,
    cilindrada: 291,
    categoria: 'Trail',
    descricao:
      'Trail versátil para o dia a dia e para viagem: motor de um cilindro com boa resposta em baixa rotação, posição de pilotagem ereta e manutenção de custo previsível. Revisão e documentação em dia. Texto sujeito a confirmação do proprietário.',
    especificacoes: [
      { label: 'Motor', value: 'Mono OHc, 291,6 cc' },
      { label: 'Câmbio', value: '6 marchas' },
      { label: 'Freios', value: 'ABS, disco nas duas rodas' },
      { label: 'Tanque', value: '16,7 L' },
    ],
    imagens: [
      { src: '/motos/honda-xre-300-2021/01.webp', alt: 'Honda XRE 300 2021 — vista frontal' },
      { src: '/motos/honda-xre-300-2021/02.webp', alt: 'Honda XRE 300 2021 — vista lateral' },
      { src: '/motos/honda-xre-300-2021/03.webp', alt: 'Honda XRE 300 2021 — painel' },
    ],
    destaque: true,
    disponibilidade: 'disponivel',
  },
  {
    id: 'lander-2024',
    slug: 'yamaha-lander-2024',
    marca: 'Yamaha',
    modelo: 'Lander',
    ano: 2024,
    preco: 26900,
    quilometragem: null,
    cilindrada: 250,
    categoria: 'Trail',
    descricao:
      'Lander 2024 com suspensão dianteira invertida e freios ABS — seminova de pouca estrada. Conforto para o uso urbano e segurança para viagens. Texto sujeito a confirmação do proprietário.',
    especificacoes: [
      { label: 'Motor', value: 'Mono 250 cc' },
      { label: 'Suspensão', value: 'Dianteira invertida' },
      { label: 'Freios', value: 'ABS, disco nas duas rodas' },
      { label: 'Tanque', value: '12 L' },
    ],
    imagens: [
      { src: '/motos/yamaha-lander-2024/01.webp', alt: 'Yamaha Lander 2024 — vista frontal' },
      { src: '/motos/yamaha-lander-2024/02.webp', alt: 'Yamaha Lander 2024 — vista lateral' },
      { src: '/motos/yamaha-lander-2024/03.webp', alt: 'Yamaha Lander 2024 — detalhe' },
    ],
    destaque: true,
    disponibilidade: 'disponivel',
  },
  {
    id: 'titan-2022',
    slug: 'honda-titan-2022',
    marca: 'Honda',
    modelo: 'Titan',
    ano: 2022,
    preco: 16900,
    quilometragem: null,
    cilindrada: 162,
    categoria: 'Street',
    descricao:
      'A referência de rua no Brasil: econômica, robusta e com ótima aceitação na revenda. Ideal para o uso diário na cidade e para o trabalho. Texto sujeito a confirmação do proprietário.',
    especificacoes: [
      { label: 'Motor', value: 'Mono OHC 162,7 cc' },
      { label: 'Câmbio', value: '5 marchas' },
      { label: 'Freios', value: 'Disco dianteiro, tambor traseiro' },
      { label: 'Tanque', value: '16,5 L' },
    ],
    imagens: [
      { src: '/motos/honda-titan-2022/01.webp', alt: 'Honda Titan 2022 — vista frontal' },
      { src: '/motos/honda-titan-2022/02.webp', alt: 'Honda Titan 2022 — vista lateral' },
      { src: '/motos/honda-titan-2022/03.webp', alt: 'Honda Titan 2022 — detalhe' },
    ],
    destaque: true,
    disponibilidade: 'disponivel',
  },
  {
    id: 'start-2024',
    slug: 'honda-start-2024',
    marca: 'Honda',
    modelo: 'CG 160 Start',
    ano: 2024,
    preco: 16900,
    quilometragem: null,
    cilindrada: 162,
    categoria: 'Street',
    descricao:
      'Porta de entrada da linha CG: partida elétrica, freio CBS e custo de uso baixíssimo. Simples de pilotar e fácil de manter. Texto sujeito a confirmação do proprietário.',
    especificacoes: [
      { label: 'Motor', value: 'Mono OHC 162,7 cc' },
      { label: 'Câmbio', value: '4 marchas' },
      { label: 'Freios', value: 'CBS, tambores' },
      { label: 'Tanque', value: '16,5 L' },
    ],
    imagens: [
      { src: '/motos/honda-start-2024/01.webp', alt: 'Honda CG 160 Start 2024 — vista frontal' },
      { src: '/motos/honda-start-2024/02.webp', alt: 'Honda CG 160 Start 2024 — vista lateral' },
      { src: '/motos/honda-start-2024/03.webp', alt: 'Honda CG 160 Start 2024 — detalhe' },
    ],
    destaque: false,
    disponibilidade: 'disponivel',
  },
  {
    id: 'fazer-150-2020',
    slug: 'yamaha-fazer-150-2020',
    marca: 'Yamaha',
    modelo: 'Fazer 150',
    ano: 2020,
    preco: 13900,
    quilometragem: null,
    cilindrada: 149,
    categoria: 'Street',
    descricao:
      'Street econômica da Yamaha, confortável para o trajeto diário e barata de manter. Uma das opções mais equilibradas do mercado na faixa de 150 cc. Texto sujeito a confirmação do proprietário.',
    especificacoes: [
      { label: 'Motor', value: 'Mono 149,8 cc' },
      { label: 'Câmbio', value: '5 marchas' },
      { label: 'Freios', value: 'Disco dianteiro, tambor traseiro' },
      { label: 'Tanque', value: '12,4 L' },
    ],
    imagens: [
      { src: '/motos/yamaha-fazer-150-2020/01.webp', alt: 'Yamaha Fazer 150 2020 — vista frontal' },
      { src: '/motos/yamaha-fazer-150-2020/02.webp', alt: 'Yamaha Fazer 150 2020 — vista lateral' },
      { src: '/motos/yamaha-fazer-150-2020/03.webp', alt: 'Yamaha Fazer 150 2020 — detalhe' },
    ],
    destaque: false,
    disponibilidade: 'disponivel',
  },
]
