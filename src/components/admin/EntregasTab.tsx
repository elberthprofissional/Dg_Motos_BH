import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, ArrowLeft, CalendarDays, ImagePlus, Plus, Send, ShieldCheck } from 'lucide-react'
import type { Motorcycle } from '../../types'
import type { EntregaParaSalvar } from '../../lib/entregas'
import { arquivarEntrega, buscarEntregasAdmin, removerFotoEntrega, salvarEntrega } from '../../lib/entregas'
import type { EntregaRegistro, StatusEntrega } from '../../data/entregas'
import { bikeTitle } from '../../lib/format'
import { BUCKET_ENTREGAS, getSupabase } from '../../lib/supabase'
import type { Feedback } from '../ui/Toast'
import { FotoEntregaInput } from './FotoEntregaInput'

interface EntregasTabProps {
  motos: Motorcycle[]
  onFeedback: (feedback: Feedback) => void
}

type FiltroEntrega = 'todas' | StatusEntrega

const rotuloStatus: Record<StatusEntrega, string> = {
  rascunho: 'Rascunho',
  publicada: 'No site',
  arquivada: 'Arquivada',
}

function dataCurta(data: string): string {
  if (!data) return ''
  const valor = new Date(`${data}T12:00:00`)
  return Number.isNaN(valor.valueOf())
    ? ''
    : new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(valor)
}

function novoRegistro(ordem: number): EntregaRegistro {
  return {
    id: crypto.randomUUID(),
    moto: '',
    fotoPath: null,
    imagemUrl: null,
    nomeCliente: '',
    legenda: '',
    entregueEm: new Date().toISOString().slice(0, 10),
    autorizacaoPublicacao: false,
    status: 'rascunho',
    ordem,
    updatedAt: '',
  }
}

