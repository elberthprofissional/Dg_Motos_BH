import { beforeEach, describe, expect, it, vi } from 'vitest'
import { excluirFotosAdicionadas, excluirFotosRemovidas } from './catalog'

/**
 * O upload de fotos acontece antes do "Salvar" — quem cancela ou fecha
 * o formulário precisa apagar do Storage os arquivos que subiram nesta
 * sessão. Estes testes garantem que só os arquivos NOVOS saem:
 * · cancelar não pode apagar foto que já estava na moto;
 * · salvar não pode apagar foto nova que entrou no formulário.
 */

const { remove } = vi.hoisted(() => ({ remove: vi.fn() }))

vi.mock('./supabase', () => ({
  getSupabase: () => ({ storage: { from: () => ({ remove }) } }),
  urlPublica: (caminho: string) => `https://storage.local/motos/${caminho}`,
  BUCKET_FOTOS: 'motos',
}))

const fotoDoBucket = (caminho: string) => ({
  src: `https://projeto.supabase.co/storage/v1/object/public/motos/${caminho}`,
})
const fotoDoSeed = (caminho: string) => ({ src: `/motos/${caminho}` })

describe('excluirFotosAdicionadas', () => {
  beforeEach(() => remove.mockReset().mockResolvedValue({ error: null }))

  it('apaga do Storage só as fotos enviadas nesta sessão', async () => {
    await excluirFotosAdicionadas(
      [fotoDoBucket('honda/titan-2022/01.webp')],
      [
        fotoDoBucket('honda/titan-2022/01.webp'),
        fotoDoBucket('honda/titan-2022/02.webp'),
      ],
    )

    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith(['honda/titan-2022/02.webp'])
  })

  it('não apaga nada quando o formulário não ganhou foto nova', async () => {
    await excluirFotosAdicionadas(
      [fotoDoBucket('honda/titan-2022/01.webp')],
      [fotoDoBucket('honda/titan-2022/01.webp')],
    )
    expect(remove).not.toHaveBeenCalled()
  })

  it('ignora foto do seed local, que não está no bucket', async () => {
    await excluirFotosAdicionadas([], [fotoDoSeed('honda-xre-300-2021/01.webp')])
    expect(remove).not.toHaveBeenCalled()
  })
})

describe('excluirFotosRemovidas', () => {
  beforeEach(() => remove.mockReset().mockResolvedValue({ error: null }))

  it('apaga do Storage as fotos que saíram do formulário', async () => {
    await excluirFotosRemovidas(
      [
        fotoDoBucket('honda/titan-2022/01.webp'),
        fotoDoBucket('honda/titan-2022/02.webp'),
      ],
      [fotoDoBucket('honda/titan-2022/02.webp')],
    )

    expect(remove).toHaveBeenCalledWith(['honda/titan-2022/01.webp'])
  })
})
