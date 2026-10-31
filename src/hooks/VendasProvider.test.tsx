// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VendasProvider } from './VendasProvider'
import { useVendas } from './vendasContexto'

/**
 * `sales` é a tabela em que 0 linhas significa duas coisas diferentes:
 * "o RLS barrou" e "não tinha nada ali". O painel só pode pedir a
 * migration no primeiro caso — no segundo, a moto simplesmente nunca
 * teve venda lançada, e avisar o dono para rodar um SQL que já está
 * aplicado só gera suporte à toa.
 *
 * O mock é uma cadeia do PostgREST com fila por operação: `.select`,
 * `.update` e `.delete` tiram a resposta da fila própria, na ordem em
 * que o código os chama.
 */

interface Resposta {
  data: unknown
  error: unknown
}

const { fila, sbComFilas } = vi.hoisted(() => {
  const fila = {
    inicial: [] as Resposta[],
    select: [] as Resposta[],
    update: [] as Resposta[],
    delete: [] as Resposta[],
  }

  function sbComFilas() {
    // Cada `from()` é uma consulta: a operação é decidida ali dentro.
    return {
      from: () => {
        let operacao: keyof typeof fila = 'select'
        // `.update(…).eq(…).select('id')` não volta a ser leitura: quem
        // manda é a primeira operação da cadeia, como no PostgREST.
        let escrita = false
        const proxima = () => fila[operacao].shift() ?? { data: [], error: null }

        const cadeia = {
          select: () => {
            if (!escrita) operacao = 'select'
            return cadeia
          },
          update: () => {
            escrita = true
            operacao = 'update'
            return cadeia
          },
          delete: () => {
            escrita = true
            operacao = 'delete'
            return cadeia
          },
          // O carregamento inicial é o único que passa por `.order`.
          order: () => {
            operacao = 'inicial'
            return cadeia
          },
          eq: () => cadeia,
          single: () => cadeia,
          then: (aoResolver?: (r: Resposta) => unknown, aoFalhar?: (e: unknown) => unknown) =>
            Promise.resolve(proxima()).then(aoResolver, aoFalhar),
        }

        return cadeia
      },
    }
  }

  return { fila, sbComFilas }
})

// Singleton, como o cliente real: `getSupabase` devolve o mesmo objeto
// a cada chamada, e o efeito do provider depende dele.
vi.mock('../lib/supabase', () => {
  let cliente: unknown = null
  return { getSupabase: () => (cliente ??= sbComFilas()) }
})

const VENDA = {
  id: 'v1',
  motorcycle_id: 'm1',
  marca: 'Honda',
  modelo: 'CG 160 Fan',
  ano: 2023,
  valor: 17900,
  forma_pagamento: 'pix',
  comprador: 'João',
  telefone: null,
  custo: null,
  vendida_em: '2026-01-10T12:00:00.000Z',
}

function montar() {
  return renderHook(() => useVendas(), { wrapper: VendasProvider })
}

describe('VendasProvider — desvincular e excluir', () => {
  beforeEach(() => {
    fila.inicial = []
    fila.select = []
    fila.update = []
    fila.delete = []
  })

  afterEach(cleanup)

  it('moto que nunca teve venda não gera pedido de migration', async () => {
    // Sem venda nenhuma na lista, e a procura por venda da moto vem vazia.
    fila.inicial = [{ data: [], error: null }]
    fila.select = [{ data: [], error: null }]

    const { result } = montar()
    await waitFor(() => expect(result.current.carregando).toBe(false))

    // O update não pode nem ser tentado: não havia nada a desvincular.
    await expect(result.current.desvincularVenda('m1')).resolves.toBeNull()
    expect(fila.update).toHaveLength(0)
  })

  it('venda vinculada é desvinculada e segue no histórico', async () => {
    fila.inicial = [{ data: [VENDA], error: null }]
    fila.select = [{ data: [{ id: 'v1' }], error: null }]
    fila.update = [{ data: [{ id: 'v1' }], error: null }]

    const { result } = montar()
    await waitFor(() => expect(result.current.vendas).toHaveLength(1))

    await expect(result.current.desvincularVenda('m1')).resolves.toBeNull()
    await waitFor(() => expect(result.current.vendas[0].motoId).toBeNull())
  })

  it('update recusado pelo RLS continua avisando para aplicar a migration', async () => {
    fila.inicial = [{ data: [VENDA], error: null }]
    fila.select = [{ data: [{ id: 'v1' }], error: null }]
    fila.update = [{ data: [], error: null }]

    const { result } = montar()
    await waitFor(() => expect(result.current.vendas).toHaveLength(1))

    const motivo = await result.current.desvincularVenda('m1')
    expect(motivo).toContain('02_seguranca_e_storage.sql')
    // A lista não muda: nada foi desvinculado de verdade.
    expect(result.current.vendas[0].motoId).toBe('m1')
  })

  it('excluir venda que já não existe é sucesso, não recusa', async () => {
    fila.inicial = [{ data: [VENDA], error: null }]
    fila.select = [{ data: [], error: null }]

    const { result } = montar()
    await waitFor(() => expect(result.current.vendas).toHaveLength(1))

    await expect(result.current.excluirVenda('v1')).resolves.toBeNull()
    // O delete nem é tentado sobre uma linha que não existe.
    expect(fila.delete).toHaveLength(0)
    expect(result.current.vendas).toHaveLength(1)
  })

  it('delete recusado pelo RLS não anuncia exclusão', async () => {
    fila.inicial = [{ data: [VENDA], error: null }]
    fila.select = [{ data: [{ id: 'v1' }], error: null }]
    fila.delete = [{ data: [], error: null }]

    const { result } = montar()
    await waitFor(() => expect(result.current.vendas).toHaveLength(1))

    const motivo = await result.current.excluirVenda('v1')
    expect(motivo).toContain('02_seguranca_e_storage.sql')
    expect(result.current.vendas).toHaveLength(1)
  })

  it('delete aceito tira a venda da lista', async () => {
    fila.inicial = [{ data: [VENDA], error: null }]
    fila.select = [{ data: [{ id: 'v1' }], error: null }]
    fila.delete = [{ data: [{ id: 'v1' }], error: null }]

    const { result } = montar()
    await waitFor(() => expect(result.current.vendas).toHaveLength(1))

    await expect(result.current.excluirVenda('v1')).resolves.toBeNull()
    await waitFor(() => expect(result.current.vendas).toHaveLength(0))
  })
})
