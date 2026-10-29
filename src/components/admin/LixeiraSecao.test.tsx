import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Motorcycle } from '../../types'
import type { FotoNaLixeira } from '../../data/entregas'
import { LixeiraSecao } from './LixeiraSecao'

const handlers = () => {}

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
    categoria: 'Street',
    descricao: '',
    especificacoes: [],
    imagens: [],
    status: 'disponivel',
    lixeiraEm: '2026-10-20T12:00:00Z',
    ...parcial,
  }
}

function fotoDe(parcial: Partial<FotoNaLixeira> = {}): FotoNaLixeira {
  return {
    id: 'f1',
    entregaId: 'e1',
    caminho: 'e1/a.webp',
    url: 'https://exemplo.test/assinada',
    // Data recente: o prazo "sai em X dias" não depende do dia da máquina.
    apagadaEm: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    ...parcial,
  }
}

function base(parcial: Partial<Parameters<typeof LixeiraSecao>[0]> = {}) {
  return (
    <LixeiraSecao
      motos={[]}
      fotos={[]}
      erro={null}
      erroFotos={null}
      onRestaurar={handlers}
      onApagarDeVez={handlers}
      onRestaurarFoto={handlers}
      onApagarFoto={handlers}
      onEsvaziar={handlers}
      onIrParaEstoque={handlers}
      onRecarregar={handlers}
      {...parcial}
    />
  )
}

/** SSR intercala `<!-- -->` entre textos adjacentes; removo para asserções contíguas. */
function marcar(componente: React.ReactElement): string {
  return renderToStaticMarkup(componente).replace(/<!-- -->/g, '')
}

describe('LixeiraSecao — fotos do mural', () => {
  it('lista a foto apagada com miniatura, prazo e as duas ações', () => {
    const html = marcar(base({ fotos: [fotoDe()] }))

    expect(html).toContain('Fotos de entregas')
    expect(html).toContain('1 foto apagada do mural')
    expect(html).toContain('https://exemplo.test/assinada')
    expect(html).toContain('Restaurar a foto apagada')
    expect(html).toContain('Apagar a foto apagada')
    expect(html).toContain('sai em')
  })

  it('junta motos e fotos na mesma frase de prazo', () => {
    const html = marcar(
      base({ motos: [motoDe()], fotos: [fotoDe(), fotoDe({ id: 'f2', caminho: 'e1/b.webp' })] }),
    )

    expect(html).toContain(
      '1 moto excluída no Estoque e 2 fotos apagadas do mural ficam guardadas por',
    )
    expect(html).toContain('Esvaziar a lixeira')
    expect(html).toContain('a moto e as fotos dela, as 2 fotos do mural')
  })

  it('mostra o erro das fotos mesmo com a lixeira vazia', () => {
    const html = marcar(base({ erroFotos: 'A tabela de fotos não respondeu.' }))

    expect(html).toContain('Nada na lixeira')
    expect(html).toContain('Não deu para abrir as fotos da lixeira')
    expect(html).toContain('A tabela de fotos não respondeu.')
  })

  it('a lixeira vazia fala das motos e das fotos', () => {
    const html = marcar(base())

    expect(html).toContain('Nada na lixeira')
    expect(html).toContain('uma foto do mural, ela fica aqui por')
  })
})
