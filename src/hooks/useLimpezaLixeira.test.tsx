// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Motorcycle } from '../types'
import type { FotoNaLixeira } from '../data/entregas'
import type { Feedback } from '../components/ui/Toast'

const { excluirMotosDefinitivamente, apagarFotosDaLixeira } = vi.hoisted(() => ({
  excluirMotosDefinitivamente: vi.fn(),
  apagarFotosDaLixeira: vi.fn(),
}))

vi.mock('../lib/catalog', () => ({ excluirMotosDefinitivamente }))
vi.mock('../lib/entregas', () => ({ apagarFotosDaLixeira }))

import { useLimpezaLixeira } from './useLimpezaLixeira'

const DIA = 86_400_000

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
    lixeiraEm: new Date(Date.now() - 31 * DIA).toISOString(),
    ...parcial,
  }
}

function fotoDe(parcial: Partial<FotoNaLixeira> = {}): FotoNaLixeira {
  return {
    id: 'f1',
    entregaId: 'e1',
    caminho: 'e1/a.webp',
    url: 'https://exemplo.test/assinada',
    apagadaEm: new Date(Date.now() - 31 * DIA).toISOString(),
    ...parcial,
  }
}

function montar(opcoes: {
  naLixeira: Motorcycle[] | null
  fotosLixeira: FotoNaLixeira[] | null
  onFeedback: (feedback: Feedback) => void
}) {
  return renderHook(() =>
    useLimpezaLixeira({
      naLixeira: opcoes.naLixeira,
      fotosLixeira: opcoes.fotosLixeira,
      recarregar: vi.fn().mockResolvedValue(undefined),
      recarregarFotosLixeira: vi.fn().mockResolvedValue(undefined),
      onFeedback: opcoes.onFeedback,
    }),
  )
}

describe('useLimpezaLixeira', () => {
  beforeEach(() => {
    excluirMotosDefinitivamente.mockReset()
    apagarFotosDaLixeira.mockReset()
    excluirMotosDefinitivamente.mockResolvedValue({ ok: true, erro: null, aviso: null })
    apagarFotosDaLixeira.mockResolvedValue({ aviso: null })
  })

  afterEach(cleanup)

  it('apaga de vez o que passou dos 30 dias e avisa o dono', async () => {
    const onFeedback = vi.fn()
    montar({ naLixeira: [motoDe()], fotosLixeira: [fotoDe()], onFeedback })

    await waitFor(() =>
      expect(onFeedback).toHaveBeenCalledWith({
        tipo: 'ok',
        texto:
          'O prazo de 30 dias venceu: uma moto e 1 foto do mural foram apagadas de vez.',
      }),
    )
    expect(excluirMotosDefinitivamente).toHaveBeenCalledWith(['m1'])
    expect(apagarFotosDaLixeira).toHaveBeenCalledTimes(1)
  })

  it('não mexe no que ainda está no prazo', async () => {
    const onFeedback = vi.fn()
    const dentroDoPrazo = new Date(Date.now() - 3 * DIA).toISOString()
    montar({
      naLixeira: [motoDe({ lixeiraEm: dentroDoPrazo })],
      fotosLixeira: [fotoDe({ apagadaEm: dentroDoPrazo })],
      onFeedback,
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(excluirMotosDefinitivamente).not.toHaveBeenCalled()
    expect(apagarFotosDaLixeira).not.toHaveBeenCalled()
    expect(onFeedback).not.toHaveBeenCalled()
  })

  it('espera as duas listas carregarem antes de decidir o que apagar', async () => {
    const onFeedback = vi.fn()
    const { rerender } = renderHook(
      ({ naLixeira, fotosLixeira }) =>
        useLimpezaLixeira({
          naLixeira,
          fotosLixeira,
          recarregar: vi.fn().mockResolvedValue(undefined),
          recarregarFotosLixeira: vi.fn().mockResolvedValue(undefined),
          onFeedback,
        }),
      { initialProps: { naLixeira: [motoDe()] as Motorcycle[] | null, fotosLixeira: null as FotoNaLixeira[] | null } },
    )

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(excluirMotosDefinitivamente).not.toHaveBeenCalled()

    rerender({ naLixeira: [motoDe()], fotosLixeira: [] })

    await waitFor(() => expect(excluirMotosDefinitivamente).toHaveBeenCalledTimes(1))
  })

  it('falha na exclusão vira aviso de erro, sem texto de sucesso', async () => {
    excluirMotosDefinitivamente.mockResolvedValue({
      ok: false,
      erro: 'Sem permissão para apagar.',
    })
    const onFeedback = vi.fn()

    montar({ naLixeira: [motoDe()], fotosLixeira: [], onFeedback })

    await waitFor(() =>
      expect(onFeedback).toHaveBeenCalledWith({
        tipo: 'erro',
        texto: 'Sem permissão para apagar.',
      }),
    )
  })
})
