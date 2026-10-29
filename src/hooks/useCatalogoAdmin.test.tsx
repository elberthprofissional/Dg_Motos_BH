// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Motorcycle } from '../types'
import type { FotoNaLixeira } from '../data/entregas'

const { buscarCatalogo, buscarFotosNaLixeira } = vi.hoisted(() => ({
  buscarCatalogo: vi.fn(),
  buscarFotosNaLixeira: vi.fn(),
}))

vi.mock('../lib/catalog', () => ({ buscarCatalogo }))
vi.mock('../lib/entregas', () => ({ buscarFotosNaLixeira }))

import { useCatalogoAdmin } from './useCatalogoAdmin'

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
    imagens: [],
    status: 'disponivel',
    lixeiraEm: null,
    ...parcial,
  }
}

function fotoDe(parcial: Partial<FotoNaLixeira> = {}): FotoNaLixeira {
  return {
    id: 'f1',
    entregaId: 'e1',
    caminho: 'e1/a.webp',
    url: 'https://exemplo.test/assinada',
    apagadaEm: new Date().toISOString(),
    ...parcial,
  }
}

const bancoOk = (motos: Motorcycle[]) => ({ motos, doBanco: true, erro: null })

describe('useCatalogoAdmin', () => {
  beforeEach(() => {
    buscarCatalogo.mockReset()
    buscarFotosNaLixeira.mockReset()
    buscarCatalogo.mockResolvedValue(bancoOk([]))
    buscarFotosNaLixeira.mockResolvedValue([])
  })

  afterEach(cleanup)

  it('separa o pátio da lixeira e conta motos e fotos no selo', async () => {
    buscarCatalogo.mockResolvedValue(
      bancoOk([
        motoDe(),
        motoDe({ id: 'm2', lixeiraEm: '2026-10-20T12:00:00Z' }),
      ]),
    )
    buscarFotosNaLixeira.mockResolvedValue([fotoDe()])

    const { result } = renderHook(() => useCatalogoAdmin())

    await waitFor(() => expect(result.current.ativas).not.toBeNull())

    expect(buscarCatalogo).toHaveBeenCalledWith({ incluirLixeira: true })
    expect(result.current.ativas?.map((moto) => moto.id)).toEqual(['m1'])
    expect(result.current.naLixeira?.map((moto) => moto.id)).toEqual(['m2'])
    // 1 moto + 1 foto: o selo do menu soma as duas listas.
    expect(result.current.totalNaLixeira).toBe(2)
    expect(result.current.erro).toBeNull()
  })

  it('erro do catálogo vira mensagem e deixa as listas sem carga', async () => {
    buscarCatalogo.mockResolvedValue({
      motos: [],
      doBanco: false,
      erro: 'A rede caiu.',
    })

    const { result } = renderHook(() => useCatalogoAdmin())

    await waitFor(() => expect(result.current.erro).toBe('A rede caiu.'))
    expect(result.current.ativas).toBeNull()
    expect(result.current.naLixeira).toBeNull()
  })

  it('recarregar enxerga o que mudou no banco', async () => {
    buscarCatalogo
      .mockResolvedValueOnce(bancoOk([motoDe()]))
      .mockResolvedValueOnce(bancoOk([motoDe(), motoDe({ id: 'm2' })]))

    const { result } = renderHook(() => useCatalogoAdmin())
    await waitFor(() => expect(result.current.ativas).toHaveLength(1))

    await act(async () => {
      await result.current.recarregar()
    })

    expect(result.current.ativas).toHaveLength(2)
  })

  it('falha da lixeira de fotos mantém o painel utilizável', async () => {
    buscarFotosNaLixeira.mockRejectedValue(new Error('Tabela ausente.'))

    const { result } = renderHook(() => useCatalogoAdmin())

    await waitFor(() => expect(result.current.erroFotosLixeira).toBe('Tabela ausente.'))
    expect(result.current.fotosLixeira).toEqual([])
  })

  it('o mural é avisado quando a Lixeira devolve uma foto', async () => {
    const { result } = renderHook(() => useCatalogoAdmin())
    await waitFor(() => expect(result.current.ativas).not.toBeNull())

    act(() => result.current.avisarRevisaoPublicacoes())

    expect(result.current.revisao).toBe(1)
  })
})
