import { useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { BUCKET_ENTREGAS, getSupabase } from '../../lib/supabase'
import { temCameraNaHora } from '../../lib/dispositivo'

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
 * FOTOS DO POST — galeria estilo Instagram
 * ============================================================
 * O post de "Realizando Sonhos" aceita várias fotos: a primeira é
 * a capa do cartão no mural e as demais entram no carrossel. Cada
 * miniatura se apaga individualmente; a entrada é por lote (o
 * seletor aceita vários arquivos de uma vez, como um post do
 * Instagram).
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
  // Só no celular: lá o "Tirar foto" abre a câmera em vez do seletor.
  const [temCamera] = useState(temCameraNaHora)
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
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {paths.map((path, index) => (
            <div
              key={path}
              className="relative aspect-[4/3] overflow-hidden border border-line bg-painel-2"
            >
              {urls[index] ? (
                <img
                  src={urls[index]}
                  alt={descricao ? `Foto ${index + 1} do post ${descricao}` : `Foto ${index + 1} do post`}
                  className="size-full object-cover"
                />
              ) : null}
              {index === 0 ? (
                /* A capa é a ordem: a primeira foto pende no cartão
                    do mural; as outras abrem no carrossel. */
                <span className="absolute left-0 top-0 bg-night-950/85 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-paper uppercase">
                  Capa
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => remover(index)}
                aria-label={`Remover foto ${index + 1}`}
                className="foco-painel grid size-9 place-items-center border border-line-forte bg-night-950/95 text-steel-300 transition-colors hover:border-red-400/50 hover:text-red-300"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Quem escolhe as fotos é o painel inteiro: <label> clicável. */}
      <label
        htmlFor={`fotos-post-${entregaId}`}
        className={`foco-entrega-foto group flex cursor-pointer items-center gap-4 border border-dashed border-line-forte bg-painel-2 p-4 transition-colors focus-within:border-brand-400/80 focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-brand-400 ${
          enviando ? 'pointer-events-none opacity-70' : 'hover:border-brand-400/60 hover:bg-painel-3'
        }`}
      >
        <input
          ref={inputRef}
          id={`fotos-post-${entregaId}`}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => void enviar(e.currentTarget.files)}
          className="sr-only"
        />
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center border border-line bg-night-950 text-brand-400">
          {enviando ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-paper">
            {enviando ? 'Enviando fotos…' : paths.length > 0 ? 'Adicionar mais fotos' : 'Escolher as fotos'}
          </span>
          <span className="mt-1 block text-xs leading-snug text-steel-400">
            {paths.length > 0
              ? `${paths.length} no post · a primeira vira a capa do mural`
              : 'Quantas quiser (até 10). A primeira vira a capa do mural.'}
          </span>
          <span className="mt-1 block text-xs text-steel-500">JPG, PNG ou WebP · até 12 MB cada</span>
        </span>
      </label>
      {/* Na entrega a foto é tirada na hora, com a moto e o cliente na
          frente — a galeria é o caminho do que já foi fotografado. */}
      {temCamera ? (
        <label
          htmlFor={`camera-post-${entregaId}`}
          className={`foco-painel mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-line bg-painel-2 text-sm font-medium text-steel-300 transition-colors hover:border-line-forte hover:text-paper ${
            enviando ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <input
            ref={cameraRef}
            id={`camera-post-${entregaId}`}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => void enviar(e.currentTarget.files)}
            className="sr-only"
          />
          {enviando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-4" aria-hidden="true" />
          )}
          {enviando ? 'Enviando foto…' : 'Tirar foto agora'}
        </label>
      ) : null}

      {erro ? <p role="alert" className="mt-2 text-sm text-red-400">{erro}</p> : null}
    </div>
  )
}
