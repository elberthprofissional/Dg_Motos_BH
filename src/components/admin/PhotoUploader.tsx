import { useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { BUCKET_FOTOS, getSupabase, urlPublica } from '../../lib/supabase'
import { caminhoUnico, nomeSeguro } from '../../lib/fotos'
import { temCameraNaHora } from '../../lib/dispositivo'
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
  const cameraRef = useRef<HTMLInputElement>(null)
  // Só no celular: lá o "Tirar foto" abre a câmera em vez do seletor.
  const [temCamera] = useState(temCameraNaHora)
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
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  function remover(indice: number) {
    // Tira a foto só do formulário. O arquivo no Storage é apagado
    // depois do "Salvar" (em MotoForm): apagar agora deixaria a moto do
    // banco apontando para uma foto inexistente se o dono cancelasse a
    // edição.
    onChange(fotos.filter((_, i) => i !== indice))
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
        className={`border border-dashed bg-painel-2 p-6 text-center transition-colors hover:border-brand-400/70 sm:p-8 ${
          arrastando
            ? 'border-brand-400 bg-brand-500/5'
            : 'border-line-forte'
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
        {/* Mesma trilha do upload, só que abrindo a câmera na hora: no
            pátio o dono fotografa em vez de procurar na galeria. */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => void enviar(e.target.files)}
          className="sr-only"
          id="admin-fotos-camera"
        />
        <div className="mx-auto grid size-12 place-items-center text-brand-400">
          {enviando ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-6" aria-hidden="true" />
          )}
        </div>
        <p className="mt-3 text-sm font-medium text-steel-300">
          {enviando
            ? 'Enviando fotos...'
            : temCamera
              ? 'Do celular: escolha ou tire a foto agora'
              : 'Arraste as fotos aqui ou'}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <label htmlFor="admin-fotos" className="btn btn-secondary btn-sm inline-flex cursor-pointer">
            {!enviando && <Upload className="size-4" aria-hidden="true" />}
            {enviando ? 'Aguarde' : 'Escolher fotos'}
          </label>
          {temCamera && (
            <label
              htmlFor="admin-fotos-camera"
              className="btn btn-secondary btn-sm inline-flex cursor-pointer"
            >
              {!enviando && <Camera className="size-4" aria-hidden="true" />}
              {enviando ? 'Aguarde' : 'Tirar foto'}
            </label>
          )}
        </div>
        {/* "Arraste também" só faz sentido com mouse: no celular o input de
            arquivo é o caminho, e a frase só ocupava espaço. */}
        <p className="mt-3 text-etiqueta text-steel-500">
          <span className="hidden sm:inline">Convertidas para WebP automaticamente. </span>A primeira vira a capa do anúncio.
        </p>

      </div>

      {erro && (
        <p role="alert" className="mt-2 text-xs text-red-400">
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
                className="aspect-[4/3] w-full border border-line object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-marca px-2 py-1 text-xs font-medium text-white">
                  Capa
                </span>
              )}
              <button
                type="button"
                onClick={() => remover(i)}
                aria-label={`Remover foto ${i + 1}`}
                className="absolute right-1 bottom-1 grid size-11 place-items-center bg-night-950/90 text-steel-300 transition-colors hover:text-brand-400"
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
                className="input mt-1 min-h-10 w-full text-xs"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-center text-xs text-steel-400">Nenhuma foto adicionada</p>
      )}
    </div>
  )
}
