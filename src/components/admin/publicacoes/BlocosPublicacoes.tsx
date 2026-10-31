import { ArrowRight, ImageOff, Trash2 } from 'lucide-react'
import type { EntregaRegistro } from '../../../data/entregas'
import { AreaUploadFoto } from '../AreaUploadFoto'
import { dataCurta, faltasDoRascunho } from './comum'

/**
 * ============================================================
 * MURAL — blocos e estados
 * ============================================================
 * Faixa de rascunhos, galeria e os estados de carregamento, erro e
 * vazio. Tudo o que não é o estado do mural em si.
 */

export function FaixaRascunhos({
  quantidade,
  destaque,
  publicando,
  onPublicar,
}: {
  quantidade: number
  destaque: EntregaRegistro
  publicando: boolean
  onPublicar: () => void
}) {
  const motivo = faltasDoRascunho(destaque)

  return (
    <div className="publicacoes-pendentes">
      <p className="publicacoes-pendentes-texto">
        <span
          aria-hidden="true"
          className="publicacoes-ponto publicacoes-ponto--rascunho"
        />
        <span>
          {quantidade === 1 ? '1 rascunho fora do ar' : `${quantidade} rascunhos fora do ar`}
          {quantidade === 1 ? (
            <span className="publicacoes-pendentes-motivo">
              {' · '}
              {motivo ? `${motivo.toLowerCase()} para publicar` : 'pronto para publicar'}
            </span>
          ) : null}
        </span>
      </p>

      <button
        type="button"
        onClick={onPublicar}
        disabled={publicando || motivo !== null}
        className="foco-painel publicacoes-pendentes-acao disabled:cursor-not-allowed disabled:opacity-50"
      >
        {publicando ? 'Publicando…' : 'Publicar'}
        {publicando ? null : <ArrowRight className="size-3.5" aria-hidden="true" />}
      </button>
    </div>
  )
}

export function EsqueletoPublicacoes() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando publicações…</span>
      <ul className="publicacoes-mosaico" aria-hidden="true">
        {Array.from({ length: 10 }, (_, quadro) => (
          <li
            key={quadro}
            className="publicacoes-quadro motion-safe:animate-pulse"
          />
        ))}
      </ul>
    </div>
  )
}

export function ErroPublicacoes({ erro, onTentar }: { erro: string; onTentar: () => void }) {
  return (
    <section role="alert" className="publicacoes-erro">
      <h3 className="publicacoes-erro-titulo">Não foi possível abrir as publicações.</h3>
      <p className="publicacoes-erro-texto">
        A lista não chegou do servidor. Confira a conexão e tente de novo.
      </p>
      <button
        type="button"
        onClick={onTentar}
        className="foco-painel btn btn-secondary mt-5 min-h-11 px-4 text-sm font-medium"
      >
        Tentar de novo
      </button>
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-steel-500">Detalhe técnico</summary>
        <p className="mt-2 text-xs leading-relaxed break-words text-steel-500">{erro}</p>
        <p className="mt-2 text-xs leading-relaxed text-steel-500">
          Se a tabela ainda não existe, aplique supabase/migrations/01_esquema.sql (tabela `entregas`).
        </p>
      </details>
    </section>
  )
}

export function AvisoErro({ onTentar }: { onTentar: () => void }) {
  return (
    <div role="alert" className="publicacoes-aviso">
      <p>
        <strong>A lista não atualizou.</strong> Mostrando a última carga.
      </p>
      <button
        type="button"
        onClick={onTentar}
        className="foco-painel inline-flex min-h-11 items-center px-1 text-xs font-semibold text-steel-300 transition-colors hover:text-paper"
      >
        Tentar de novo
      </button>
    </div>
  )
}

interface EntradaUploadProps {
  enviando: boolean
  onEscolher: () => void
  onTirarFoto: () => void
  onArquivos: (arquivos: FileList) => void
}

export function VazioPublicacoes({
  enviando,
  onEscolher,
  onTirarFoto,
  onArquivos,
}: EntradaUploadProps) {
  return (
    <div className="publicacoes-vazio">
      <div className="publicacoes-vazio-prova" aria-hidden="true">
        {[0, 1, 2, 3].map((quadro) => (
          <span key={quadro} className="publicacoes-vazio-quadro numeros">
            {String(quadro + 1).padStart(2, '0')}
          </span>
        ))}
      </div>

      <div>
        <p className="publicacoes-vazio-titulo">Nenhuma publicação no mural ainda.</p>
        <p className="publicacoes-vazio-descricao">
          Escolha as fotos da entrega e elas entram no mural do site.
        </p>
        <div className="mt-4">
          <AreaUploadFoto
            enviando={enviando}
            rotulo="Adicionar foto"
            resumo="Escolher da galeria ou tirar na hora"
            onEscolher={onEscolher}
            onTirarFoto={onTirarFoto}
            onArquivos={onArquivos}
          />
        </div>
      </div>
    </div>
  )
}

export function GaleriaPublicacoes({
  posts,
  removendo,
  onApagar,
}: {
  posts: EntregaRegistro[]
  removendo: boolean
  onApagar: (post: EntregaRegistro, indice: number) => void
}) {
  return (
    <ul className="publicacoes-mosaico">
      {posts.flatMap((post) => {
        const data = dataCurta(post.entregueEm)
        // "Publicação" era o nome genérico das versões antigas: é
        // ausência de informação, não um modelo de moto.
        const nome = post.motoNome === 'Publicação' ? '' : post.motoNome.trim()
        const total = Math.max(post.fotos.length, 1)
        const descricao = nome ? `da ${nome}` : 'da entrega'
        const legenda = data ? `${descricao}, em ${data}` : descricao

        return Array.from({ length: total }, (_, indice) => {
          const src = post.imagens[indice] ?? null
          const semFoto = post.fotos.length === 0
          // Quadro de publicação sem foto não apaga imagem nenhuma:
          // ele tira a publicação do mural.
          const rotuloApagar = semFoto
            ? `Tirar a publicação ${legenda} do mural`
            : `Apagar a foto ${indice + 1} ${legenda}`

          return (
            <li key={`${post.id}-${indice}`} className="publicacoes-quadro">
              {src ? (
                <img
                  src={src}
                  alt={`Foto ${indice + 1} ${legenda}`}
                  width={960}
                  height={1200}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="publicacoes-quadro-vazia" aria-hidden="true">
                  <ImageOff className="size-5" />
                  {semFoto ? 'Sem fotos' : 'Foto indisponível'}
                </span>
              )}

              <span aria-hidden="true" className="publicacoes-quadro-sombra" />

              <div className="publicacoes-quadro-info">
                {post.status !== 'publicada' ? (
                  <span className="publicacoes-quadro-fora">Fora do ar</span>
                ) : null}
                <p className="publicacoes-quadro-meta numeros">{data || 'Sem data'}</p>
              </div>

              <div className="publicacoes-quadro-acoes">
                <button
                  type="button"
                  onClick={() => onApagar(post, indice)}
                  disabled={removendo}
                  aria-label={rotuloApagar}
                  title={semFoto ? 'Tirar do mural' : 'Apagar foto'}
                  className="foco-painel publicacoes-quadro-acao publicacoes-quadro-acao--excluir"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          )
        })
      })}
    </ul>
  )
}
