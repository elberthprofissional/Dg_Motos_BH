import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { BUCKET_ENTREGAS, getSupabase } from '../../lib/supabase'

interface FotoEntregaInputProps {
  entregaId: string
  url: string | null
  descricao: string
  onChange: (path: string | null, url: string | null) => void
}

async function comprimirFoto(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo)
  try {
    const escala = Math.min(1, 1600 / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('Este navegador não conseguiu preparar a foto.')
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const resultado = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.82),
    )
    if (!resultado) throw new Error('Não foi possível converter a foto.')
    return resultado
  } finally {
    bitmap.close()
  }
}

export function FotoEntregaInput({ entregaId, url, descricao, onChange }: FotoEntregaInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(arquivo?: File) {
    if (!arquivo) return
    setErro(null)
    if (!arquivo.type.startsWith('image/')) {
      setErro('Escolha um arquivo de imagem.')
      return
    }
    if (arquivo.size > 12 * 1024 * 1024) {
      setErro('A foto precisa ter até 12 MB.')
      return
    }

    setEnviando(true)
    let caminho: string | null = null
    try {
      const sb = getSupabase()
      if (!sb) throw new Error('Supabase não configurado neste deploy.')
      caminho = `${entregaId}/${crypto.randomUUID()}.webp`
      const blob = await comprimirFoto(arquivo)
      const { error: erroUpload } = await sb.storage
        .from(BUCKET_ENTREGAS)
        .upload(caminho, blob, { contentType: 'image/webp', upsert: false })
      if (erroUpload) throw erroUpload

      const { data, error: erroAssinatura } = await sb.storage
        .from(BUCKET_ENTREGAS)
        .createSignedUrl(caminho, 60 * 60 * 24)
      if (erroAssinatura) throw erroAssinatura
      onChange(caminho, data.signedUrl)
    } catch (e) {
      if (caminho) await getSupabase()?.storage.from(BUCKET_ENTREGAS).remove([caminho])
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar a foto.')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <span className="field-label">Foto da entrega</span>
      {url ? (
        <div className="relative max-w-xl">
          <img
            src={url}
            alt={descricao ? `Foto da entrega: ${descricao}` : 'Prévia da foto da entrega'}
            className="aspect-[4/3] max-h-[26rem] w-full border border-line object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null, null)}
            aria-label="Remover foto da entrega"
            className="foco-painel absolute right-3 bottom-3 inline-flex min-h-11 items-center gap-2 border border-line-forte bg-night-950/95 px-3 text-sm text-paper"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remover foto
          </button>
        </div>
      ) : (
        <div className="max-w-xl border border-dashed border-line-forte bg-painel-2 p-6 sm:p-8">
          <input
            ref={inputRef}
            id="foto-entrega"
            type="file"
            accept="image/*"
            onChange={(e) => void enviar(e.currentTarget.files?.[0])}
            className="sr-only"
          />
          <div className="flex flex-col items-center text-center">
            {enviando ? (
              <Loader2 className="size-7 animate-spin text-brand-400" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-7 text-brand-400" aria-hidden="true" />
            )}
            <p className="mt-3 text-sm text-steel-300">
              {enviando ? 'Enviando foto…' : 'A foto fica privada até você publicar a entrega.'}
            </p>
            <label
              htmlFor="foto-entrega"
              className="btn btn-secondary btn-sm mt-4 inline-flex min-h-11 cursor-pointer"
            >
              <Upload className="size-4" aria-hidden="true" />
              {enviando ? 'Aguarde' : 'Escolher foto'}
            </label>
            <span className="mt-3 text-xs text-steel-500">JPG, PNG ou WebP · até 12 MB</span>
          </div>
        </div>
      )}
      {erro ? <p role="alert" className="mt-2 text-sm text-red-400">{erro}</p> : null}
    </div>
  )
}
