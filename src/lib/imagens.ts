/**
 * Regra única de compressão das fotos enviadas pelo painel.
 *
 * Estoque e mural usam o mesmo alvo: foto de celular chega com 4–8 MB,
 * o canvas reduz o MAIOR lado para 1600px e converte para WebP 0.82
 * antes do upload. Antes cada fluxo tinha números próprios e a mesma
 * foto saía diferente conforme a aba.
 */
export const FOTO_LADO_MAX = 1600
export const FOTO_QUALIDADE = 0.82
export const FOTO_TAMANHO_MAX_MB = 12

export async function comprimirParaWebp(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo)
  try {
    const escala = Math.min(1, FOTO_LADO_MAX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('Este navegador não conseguiu preparar a foto.')
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const resultado = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', FOTO_QUALIDADE),
    )
    if (!resultado) throw new Error('Não foi possível converter a foto.')
    return resultado
  } finally {
    bitmap.close()
  }
}
