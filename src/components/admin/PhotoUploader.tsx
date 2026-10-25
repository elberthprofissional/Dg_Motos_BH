import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { BUCKET_FOTOS, getSupabase, urlPublica } from '../../lib/supabase'
import { caminhoUnico, nomeSeguro } from '../../lib/fotos'
import type { FotoSaida } from '../../lib/fotos'
import { AreaUploadFoto } from './AreaUploadFoto'

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
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => void enviar(e.currentTarget.files)}
        className="sr-only"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => void enviar(e.currentTarget.files)}
        className="sr-only"
      />
      <AreaUploadFoto
        enviando={enviando}
        resumo={
          fotos.length > 0
            ? `${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'} · a primeira é a capa`
            : undefined
        }
        onEscolher={() => inputRef.current?.click()}
        onTirarFoto={() => cameraRef.current?.click()}
        onArquivos={(arquivos) => void enviar(arquivos)}
      />

      {erro && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {erro}
        </p>
      )}

      {fotos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {fotos.map((foto, i) => (
            <li key={foto.src} className="min-w-0">
              {/* A imagem, o selo e a lixeira vivem no mesmo cartão
                  recortado; o campo de descrição fica fora dele, então
                  a lixeira nunca cobre o texto. */}
              <div className="relative overflow-hidden rounded-[0.75rem] border border-line bg-night-950">
                <img
                  src={foto.src}
                  alt={foto.alt || `Foto ${i + 1}`}
                  className="aspect-square w-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-[0.375rem] bg-marca px-2 py-1 text-[0.65rem] font-semibold tracking-wide text-white uppercase">
                    Capa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remover(i)}
                  aria-label={`Remover foto ${i + 1}`}
                  className="absolute top-2 right-2 grid size-11 place-items-center rounded-[0.5rem] bg-night-950/80 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-marca active:bg-marca-forte"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              <input
                type="text"
                value={foto.alt}
                onChange={(e) =>
                  onChange(fotos.map((f, j) => (j === i ? { ...f, alt: e.target.value } : f)))
                }
                aria-label={`Descrição da foto ${i + 1}`}
                placeholder="Descreva a foto"
                className="input mt-2 min-h-10 w-full text-xs"
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
