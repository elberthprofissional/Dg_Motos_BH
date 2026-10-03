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
 * - `descricao` e `especificacoes` saem daqui crus para a ficha
 *   (`/moto/<slug>`) e para o schema.org: não escrever nelas
 *   observações internas ("sujeito a confirmação", "a confirmar",
 *   "TODO"). Provisionamento que não vai ao cliente fica neste
 *   comentário ou em `docs/PENDENCIAS-CLIENTE.md`.
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
      'Trail da Honda, ano 2021, com motor de um cilindro que responde bem em baixa rotação. Pilotagem erta, boa para cidade e estrada, e manutenção de custo previsível. Revisão e documentação em dia.',
    especificacoes: [
      { label: 'Motor', value: 'Mono OHC, 291,6 cc' },
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
      'Lander 2024 com suspensão dianteira invertida e freios ABS. Seminova de pouca estrada: confortável no dia a dia e segura em viagem.',
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
      'Titan 2022, street de 160 cc econômica e robusta. Serve bem para o dia a dia na cidade e para o trabalho, com manutenção simples e peça fácil de achar.',
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
      'CG 160 Start 2024: a porta de entrada da linha CG. Partida elétrica, freio CBS e custo de uso baixo. Simples de pilotar e fácil de manter.',
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
      'Fazer 150 2020 da Yamaha. Confortável para o trajeto diário e barata de manter — uma das mais equilibradas da faixa de 150 cc.',
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
