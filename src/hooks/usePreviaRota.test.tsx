// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Motorcycle } from '../types'
import type { Feedback } from '../components/ui/Toast'

import { usePreviaRota } from './usePreviaRota'

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

function Prova({
  ativas,
  onFeedback,
}: {
  ativas: Motorcycle[] | null
  onFeedback: (feedback: Feedback) => void
}) {
  const { previaId, motoDaPrevia } = usePreviaRota({ ativas, onFeedback })
  return <p>{`${previaId ?? 'sem-rota'}|${motoDaPrevia?.id ?? 'sem-moto'}`}</p>
}

function abrir(rota: string, ativas: Motorcycle[] | null, onFeedback = vi.fn()) {
  render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/admin" element={<p>mesa de estoque</p>} />
        <Route path="/admin/*" element={<Prova ativas={ativas} onFeedback={onFeedback} />} />
      </Routes>
    </MemoryRouter>,
  )
  return onFeedback
}

describe('usePreviaRota', () => {
  beforeAll(() => {
    window.scrollTo = vi.fn()
  })

  afterEach(cleanup)

  it('resolve a moto da prévia pelo endereço', async () => {
    abrir('/admin/estoque/m1', [motoDe()])

    // Espera o efeito de rolagem rodar e o estado assentar.
    await waitFor(() => expect(screen.getByText('m1|m1')).toBeTruthy())
  })

  it('enquanto o catálogo carrega, a prévia não é dada como órfã', () => {
    const onFeedback = abrir('/admin/estoque/m1', null)

    expect(screen.getByText('m1|sem-moto')).toBeTruthy()
    expect(onFeedback).not.toHaveBeenCalled()
  })

  it('moto que saiu do pátio devolve o dono à lista com aviso', async () => {
    const onFeedback = abrir('/admin/estoque/m9', [motoDe()])

    await waitFor(() => expect(screen.getByText('mesa de estoque')).toBeTruthy())
    expect(onFeedback).toHaveBeenCalledWith({
      tipo: 'erro',
      texto: 'Essa moto não está mais no estoque.',
    })
  })

  it('rota desconhecida dentro do painel volta para o estoque', async () => {
    const onFeedback = abrir('/admin/qualquer-coisa', [motoDe()])

    await waitFor(() => expect(screen.getByText('mesa de estoque')).toBeTruthy())
    expect(onFeedback).not.toHaveBeenCalled()
  })
})