export function EntregasTab({ motos, onFeedback }: EntregasTabProps) {
  const [entregas, setEntregas] = useState<EntregaRegistro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroEntrega>('todas')
  const [formulario, setFormulario] = useState<EntregaRegistro | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [uploadsPendentes, setUploadsPendentes] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  const recarregar = useCallback(async () => {
    try {
      const resultado = await buscarEntregasAdmin()
      setEntregas(resultado)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar as entregas.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    let ativo = true
    void buscarEntregasAdmin()
      .then((resultado) => {
        if (!ativo) return
        setEntregas(resultado)
        setErro(null)
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar as entregas.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const filtradas = useMemo(
    () => entregas.filter((entrega) => filtro === 'todas' || entrega.status === filtro),
    [entregas, filtro],
  )

  function abrirNova() {
    setFormulario(novoRegistro(entregas.length))
    setFotoUrl(null)
    setUploadsPendentes([])
  }

  function abrirEdicao(entrega: EntregaRegistro) {
    setFormulario({ ...entrega })
    setFotoUrl(entrega.imagemUrl)
    setUploadsPendentes([])
  }

  async function limparUploadsPendentes(manter?: string) {
    const apagar = uploadsPendentes.filter((path) => path !== manter)
    if (apagar.length > 0) {
      const sb = getSupabase()
      if (sb) await sb.storage.from(BUCKET_ENTREGAS).remove(apagar)
    }
    setUploadsPendentes([])
  }

  async function cancelarEdicao() {
    await limparUploadsPendentes()
    setFormulario(null)
    setFotoUrl(null)
  }

  async function salvar(status: 'rascunho' | 'publicada') {
    if (!formulario) return
    if (!formulario.moto.trim()) {
      onFeedback({ tipo: 'erro', texto: 'Informe qual moto foi entregue.' })
      return
    }
    if (status === 'publicada' && (!formulario.fotoPath || !formulario.autorizacaoPublicacao)) {
      onFeedback({ tipo: 'erro', texto: 'Para publicar, adicione uma foto e confirme a autorização de uso.' })
      return
    }

    setSalvando(true)
    const dados: EntregaParaSalvar = {
      id: formulario.id,
      moto: formulario.moto,
      fotoPath: formulario.fotoPath,
      nomeCliente: formulario.nomeCliente,
      legenda: formulario.legenda,
      entregueEm: formulario.entregueEm,
      autorizacaoPublicacao: formulario.autorizacaoPublicacao,
      status,
      ordem: formulario.ordem,
    }
    try {
      await salvarEntrega(dados)
      const fotoAntiga = entregas.find((entrega) => entrega.id === formulario.id)?.fotoPath
      if (fotoAntiga && fotoAntiga !== formulario.fotoPath) {
        try {
          await removerFotoEntrega(fotoAntiga)
        } catch {
          // O registro já foi salvo; uma foto órfã não deve desfazer a publicação.
        }
      }
      await limparUploadsPendentes(formulario.fotoPath ?? undefined)
      setFormulario(null)
      setFotoUrl(null)
      await recarregar()
      onFeedback({
        tipo: 'ok',
        texto: status === 'publicada' ? 'Entrega publicada na página inicial.' : 'Entrega salva como rascunho.',
      })
    } catch (e) {
      onFeedback({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível salvar a entrega.',
      })
    } finally {
      setSalvando(false)
    }
  }

  async function mudarStatus(entrega: EntregaRegistro, status: StatusEntrega) {
    try {
      if (status === 'arquivada') {
        await arquivarEntrega(entrega.id)
      } else {
        await salvarEntrega({ ...entrega, status })
      }
      await recarregar()
      onFeedback({
        tipo: 'ok',
        texto: status === 'arquivada'
          ? 'Entrega arquivada. Ela não aparece mais no site.'
          : status === 'rascunho'
            ? 'Entrega ocultada da página inicial.'
            : 'Entrega restaurada como rascunho.',
      })
    } catch (e) {
      onFeedback({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível atualizar a entrega.' })
    }
  }

  const patchFormulario = (patch: Partial<EntregaRegistro>) =>
    setFormulario((atual) => (atual ? { ...atual, ...patch } : atual))

  if (formulario) {
    const podePublicar = Boolean(
      formulario.moto.trim() && formulario.fotoPath && formulario.autorizacaoPublicacao,
    )

    return (
      <section className="mx-auto max-w-4xl" aria-labelledby="entrega-form-titulo">
        <button
          type="button"
          onClick={() => void cancelarEdicao()}
          className="foco-painel mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-steel-300 hover:text-paper"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar às entregas
        </button>

        <header className="mb-7">
          <p className="text-xs font-semibold tracking-[0.12em] text-brand-400 uppercase">
            {formulario.status === 'publicada' ? 'Publicação' : 'Registro privado'}
          </p>
          <h2 id="entrega-form-titulo" className="mt-2 font-display text-3xl font-semibold text-paper sm:text-4xl">
            {entregas.some((entrega) => entrega.id === formulario.id) ? 'Editar entrega' : 'Nova entrega'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel-400">
            O registro fica privado até você publicar. Não salvamos dados de contato do cliente aqui.
          </p>
        </header>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6 border border-line bg-night-950 p-4 sm:p-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="entrega-moto" className="field-label">Moto entregue *</label>
              <input
                id="entrega-moto"
                className="input"
                value={formulario.moto}
                onChange={(e) => patchFormulario({ moto: e.target.value })}
                placeholder="Ex.: Honda CG 160 Start 2024"
                list="motos-entregues"
                maxLength={120}
                required
              />
              <datalist id="motos-entregues">
                {motos.filter((moto) => moto.status === 'vendida').map((moto) => (
                  <option key={moto.id} value={`${bikeTitle(moto)} ${moto.ano}`} />
                ))}
              </datalist>
              <p className="mt-2 text-xs text-steel-500">Você pode digitar um modelo fora do estoque atual.</p>
            </div>

            <div>
              <label htmlFor="entrega-data" className="field-label">Data da entrega</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel-500" aria-hidden="true" />
                <input
                  id="entrega-data"
                  className="input pl-10"
                  type="date"
                  value={formulario.entregueEm}
                  onChange={(e) => patchFormulario({ entregueEm: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="entrega-ordem" className="field-label">Posição no mural</label>
              <input
                id="entrega-ordem"
                className="input"
                type="number"
                min={0}
                step={1}
                value={formulario.ordem}
                onChange={(e) => patchFormulario({ ordem: Number(e.target.value) })}
              />
              <p className="mt-2 text-xs text-steel-500">Números menores aparecem primeiro.</p>
            </div>
          </div>

          <FotoEntregaInput
            entregaId={formulario.id}
            url={fotoUrl}
            descricao={formulario.moto}
            onChange={(fotoPath, url) => {
              if (fotoPath) setUploadsPendentes((anteriores) => [...anteriores, fotoPath])
              patchFormulario({ fotoPath })
              setFotoUrl(url)
            }}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="entrega-cliente" className="field-label">Nome para exibir (opcional)</label>
              <input
                id="entrega-cliente"
                className="input"
                value={formulario.nomeCliente}
                onChange={(e) => patchFormulario({ nomeCliente: e.target.value })}
                placeholder="Ex.: Ana"
                maxLength={80}
              />
              <p className="mt-2 text-xs text-steel-500">Use só o nome que o cliente autorizou divulgar.</p>
            </div>
            <div>
              <label htmlFor="entrega-legenda" className="field-label">Legenda ou relato (opcional)</label>
              <textarea
                id="entrega-legenda"
                className="input min-h-28 resize-y py-3"
                value={formulario.legenda}
                onChange={(e) => patchFormulario({ legenda: e.target.value })}
                placeholder="Uma frase curta para acompanhar a foto"
                maxLength={280}
              />
              <p className="mt-2 text-right text-xs text-steel-500">{formulario.legenda.length}/280</p>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 border border-line bg-painel-2 p-4">
            <input
              type="checkbox"
              checked={formulario.autorizacaoPublicacao}
              onChange={(e) => patchFormulario({ autorizacaoPublicacao: e.target.checked })}
              className="mt-1 size-4 accent-red-500"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-medium text-paper">
                <ShieldCheck className="size-4 text-brand-400" aria-hidden="true" />
                Tenho autorização para publicar esta foto e os dados que escolhi exibir.
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-steel-500">
                Obrigatório para publicar. O registro pode ser salvo como rascunho sem esta confirmação.
              </span>
            </span>
          </label>

          {fotoUrl ? (
            <aside className="border-t border-line pt-5" aria-label="Prévia da publicação">
              <p className="mb-3 text-xs font-semibold tracking-[0.1em] text-steel-500 uppercase">Prévia no site</p>
              <article className="grid max-w-2xl overflow-hidden bg-fundo sm:grid-cols-[minmax(0,1.2fr)_minmax(12rem,0.8fr)]">
                <img src={fotoUrl} alt="" className="aspect-[4/3] size-full object-cover" />
                <div className="p-4">
                  <h3 className="font-display text-xl font-semibold text-texto">{formulario.moto || 'Nome da moto'}</h3>
                  {formulario.entregueEm ? <p className="mt-1 text-sm text-texto-3">{dataCurta(formulario.entregueEm)}</p> : null}
                  {formulario.nomeCliente ? <p className="mt-3 text-sm text-texto-2">{formulario.nomeCliente}</p> : null}
                  {formulario.legenda ? <p className="mt-3 text-sm leading-relaxed text-texto-2">{formulario.legenda}</p> : null}
                </div>
              </article>
            </aside>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => void cancelarEdicao()}
              className="foco-painel inline-flex min-h-11 items-center justify-center px-4 text-sm text-steel-400 hover:text-paper"
            >
              Cancelar
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void salvar('rascunho')}
                disabled={salvando}
                className="foco-painel btn btn-secondary min-h-11 justify-center px-5"
              >
                Salvar rascunho
              </button>
              <button
                type="button"
                onClick={() => void salvar('publicada')}
                disabled={salvando || !podePublicar}
                className="foco-painel btn btn-primary min-h-11 justify-center px-5 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Send className="size-4" aria-hidden="true" />
                {formulario.status === 'publicada' ? 'Salvar publicação' : 'Publicar na Home'}
              </button>
            </div>
          </div>
        </form>
      </section>
    )
  }

  const quantidades = {
    todas: entregas.length,
    rascunho: entregas.filter((entrega) => entrega.status === 'rascunho').length,
    publicada: entregas.filter((entrega) => entrega.status === 'publicada').length,
    arquivada: entregas.filter((entrega) => entrega.status === 'arquivada').length,
  }

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="entregas-titulo">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-brand-400 uppercase">Página inicial</p>
          <h2 id="entregas-titulo" className="mt-2 font-display text-3xl font-semibold text-paper sm:text-4xl">
            Sonhos realizados
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel-400">
            Registre as entregas aqui. Elas ficam privadas até você publicar na Home.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNova}
          className="foco-painel btn btn-primary min-h-11 shrink-0 px-5"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar entrega
        </button>
      </header>

      {erro ? (
        <div role="alert" className="mb-6 border border-red-400/30 bg-red-950/20 p-4 text-sm text-red-200">
          <p>Não foi possível abrir as entregas: {erro}</p>
          <p className="mt-2 text-red-200/80">
            Se a tabela ainda não existe, aplique a migração 0007 descrita em supabase/README.md.
          </p>
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-4 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-steel-400">
          {quantidades.publicada} {quantidades.publicada === 1 ? 'publicada' : 'publicadas'} na Home
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar entregas">
          {(['todas', 'rascunho', 'publicada', 'arquivada'] as const).map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltro(estado)}
              aria-pressed={filtro === estado}
              className={`foco-painel min-h-10 border px-3 text-xs transition-colors ${
                filtro === estado
                  ? 'border-brand-400/70 bg-brand-500/10 text-paper'
                  : 'border-line text-steel-400 hover:border-line-forte hover:text-paper'
              }`}
            >
              {estado === 'todas' ? 'Todas' : rotuloStatus[estado]} ({quantidades[estado]})
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <p className="py-12 text-center text-sm text-steel-400" role="status">Carregando registros…</p>
      ) : filtradas.length > 0 ? (
        <ul className="space-y-3">
          {filtradas.map((entrega) => (
            <li key={entrega.id}>
              <article className="grid gap-4 border border-line bg-night-950 p-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:p-4">
                <div className="relative aspect-[4/3] overflow-hidden bg-painel-2 sm:aspect-[4/3]">
                  {entrega.imagemUrl ? (
                    <img src={entrega.imagemUrl} alt={`Foto: ${entrega.moto}`} className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-steel-500" aria-label="Sem foto">
                      <ImagePlus className="size-6" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-lg font-semibold text-paper">{entrega.moto}</h3>
                    <span
                      className={`inline-flex min-h-6 items-center border px-2 text-[11px] ${
                        entrega.status === 'publicada'
                          ? 'border-ok/35 bg-ok/10 text-ok'
                          : entrega.status === 'arquivada'
                            ? 'border-line text-steel-500'
                            : 'border-line-forte text-steel-300'
                      }`}
                    >
                      {rotuloStatus[entrega.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-steel-400">
                    {entrega.entregueEm ? dataCurta(entrega.entregueEm) : 'Data não informada'}
                    {entrega.nomeCliente ? ` · ${entrega.nomeCliente}` : ''}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-steel-500">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    {entrega.autorizacaoPublicacao ? 'Autorização confirmada' : 'Sem autorização registrada'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => abrirEdicao(entrega)}
                    className="foco-painel btn btn-secondary min-h-11 px-4 text-sm"
                  >
                    Editar
                  </button>
                  {entrega.status === 'publicada' ? (
                    <button
                      type="button"
                      onClick={() => void mudarStatus(entrega, 'rascunho')}
                      className="foco-painel min-h-11 border border-line-forte px-3 text-sm text-steel-300 hover:text-paper"
                    >
                      Ocultar
                    </button>
                  ) : entrega.status === 'arquivada' ? (
                    <button
                      type="button"
                      onClick={() => void mudarStatus(entrega, 'rascunho')}
                      className="foco-painel min-h-11 border border-line-forte px-3 text-sm text-steel-300 hover:text-paper"
                    >
                      Restaurar
                    </button>
                  ) : null}
                  {entrega.status !== 'arquivada' ? (
                    <button
                      type="button"
                      onClick={() => void mudarStatus(entrega, 'arquivada')}
                      aria-label={`Arquivar entrega da ${entrega.moto}`}
                      className="foco-painel grid size-11 place-items-center border border-line text-steel-500 hover:border-red-400/50 hover:text-red-300"
                    >
                      <Archive className="size-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border border-line bg-night-950 px-5 py-12 text-center">
          <ImagePlus className="mx-auto size-7 text-steel-500" aria-hidden="true" />
          <p className="mt-4 font-medium text-paper">
            {filtro === 'todas' ? 'Nenhuma entrega registrada ainda.' : `Nenhuma entrega ${rotuloStatus[filtro].toLowerCase()}.`}
          </p>
          <p className="mt-2 text-sm text-steel-400">Quando adicionar, você escolhe se ela aparece na página inicial.</p>
        </div>
      )}
    </section>
  )
}
