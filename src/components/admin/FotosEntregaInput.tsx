import { useRef, useState } from 'react'
import { ImageOff, Trash2 } from 'lucide-react'
import { BUCKET_ENTREGAS, getSupabase } from '../../lib/supabase'
import { AreaUploadFoto } from './AreaUploadFoto'
import { MarcaCapa } from './MarcaCapa'

interface FotosEntregaInputProps {
  entregaId: string
  /** Caminhos no Storage, na ordem de exibição. */
  paths: string[]
  /** URLs assinadas para prévia, alinhadas por índice com `paths`. */
  urls: string[]
  descricao: string
  onChange: (paths: string[], urls: string[]) => void
}

/**
 * Comprime no navegador antes de subir: economiza o bucket e acelera
 * a galeria. Mesma regra das fotos do estoque (1600px, WebP 0.82).
 */
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

/**
 * ============================================================
 * FOTOS DA PUBLICAÇÃO — prova de contato
 * ============================================================
 * A primeira foto abre o card no mural; todas entram no carrossel,
 * na ordem em que foram enviadas. As molduras são numeradas como
 * numa prova de contato e a capa recebe a marca de lápis graxa.
 */
export function FotosEntregaInput({
  entregaId,
  paths,
  urls,
  descricao,
  onChange,
}: FotosEntregaInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function remover(index: number) {
    onChange(
      [...paths.slice(0, index), ...paths.slice(index + 1)],
      [...urls.slice(0, index), ...urls.slice(index + 1)],
    )
  }

  async function enviar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return
    setErro(null)

    const imagens = [...arquivos]
    if (imagens.some((f) => !f.type.startsWith('image/'))) {
      setErro('Só fotos: escolha arquivos de imagem.')
      return
    }
    if (imagens.some((f) => f.size > 12 * 1024 * 1024)) {
      setErro('Cada foto precisa ter até 12 MB.')
      return
    }
    if (paths.length + imagens.length > 10) {
      setErro('Até 10 fotos por post.')
      return
    }

    setEnviando(true)
    const enviados: string[] = []
    const urlsNovos: string[] = []
    try {
      const sb = getSupabase()
      if (!sb) throw new Error('Supabase não configurado neste deploy.')
      for (const arquivo of imagens) {
        const caminho = `${entregaId}/${crypto.randomUUID()}.webp`
        const blob = await comprimirFoto(arquivo)
        const { error: erroUpload } = await sb.storage
          .from(BUCKET_ENTREGAS)
          .upload(caminho, blob, { contentType: 'image/webp', upsert: false })
        if (erroUpload) throw erroUpload
        const { data, error: erroAssinatura } = await sb.storage
          .from(BUCKET_ENTREGAS)
          .createSignedUrl(caminho, 60 * 60 * 24)
        if (erroAssinatura) throw erroAssinatura
        enviados.push(caminho)
        urlsNovos.push(data.signedUrl ?? '')
      }

      // Falha parcial: as que subiram mantêm-se; as restantes cancelam.
      if (urlsNovos.some((url) => !url)) {
        await sb.storage.from(BUCKET_ENTREGAS).remove(enviados)
        throw new Error('Não foi possível preparar todas as fotos. Tente de novo.')
      }

      onChange([...paths, ...enviados], [...urls, ...urlsNovos])
    } catch (e) {
      if (enviados.length > 0) {
        await getSupabase()?.storage.from(BUCKET_ENTREGAS).remove(enviados)
      }
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar as fotos.')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  return (
    <div>
      {paths.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          {paths.map((path, index) => (
            <div key={path}>
              <div className="relative aspect-[4/5] overflow-hidden bg-painel-2">
                {urls[index] ? (
                  <img
                    src={urls[index]}
                    alt={
                      descricao
                        ? `Foto ${index + 1} da ${descricao}${index === 0 ? ', capa' : ''}`
                        : `Foto ${index + 1} da publicação${index === 0 ? ', capa' : ''}`
                    }
                    className="size-full object-cover"
                    width={640}
                    height={800}
                  />
                ) : (
                  <span className="grid size-full place-items-center text-steel-600">
                    <ImageOff className="size-4" aria-hidden="true" />
                  </span>
                )}

                {index === 0 ? (
                  <MarcaCapa className="pointer-events-none absolute inset-2 text-brand-400" />
                ) : null}

                <button
                  type="button"
                  onClick={() => remover(index)}
                  disabled={enviando}
                  aria-label={`Remover foto ${index + 1}`}
                  className="foco-painel absolute top-1.5 right-1.5 grid size-11 place-items-center bg-night-950/90 text-steel-300 transition-colors hover:bg-night-950 hover:text-brand-400 disabled:cursor-wait disabled:opacity-40"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              {/* Legenda da prova de contato: número da moldura e a
                  marca de capa, não um selo de interface. */}
              <div className="flex items-center justify-between gap-2 border-b border-line py-2">
                <span
                  className={`numeros text-[11px] ${
                    index === 0 ? 'text-brand-400' : 'text-steel-600'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                {index === 0 ? (
                  <span className="text-[11px] font-medium text-brand-400">capa</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Os inputs nativos ficam fora da árvore de acessibilidade: o
          controle real é o retângulo de upload, e o texto "Nenhum
          arquivo escolhido" não deve vazar para a tela. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void enviar(e.currentTarget.files)}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void enviar(e.currentTarget.files)}
        className="hidden"
      />
      <AreaUploadFoto
        enviando={enviando}
        compacto={paths.length > 0}
        onEscolher={() => inputRef.current?.click()}
        onTirarFoto={() => cameraRef.current?.click()}
        onArquivos={(arquivos) => void enviar(arquivos)}
      />

      {erro ? <p role="alert" className="mt-2 text-sm text-red-400">{erro}</p> : null}
    </div>
  )
}
