import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  agendarPublicacao,
  definirHookUrlParaTeste,
  estadoPublicacao,
  observarPublicacao,
  publicacaoDisponivel,
  resetPublicacao,
  ATRASO_DEBOUNCE_MS,
} from './publicar'

const HOOK = 'https://api.vercel.com/v1/integrations/deploy/hook-teste'

describe('publicar (debounce do deploy hook)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    definirHookUrlParaTeste(HOOK)
  })

  afterEach(() => {
    // Zera timers pendentes e estado entre os casos para não vazar.
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    resetPublicacao()
  })

  it('sem hook configurado, agendar não faz nada', async () => {
    definirHookUrlParaTeste(null)
    expect(publicacaoDisponivel()).toBe(false)

    const visto: string[] = []
    observarPublicacao((e) => visto.push(e.fase))
    agendarPublicacao()
    await vi.advanceTimersByTimeAsync(ATRASO_DEBOUNCE_MS * 2)

    expect(visto).toEqual([])
    expect(estadoPublicacao().fase).toBe('ociosa')
  })

  it('hook em branco/espaços também conta como não configurado', () => {
    definirHookUrlParaTeste('   ')
    expect(publicacaoDisponivel()).toBe(false)
  })

  it('aguarda o debounce, dispara o POST e termina em publicado', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)

    const visto: string[] = []
    observarPublicacao((e) => visto.push(e.fase))

    agendarPublicacao()
    expect(estadoPublicacao().fase).toBe('aguardando')

    // Antes do debounce: nada de fetch.
    await vi.advanceTimersByTimeAsync(ATRASO_DEBOUNCE_MS - 1)
    expect(fetchMock).not.toHaveBeenCalled()

    // No fim do debounce: dispara.
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const chamada = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(chamada[0]).toBe(HOOK)
    expect(chamada[1].method).toBe('POST')

    await vi.advanceTimersByTimeAsync(0)
    expect(estadoPublicacao().fase).toBe('publicado')
    expect(visto).toEqual(['aguardando', 'publicando', 'publicado'])
  })

  it('salvar várias vezes adia o build (um único POST no fim)', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)

    agendarPublicacao()
    await vi.advanceTimersByTimeAsync(ATRASO_DEBOUNCE_MS - 1000)

    agendarPublicacao() // segundo save: recomeça a contagem
    await vi.advanceTimersByTimeAsync(ATRASO_DEBOUNCE_MS - 1000)
    expect(fetchMock).not.toHaveBeenCalled()

    agendarPublicacao() // terceiro save
    await vi.advanceTimersByTimeAsync(ATRASO_DEBOUNCE_MS)
    await vi.advanceTimersByTimeAsync(0)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(estadoPublicacao().fase).toBe('publicado')
  })

  it('erro do hook termina em erro com mensagem', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 500 })))
    vi.stubGlobal('fetch', fetchMock)

    agendarPublicacao()
    await vi.advanceTimersByTimeAsync(ATRASO_DEBOUNCE_MS)
    await vi.advanceTimersByTimeAsync(0)

    const e = estadoPublicacao()
    expect(e.fase).toBe('erro')
    if (e.fase === 'erro') expect(e.mensagem).toMatch(/500/)
  })

  it('falha de rede termina em erro (sem quebrar)', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('offline')))
    vi.stubGlobal('fetch', fetchMock)

    agendarPublicacao()
    await vi.advanceTimersByTimeAsync(ATRASO_DEBOUNCE_MS)
    await vi.advanceTimersByTimeAsync(0)

    expect(estadoPublicacao().fase).toBe('erro')
  })
})
