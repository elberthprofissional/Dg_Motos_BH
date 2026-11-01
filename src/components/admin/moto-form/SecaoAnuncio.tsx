import type { MotoParaSalvar } from '../../../lib/catalog'
import { campoLinha } from '../campoLinha'
import { PhotoUploader } from '../PhotoUploader'
import { Secao } from './Secao'

/**
 * ============================================================
 * 4. ANÚNCIO — texto livre e fotos
 * ============================================================
 */

export function SecaoAnuncio({
  form,
  onSet,
  onFotos,
}: {
  form: MotoParaSalvar
  onSet: <K extends keyof MotoParaSalvar>(chave: K, valor: MotoParaSalvar[K]) => void
  /** Chamado junto ao grupo de fotos, antes de atualizar o estado. */
  onFotos: (fotos: MotoParaSalvar['imagens']) => void
}) {
  return (
    <Secao titulo="Fotos e anúncio">
      <div>
        <label htmlFor="f-desc" className="field-label">Texto do anúncio</label>
        <textarea
          id="f-desc"
          rows={5}
          className={`${campoLinha} leading-relaxed`}
          value={form.descricao}
          onChange={(e) => onSet('descricao', e.target.value)}
          placeholder="Condição, revisões, o que acompanha a moto. Esse texto aparece na ficha e no Google."
        />
      </div>
      <PhotoUploader
        slug={form.slug || 'sem-slug'}
        fotos={form.imagens}
        onChange={onFotos}
      />
    </Secao>
  )
}
