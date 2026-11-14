import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Motorcycle } from '../../types'
import { bikeTitle } from '../../lib/format'
import { PreviaMoto } from './PreviaMoto'
import { BikeGallery } from '../motorcycles/BikeGallery'

const handlers = () => {}

/** SSR intercala `<!-- -->` entre textos adjacentes; removo para asserções de texto contíguo. */
function marcar(componente: React.ReactElement): string {
  return renderToStaticMarkup(componente).replace(/<!-- -->/g, '')
}

function motoDe(parcial: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 'm1',
    slug: 'honda-cg-160-fan-2023',
    marca: 'Honda',
    modelo: 'CG 160 Fan',
    ano: 2023,
    preco: 17900,
    precoAntes: null,
    emPromocao: false,
    quilometragem: 12000,
    cilindrada: 160,
    descricao: '',
    especificacoes: [],
    imagens: [
      { src: '/motos/fan/foto-1.webp', alt: 'Fan de frente' },
      { src: '/motos/fan/foto-2.webp', alt: 'Fan de lado' },
      { src: '/motos/fan/foto-3.webp', alt: 'Motor' },
    ],
    status: 'disponivel',
    ...parcial,
  }
}

describe('PreviaMoto — composição do anúncio', () => {
  it('no desktop coloca as informações do anúncio antes da foto e a ficha na sequência', () => {
    const html = marcar(
      <PreviaMoto moto={motoDe()} onVoltar={handlers} onEditar={handlers} onVender={handlers} onExcluir={handlers} />,
    )

    // A prévia tem duas composições (celular e mesa); a ordem da mesa é
    // conferida dentro da própria moldura.
    const mesa = html.slice(html.indexOf('border-borda-forte bg-fundo sm:block'))
    const ordem = [
      mesa.indexOf(bikeTitle(motoDe())),
      mesa.indexOf('No pátio'),
      mesa.indexOf('Quilometragem'),
      mesa.indexOf(`Fotos de ${bikeTitle(motoDe())} 2023`),
    ]
    // Informações primeiro: sobe índice em ordem estritamente crescente.
    expect(
      ordem.every((i, n) => i > 0 && (n === 0 || i > ordem[n - 1])),
      JSON.stringify({ ordem }),
    ).toBe(true)
  })

  it('no celular segue a ordem da página real: foto, nome, preço e ficha', () => {
    const html = marcar(
      <PreviaMoto moto={motoDe()} onVoltar={handlers} onEditar={handlers} onVender={handlers} onExcluir={handlers} />,
    )

    const celular = html.slice(
      html.indexOf('bg-fundo sm:hidden'),
      html.indexOf('border-borda-forte bg-fundo sm:block'),
    )

    const ordem = [
      celular.indexOf(`Fotos de ${bikeTitle(motoDe())} 2023`),
      celular.indexOf(bikeTitle(motoDe())),
      celular.indexOf('17.900'),
      celular.indexOf('Situação'),
    ]
    expect(
      ordem.every((i, n) => i > 0 && (n === 0 || i > ordem[n - 1])),
      JSON.stringify({ ordem }),
    ).toBe(true)
  })

  it('apresenta a foto contida no palco do celular (contain) e cobre no desktop', () => {
    const html = renderToStaticMarkup(
      <PreviaMoto moto={motoDe()} onVoltar={handlers} onEditar={handlers} onVender={handlers} onExcluir={handlers} />,
    )

    expect(html).toContain('object-contain lg:object-cover')
    // Palco 4/3 no celular — não domina verticalmente a página.
    expect(html).toContain('aspect-[4/3]')
  })

  it('não disfarça valor desconhecido como dado confirmado', () => {
    const semCilindrada = motoDe({ cilindrada: null })
    const html = renderToStaticMarkup(
      <PreviaMoto moto={semCilindrada} onVoltar={handlers} onEditar={handlers} onVender={handlers} onExcluir={handlers} />,
    )

    expect(html).toContain('A confirmar')
    expect(html).toMatch(/text-texto-3[^"]*"[^>]*>A confirmar/)
  })

  it('mantém as quatro ações administrativas alcançáveis com área larga no celular', () => {
    const html = renderToStaticMarkup(
      <PreviaMoto moto={motoDe()} onVoltar={handlers} onEditar={handlers} onVender={handlers} onExcluir={handlers} />,
    )

    expect(html).toContain('Editar moto')
    expect(html).toContain('Ver no site')
    expect(html).toContain('Marcar como vendida')
    expect(html).toContain('Excluir moto')
    // As quatro ações vivem no rodapé: h-11 no celular, h-10 na mesa.
    expect(html.match(/h-11 w-full/g)?.length).toBe(4)
  })
})

describe('BikeGallery — palco da prévia', () => {
  const imagens = [
    { src: '/m/f1.webp', alt: 'f1' },
    { src: '/m/f2.webp', alt: 'f2' },
  ]

  it('renderiza palco 4:3 com miniaturas-cartão no modo prévia', () => {
    const html = renderToStaticMarkup(
      <BikeGallery imagens={imagens} titulo="Fan 2023" preencherAltura />,
    )

    expect(html).toContain('aspect-[4/3]')
    // Miniatura-cartão do modo prévia: canto reto, como todo o site.
    expect(html).toContain('w-14 border-2')
    expect(html).toContain('aria-pressed="true"')
  })

  it('preserva a vitrine pública: miniatura-fita e contain no desktop', () => {
    const html = renderToStaticMarkup(
      <BikeGallery imagens={imagens} titulo="Fan 2023" />,
    )

    expect(html).toContain('w-12 border-b-2')
    expect(html).toContain('object-cover lg:object-contain')
  })
})
