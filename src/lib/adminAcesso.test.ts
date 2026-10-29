import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consultarSeAdmin } from './adminAcesso'

/**
 * A resposta é tri-estado de propósito:
 *   true  → entra no painel;
 *   false → login é desfeito com aviso;
 *   null  → não deu para perguntar (banco antigo/fora do ar); não
 *           bloqueia, porque o RLS continua barrando quem não é admin.
 */

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('./supabase', () => ({
  getSupabase: () => ({ rpc }),
}))

describe('consultarSeAdmin', () => {
  beforeEach(() => rpc.mockReset())

  it('é admin quando o banco responde true', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    await expect(consultarSeAdmin()).resolves.toBe(true)
    expect(rpc).toHaveBeenCalledWith('sou_admin')
  })

  it('não é admin quando o banco responde false', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(consultarSeAdmin()).resolves.toBe(false)
  })

  it('devolve null quando o banco não respondeu', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    rpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'function public.sou_admin() does not exist' },
    })

    await expect(consultarSeAdmin()).resolves.toBeNull()
    expect(aviso).toHaveBeenCalled()
    aviso.mockRestore()
  })
})
