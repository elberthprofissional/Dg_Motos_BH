// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EntregaRegistro } from '../../data/entregas'

const {
  atualizarFotosEntrega,
  buscarEntregasAdmin,
  enviarFotosEntrega,
  moverFotoParaLixeira,
  salvarEntrega,
} = vi.hoisted(() => ({
  atualizarFotosEntrega: vi.fn(),
  buscarEntregasAdmin: vi.fn(),
  enviarFotosEntrega: vi.fn(),
  moverFotoParaLixeira: vi.fn(),
  salvarEntrega: vi.fn(),
}))

vi.mock('../../lib/entregas', () => ({
  atualizarFotosEntrega,
  buscarEntregasAdmin,
  enviarFotosEntrega,
  moverFotoParaLixeira,
  salvarEntrega,
}))

import { PublicacoesTab } from './PublicacoesTab'

function entregaDe(parcial: Partial<EntregaRegistro> = {}): EntregaRegistro {
  return {
    id: 'e1',
    motoId: '',
    motoNome: '',
    fotos: ['e1/a.webp'],
    imagens: ['https://assinada.test/a.webp'],
    nomeCliente: '',
    legenda: '',
    entregueEm: '2026-10-01',
    autorizacaoPublicacao: true,
    status: 'publicada',
    ordem: 0,
    updatedAt: '2026-10-01T12:00:00Z',
    ...parcial,
  }
}

function montar(props: { revisao?: number; onFotoNaLixeira?: () => void } = {}) {
  const onFeedback = vi.fn()
  const onFotoNaLixeira = props.onFotoNaLixeira ?? vi.fn()
  render(
    <PublicacoesTab
      onFeedback={onFeedback}
      onFotoNaLixeira={onFotoNaLixeira}
      revisao={props.revisao ?? 0}
    />,
  )
  return { onFeedback, onFotoNaLixeira }
}

describe('PublicacoesTab', () => {
  beforeAll(() => {
    // jsdom não implementa o modal nativo; o componente só precisa que
    // o diálogo abra e feche sem erro.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  })

  beforeEach(() => {
    buscarEntregasAdmin.mockReset()
    salvarEntrega.mockReset().mockResolvedValue(undefined)
    moverFotoParaLixeira.mockReset().mockResolvedValue(undefined)
    atualizarFotosEntrega.mockReset().mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('rascunho antigo vai para o ar com foto e autorização', async () => {
    buscarEntregasAdmin
      .mockResolvedValueOnce([entregaDe({ status: 'rascunho' })])
      .mockResolvedValue([entregaDe()])

    const { onFeedback } = montar()

    expect(await screen.findByText(/1 rascunho fora do ar/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    await waitFor(() => expect(salvarEntrega).toHaveBeenCalledTimes(1))
    expect(salvarEntrega.mock.calls[0][0]).toMatchObject({
      id: 'e1',
      fotos: ['e1/a.webp'],
      status: 'publicada',
      autorizacaoPublicacao: true,
    })
    await waitFor(() =>
      expect(onFeedback).toHaveBeenCalledWith({
        tipo: 'ok',
        texto: 'Publicação no ar em "Sonhos realizados".',
      }),
    )
  })

  it('apagar uma foto manda o arquivo para a Lixeira, não para o vazio', async () => {
    buscarEntregasAdmin.mockResolvedValue([
      entregaDe({ fotos: ['e1/a.webp', 'e1/b.webp'], imagens: ['u1', 'u2'] }),
    ])

    const { onFeedback, onFotoNaLixeira } = montar()

    fireEvent.click(await screen.findByRole('button', { name: /Apagar a foto 1/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))

    await waitFor(() =>
      expect(moverFotoParaLixeira).toHaveBeenCalledWith('e1', 'e1/a.webp'),
    )
    expect(atualizarFotosEntrega).not.toHaveBeenCalled()
    expect(onFotoNaLixeira).toHaveBeenCalledTimes(1)
    expect(onFeedback).toHaveBeenCalledWith({
      tipo: 'ok',
      texto: 'Foto apagada do mural e guardada na Lixeira por 30 dias.',
    })
  })

  it('publicação sem nenhuma foto só sai do mural', async () => {
    buscarEntregasAdmin.mockResolvedValue([
      entregaDe({ fotos: [], imagens: [], status: 'rascunho' }),
    ])

    const { onFeedback } = montar()

    fireEvent.click(await screen.findByRole('button', { name: /Tirar a publicação/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Tirar do mural' }))

    await waitFor(() => expect(atualizarFotosEntrega).toHaveBeenCalledWith('e1', []))
    expect(moverFotoParaLixeira).not.toHaveBeenCalled()
    expect(onFeedback).toHaveBeenCalledWith({
      tipo: 'ok',
      texto: 'Publicação sem fotos saiu do mural.',
    })
  })

  it('a lista vem vazia com o convite para a primeira foto', async () => {
    buscarEntregasAdmin.mockResolvedValue([])

    montar()

    expect(await screen.findByText('Nenhuma publicação no mural ainda.')).toBeTruthy()
  })

  it('falha ao carregar mostra o erro com opção de tentar de novo', async () => {
    buscarEntregasAdmin.mockRejectedValue(new Error('A tabela não respondeu.'))

    montar()

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText('Não foi possível abrir as publicações.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
  })
})
