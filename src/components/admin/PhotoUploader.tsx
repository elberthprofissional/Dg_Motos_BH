import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { BUCKET_FOTOS, getSupabase, urlPublica } from '../../lib/supabase'
import { caminhoDeBucket, caminhoUnico, nomeSeguro } from '../../lib/fotos'
import type { FotoSaida } from '../../lib/fotos'

/**
 * ============================================================
 * UPLOAD DE FOTOS
 * ============================================================
 * Sobe imagens para o bucket `motos` do Supabase Storage e devolve a
 * URL pública, no mesmo formato que o site já consome
 * (`{ src, alt }` em `imagens[]`).
 *
 * A imagem é recomprimida no navegador antes do envio: foto de celular
 * tem 4-8 MB, e o cliente de uma concessionaria precisa carregar rápido
 * no 4G. O canvas converte para WebP e corta para 1280px de largura,
 * o mesmo alvo do scripts/convert-images.mjs.
 */

const LARGURA_MAX = 1280
const QUALIDADE = 0.78
const TAMANHO_MAX_MB = 12

async function comprimir(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo)
  const escala = Math.min(1, LARGURA_MAX / bitmap.width)
  const w = Math.round(bitmap.width * escala)
  const h = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Navegador não suporta canvas.')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, 'image/webp', QUALIDADE),
  )
  if (!blob) throw new Error('Falha ao converter a imagem.')
  return blob
}

interface PhotoUploaderProps {
  slug: string
  fotos: FotoSaida[]
  onChange: (fotos: FotoSaida[]) => void
}

export function PhotoUploader({ slug, fotos, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)

  async function enviar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return
    setErro(null)
    setEnviando(true)

    try {
      const sb = getSupabase()
      if (!sb) throw new Error('Supabase não configurado.')

      const novas: FotoSaida[] = []

      for (const arquivo of Array.from(arquivos)) {
        if (!arquivo.type.startsWith('image/')) {
          throw new Error(`"${arquivo.name}" não é uma imagem.`)
        }
        if (arquivo.size > TAMANHO_MAX_MB * 1024 * 1024) {
          throw new Error(`"${arquivo.name}" passa de ${TAMANHO_MAX_MB} MB.`)
        }

        const blob = await comprimir(arquivo)
        const caminho = caminhoUnico(
          `${slug}/${nomeSeguro(arquivo.name)}.webp`,
          [...fotos, ...novas],
        )

        const { error } = await sb.storage
          .from(BUCKET_FOTOS)
          .upload(caminho, blob, { contentType: 'image/webp', upsert: true })

        if (error) throw error

        novas.push({ src: urlPublica(caminho), alt: '' })
      }

      onChange([...fotos, ...novas])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha no envio.')
    } finally {
      setEnviando(false)
      // Permite reenviar o mesmo arquivo depois de corrigir.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remover(indice: number) {
    const foto = fotos[indice]
    onChange(fotos.filter((_, i) => i !== indice))

    // Foto do seed (`/motos/...`) não existe no Storage: só tenta apagar
    // o que for mesmo uma URL do bucket.
    const sb = getSupabase()
    const caminho = caminhoDeBucket(foto.src)
    if (sb && caminho && caminho.startsWith(`${slug}/`)) {
      await sb.storage.from(BUCKET_FOTOS).remove([caminho])
    }
  }

  return (
    <div>
      <span className="field-label">Fotos (a primeira é a capa)</span>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          void enviar(e.dataTransfer.files)
        }}
        className={`rounded-lg border border-dashed p-4 text-center transition-colors ${
          arrastando ? 'border-brand-500 bg-brand-500/5' : 'border-white/15'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => void enviar(e.target.files)}
          className="sr-only"
          id="admin-fotos"
        />
<label
          htmlFor="admin-fotos"
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded bg-night-800 px-4 py-2 text-sm font-medium text-steel-300 transition-colors hover:text-paper"
        >
          {enviando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {enviando ? 'Enviando...' : 'Escolher fotos'}
        </label>
        {/* "Arraste também" só faz sentido com mouse: no celular o input de
            arquivo é o caminho, e a frase só ocupava espaço. */}
        <p className="mt-2 text-[11px] text-steel-500">
          <span className="hidden sm:inline">Arraste também. </span>
          Convertidas para WebP automaticamente. A primeira vira a capa do anúncio.
        </p>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-xs text-brand-500">
          {erro}
        </p>
      )}

      {fotos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fotos.map((foto, i) => (
            <li key={foto.src} className="relative">
              <img
                src={foto.src}
                alt={foto.alt || `Foto ${i + 1}`}
                className="aspect-[4/3] w-full rounded border border-white/10 object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                  Capa
                </span>
              )}
              <button
                type="button"
                onClick={() => void remover(i)}
                aria-label={`Remover foto ${i + 1}`}
                className="absolute right-1 bottom-1 grid size-9 place-items-center rounded bg-night-950/90 text-steel-300 transition-colors hover:text-brand-500 sm:size-7"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
              <input
                type="text"
                value={foto.alt}
                onChange={(e) =>
                  onChange(fotos.map((f, j) => (j === i ? { ...f, alt: e.target.value } : f)))
                }
                placeholder="Descreva a foto"
                className="mt-1 w-full rounded border border-white/10 bg-night-950 px-2 py-1 text-[11px] text-steel-300 placeholder:text-steel-600"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-xs text-steel-500">
          <ImagePlus className="size-4" aria-hidden="true" />
          Nenhuma foto ainda. Sem foto, o site mostra o placeholder "FOTO EM BREVE".
        </p>
      )}
    </div>
  )
}