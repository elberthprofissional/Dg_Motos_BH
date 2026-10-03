import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  buscarConfigLoja,
  salvarConfigLoja,
  validarFormConfig,
} from '../../lib/configLoja'
import type { ConfigLoja, FormConfigLoja } from '../../lib/configLoja'
import {
  financiamentoFormDeConfig,
  formFinanciamentoVazio,
  QTD_ETAPAS,
} from '../../lib/financiamento'
import type { FormFinanciamento } from '../../lib/financiamento'
import { agendarPublicacao } from '../../lib/publicar'
import { SITE } from '../../data/site'
import { useAuth } from '../../hooks/authContexto'
import { SenhaInput } from '../ui/SenhaInput'
import { Aviso } from '../ui/Aviso'
import type { TipoAviso } from '../ui/Aviso'

/**
 * Aba Configurações — Control Center
 *
 * Reorganização por categorias (Informações, Contato e Redes, Localização,
 * Segurança), com navegação interna, indicador de alterações não salvas e
 * ações fixas com feedback contextual.
 *
 * ============================================================
 * NAVEGAÇÃO INTERNA
 * ============================================================
 * Desktop: lista lateral fixa de 5 categorias. A coluna de conteúdo
 * acompanha — o formulário ocupa o resto da largura, que é onde estão os
 * campos de verdade.
 *
 * Celular: a mesma lista vira um seletor expansível. Uma coluna com 5
 * botões empilhados ocupava 300px de tela antes de o primeiro campo
 * aparecer. O seletor mostra só a categoria ativa e abre a lista quando
 * o dono precisa trocar — e o texto completo de cada categoria continua
 * visível na lista expandida, nunca abreviado para "Conf." ou "Fin.anc."
 * (o Criterion de aceitação é explícito sobre isso: abas minúsculas que
 * obrigam a adivinhar não resolvem nada).
 */
type Categoria = 'loja' | 'contato' | 'localizacao' | 'financiamento' | 'seguranca'

const CATEGORIAS: {
  id: Categoria
  rotulo: string
  descricao: string
  icone: LucideIcon
}[] = [
  {
    id: 'loja',
    rotulo: 'Informações da loja',
    descricao: 'Identidade e dados comerciais.',
    icone: Building2,
  },
  {
    id: 'financiamento',
    rotulo: 'Página de financiamento',
    descricao: 'Título, etapas e transparência da página.',
    icone: FileText,
  },
  {
    id: 'contato',
    rotulo: 'Contato e redes sociais',
    descricao: 'WhatsApp, telefone e Instagram.',
    icone: Smartphone,
  },
  {
    id: 'localizacao',
    rotulo: 'Localização',
    descricao: 'Endereço e mapa da loja.',
    icone: MapPin,
  },
  {
    id: 'seguranca',
    rotulo: 'Segurança da conta',
    descricao: 'Acesso e credenciais do painel.',
    icone: ShieldCheck,
  },
]

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children}
    </label>
  )
}

/**
 * Item da lista de categorias.
 *
 * Compartilhado entre a coluna do desktop e a lista expandida do
 * celular — mesma ordem, mesmo texto, mesmo estado ativo. Sem o
 * `absolute` que o desktop usava para a barra vermelha: aqui ela vem
 * como elemento de fluxo para não depender de posicionamento fragile.
 */
function ItemCategoria({
  id,
  rotulo,
  descricao,
  Icone,
  ativo,
  onSelecionar,
  referencia,
}: {
  id: Categoria
  rotulo: string
  descricao: string
  Icone: LucideIcon
  ativo: boolean
  onSelecionar: (id: Categoria) => void
  referencia?: (el: HTMLButtonElement | null) => void
}) {
  return (
    <li>
      <button
        ref={referencia}
        type="button"
        onClick={() => onSelecionar(id)}
        aria-current={ativo ? 'page' : undefined}
        className={`item-linha foco-painel gap-3 ${
          ativo ? 'bg-white/[0.07] text-paper' : 'text-steel-300 hover:bg-white/[0.04] hover:text-paper'
        }`}
      >
        <span className={ativo ? 'text-brand-500' : 'text-steel-500'}>
          <Icone className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{rotulo}</span>
          <span className="block text-[11px] text-steel-500">{descricao}</span>
        </span>
      </button>
    </li>
  )
}

export function ConfiguracoesTab({
  onFeedback,
}: {
  onFeedback?: (feedback: { tipo: 'ok' | 'erro'; texto: string }) => void
}) {
  const [categoria, setCategoria] = useState<Categoria>('loja')
  const [listaAberta, setListaAberta] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvandoLoja, setSalvandoLoja] = useState(false)
  const [salvandoConta, setSalvandoConta] = useState(false)
  const [avisoLoja, setAvisoLoja] = useState<{ tipo: TipoAviso; texto: string } | null>(null)
  const [avisoConta, setAvisoConta] = useState<{ tipo: TipoAviso; texto: string } | null>(null)

  // Formulário do conteúdo da página /financiamento (vazio = usa o padrão).
  const [formFin, setFormFin] = useState<FormFinanciamento>(formFinanciamentoVazio)
  const [origemFin, setOrigemFin] = useState<FormFinanciamento | null>(null)

  const [formLoja, setFormLoja] = useState<FormConfigLoja>({
    whatsapp: '',
    instagramHandle: '',
    instagramUrl: '',
    telefoneExibicao: '',
    enderecoRua: '',
    enderecoCidadeUf: '',
    mapsUrl: '',
  })
  const [origem, setOrigem] = useState<ConfigLoja | null>(null)

  const { redefinirSenha } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const divergentes = confirmar.length > 0 && confirmar !== senha

  const botaoLista = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let vivo = true
    void buscarConfigLoja().then((c) => {
      if (!vivo) return
      setOrigem(c)
      setFormLoja({
        whatsapp: c.whatsapp ?? '',
        instagramHandle: c.instagramHandle,
        instagramUrl: c.instagramUrl,
        telefoneExibicao: c.telefoneExibicao ?? '',
        enderecoRua: c.enderecoRua,
        enderecoCidadeUf: c.enderecoCidadeUf,
        mapsUrl: c.mapsUrl,
      })
      setOrigemFin(financiamentoFormDeConfig(c.financiamento))
      setFormFin(financiamentoFormDeConfig(c.financiamento))
      setCarregando(false)
    })
    return () => {
      vivo = false
    }
  }, [])

  const alteradoFin = useMemo(() => {
    if (!origemFin) return false
    const a = formFin
    const b = origemFin
    if (
      a.titulo !== b.titulo ||
      a.subtitulo !== b.subtitulo ||
      a.etapasTitulo !== b.etapasTitulo ||
      a.transparenciaTitulo !== b.transparenciaTitulo ||
      a.transparenciaItens !== b.transparenciaItens
    ) {
      return true
    }
    return a.etapas.some(
      (e, i) => e.titulo !== b.etapas[i]?.titulo || e.texto !== b.etapas[i]?.texto,
    )
  }, [formFin, origemFin])

  const alteradoLoja = useMemo(() => {
    if (!origem) return false
    const a = formLoja
    const b = origem
    return (
      (a.whatsapp || null) !== (b.whatsapp || null) ||
      a.instagramHandle !== b.instagramHandle ||
      a.instagramUrl !== b.instagramUrl ||
      (a.telefoneExibicao || null) !== (b.telefoneExibicao || null) ||
      a.enderecoRua !== b.enderecoRua ||
      a.enderecoCidadeUf !== b.enderecoCidadeUf ||
      a.mapsUrl !== b.mapsUrl
    )
  }, [formLoja, origem])

  const alteradoConta = senha.length > 0 || confirmar.length > 0

  const estadoGeral =
    alteradoLoja || alteradoConta || alteradoFin ? 'alteracoes' : 'salvo'

  const atual = CATEGORIAS.find((c) => c.id === categoria) ?? CATEGORIAS[0]

  function setCampo<K extends keyof FormConfigLoja>(campo: K, valor: string) {
    setFormLoja((f) => ({ ...f, [campo]: valor }))
    setAvisoLoja(null)
  }

  function setCampoFin(campo: keyof FormFinanciamento, valor: string) {
    setFormFin((f) => ({ ...f, [campo]: valor }))
    setAvisoLoja(null)
  }

  function setEtapaFin(i: number, campo: 'titulo' | 'texto', valor: string) {
    setFormFin((f) => ({
      ...f,
      etapas: f.etapas.map((e, idx) => (idx === i ? { ...e, [campo]: valor } : e)),
    }))
    setAvisoLoja(null)
  }

  function escolherCategoria(id: Categoria) {
    setCategoria(id)
    setListaAberta(false)
  }

  async function salvarLoja(e: React.FormEvent) {
    e.preventDefault()
    setAvisoLoja(null)
    const erro = validarFormConfig(formLoja)
    if (erro) {
      setAvisoLoja({ tipo: 'erro', texto: erro })
      return
    }
    setSalvandoLoja(true)
    const r = await salvarConfigLoja(formLoja, alteradoFin ? formFin : undefined)
    setSalvandoLoja(false)
    if (!r.ok) {
      const texto = r.erro ?? 'Não foi possível salvar as configurações da loja.'
      setAvisoLoja({ tipo: 'erro', texto })
      onFeedback?.({ tipo: 'erro', texto })
      return
    }
    if (alteradoFin) setOrigemFin(formFin)
    setOrigem((atual) =>
      atual
        ? {
            ...atual,
            whatsapp: formLoja.whatsapp || null,
            instagramHandle: formLoja.instagramHandle,
            instagramUrl: formLoja.instagramUrl,
            telefoneExibicao: formLoja.telefoneExibicao || null,
            enderecoRua: formLoja.enderecoRua,
            enderecoCidadeUf: formLoja.enderecoCidadeUf,
            mapsUrl: formLoja.mapsUrl,
          }
        : null,
    )
    const textoOk = 'Configuração da loja salva. O site já mostra as mudanças; o Google e as prévias de compartilhamento atualizam nos próximos minutos.'
    setAvisoLoja({ tipo: 'ok', texto: textoOk })
    onFeedback?.({ tipo: 'ok', texto: 'Configuração da loja salva.' })
    agendarPublicacao()
  }

  async function salvarConta(e: React.FormEvent) {
    e.preventDefault()
    setAvisoConta(null)
    if (senha.length < 6) {
      setAvisoConta({ tipo: 'erro', texto: 'A senha precisa ter pelo menos 6 caracteres.' })
      return
    }
    if (divergentes) {
      setAvisoConta({ tipo: 'erro', texto: 'As senhas não coincidem.' })
      return
    }
    setSalvandoConta(true)
    const falha = await redefinirSenha(senha)
    setSalvandoConta(false)
    if (falha) {
      setAvisoConta({ tipo: 'erro', texto: falha })
      onFeedback?.({ tipo: 'erro', texto: falha })
      return
    }
    setAvisoConta({ tipo: 'ok', texto: 'Senha alterada! No próximo login, use a senha nova.' })
    onFeedback?.({ tipo: 'ok', texto: 'Senha alterada com sucesso.' })
    agendarPublicacao()
    setSenha('')
    setConfirmar('')
  }

  const salvarDesabilitado =
    salvandoLoja ||
    salvandoConta ||
    (!alteradoLoja && !alteradoConta && !alteradoFin) ||
    (alteradoConta && (senha.length < 6 || divergentes))

  const salvarEmProgresso = salvandoLoja || salvandoConta
  const IconeAtual = atual.icone

  /* ------------------------- Cabeçalho e status ------------------------ */

  const cabecalho = (
    <header className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h2 className="hidden font-display text-2xl font-semibold tracking-wide text-paper uppercase sm:block">
          Configurações
        </h2>
        <p className="text-sm text-steel-500">
          <span className="sm:hidden">Loja, contato, endereço e senha.</span>
          <span className="hidden sm:inline">
            Gerencie as informações comerciais e as preferências de acesso da DG Motos.
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {estadoGeral === 'salvo' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/40 bg-ok/10 px-2.5 py-0.5 text-ok">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Tudo salvo
            </span>
          )}
          {estadoGeral === 'alteracoes' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 text-warn">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              Alterações não salvas
            </span>
          )}
          {carregando && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-steel-300">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Carregando configurações...
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          ;(document.getElementById('form-config') as HTMLFormElement | null)?.requestSubmit()
        }}
        disabled={salvarDesabilitado}
        className="btn btn-primary hidden h-11 sm:inline-flex"
      >
        {salvarEmProgresso ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-4" aria-hidden="true" />
        )}
        {salvarEmProgresso ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </header>
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      {cabecalho}

      {/* ---------------- Navegação de categorias: celular --------------- */}
      <div className="relative sm:hidden">
        <button
          ref={botaoLista}
          type="button"
          onClick={() => setListaAberta((v) => !v)}
          aria-expanded={listaAberta}
          aria-controls="config-categorias"
          className="foco-painel flex h-12 w-full items-center gap-3 rounded-md border border-white/10 bg-night-900 px-3 text-left transition-colors hover:border-white/20"
        >
          <span className="text-brand-500">
            <IconeAtual className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium tracking-[0.14em] text-steel-500 uppercase">
              Categoria
            </span>
            <span className="block truncate text-sm font-semibold text-paper">{atual.rotulo}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 text-steel-400 transition-transform ${listaAberta ? 'rotate-180' : ''}`}
          />
        </button>

        {listaAberta && (
          <>
            {/* Fecha ao tocar fora — sem isso a lista fica aberta por
                cima do formulário e o dono não descobre como sair. */}
            <button
              type="button"
              aria-label="Fechar lista de categorias"
              onClick={() => setListaAberta(false)}
              className="animate-fade fixed inset-0 z-20 cursor-default"
            />
            <ul
              id="config-categorias"
              className="animate-fade absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-white/10 bg-night-800 p-1 shadow-xl shadow-black/60"
            >
              {CATEGORIAS.map((c) => {
                const Icone = c.icone
                return (
                  <ItemCategoria
                    key={c.id}
                    id={c.id}
                    rotulo={c.rotulo}
                    descricao={c.descricao}
                    Icone={Icone}
                    ativo={categoria === c.id}
                    onSelecionar={escolherCategoria}
                  />
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* `240px` no desktop: a coluna de conteúdo precisa de espaço, e
          os 5 itens cabem em ~200px com o texto completo. */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[240px_1fr]">
        <nav
          className="card hidden p-2 lg:sticky lg:top-[72px] lg:block lg:self-start"
          aria-label="Categorias de configurações"
        >
          <ul className="space-y-1">
            {CATEGORIAS.map((c) => {
              const Icone = c.icone
              return (
                <ItemCategoria
                  key={c.id}
                  id={c.id}
                  rotulo={c.rotulo}
                  descricao={c.descricao}
                  Icone={Icone}
                  ativo={categoria === c.id}
                  onSelecionar={escolherCategoria}
                />
              )
            })}
          </ul>
        </nav>

        <form
          id="form-config"
          onSubmit={(e) => {
            e.preventDefault()
            void (async () => {
              if (alteradoLoja || alteradoFin) {
                await salvarLoja(e)
              }
              if (alteradoConta) {
                await salvarConta(e)
              }
            })()
          }}
          noValidate
          className="min-w-0 space-y-4 sm:space-y-5"
        >
          {categoria === 'loja' && (
            <section className="card divide-y divide-white/5">
              <header className="p-4 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-wide text-paper uppercase">
                  <span className="text-brand-500">
                    <Building2 className="size-5" aria-hidden="true" />
                  </span>
                  Informações da loja
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-steel-500">
                  Configurações comerciais da DG Motos.
                </p>
              </header>
              <div className="grid gap-4 p-4 sm:gap-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-medium tracking-[0.14em] text-steel-500 uppercase">
                      Nome
                    </p>
                    <p className="mt-1 font-display text-base font-semibold tracking-wide text-paper uppercase">
                      {SITE.nome}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-medium tracking-[0.14em] text-steel-500 uppercase">
                      Slogan
                    </p>
                    <p className="mt-1 font-display text-base font-semibold tracking-wide text-paper uppercase">
                      {SITE.slogan}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-steel-500">
                  Nome e slogan fazem parte da identidade institucional e alimentam os dados
                  estruturados do Google. São editáveis em <code>src/data/site.ts</code> —{' '}
                  <strong className="font-semibold text-steel-300">
                    não pela configuração do painel
                  </strong>
                  , para que o nome exibido no site e o enviado ao buscador nunca diverjam.
                </p>
              </div>
            </section>
          )}

          {categoria === 'contato' && (
            <section className="card divide-y divide-white/5">
              <header className="p-4 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-wide text-paper uppercase">
                  <span className="text-brand-500">
                    <Smartphone className="size-5" aria-hidden="true" />
                  </span>
                  Contato e redes sociais
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-steel-500">
                  Estes dados alimentam os botões de WhatsApp, rodapé, página de contato e
                  Schema.org.
                </p>
              </header>
              <div className="grid gap-5 p-4 sm:gap-6 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <Label htmlFor="cfg-wa">WhatsApp (apenas dígitos — DDI + DDD)</Label>
                    <input
                      id="cfg-wa"
                      type="tel"
                      inputMode="numeric"
                      placeholder="5531987654321"
                      className="input h-11 sm:h-auto"
                      value={formLoja.whatsapp}
                      onChange={(e) => setCampo('whatsapp', e.target.value.replace(/[^\d]/g, ''))}
                    />
                    <p className="mt-1.5 text-[11px] text-steel-500">
                      Deixe em branco para que os CTAs caiam para a página de contato.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="cfg-tel">Telefone para exibição</Label>
                    <input
                      id="cfg-tel"
                      type="tel"
                      inputMode="tel"
                      placeholder="(31) 3333-3333"
                      className="input h-11 sm:h-auto"
                      value={formLoja.telefoneExibicao}
                      onChange={(e) => setCampo('telefoneExibicao', e.target.value)}
                    />
                    <p className="text-[11px] text-steel-500">
                      Texto exibido no rodapé e nos dados do Google. Formate como quiser.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="cfg-ig-handle">Instagram</Label>
                    <input
                      id="cfg-ig-handle"
                      type="text"
                      placeholder="@dgmotosbh"
                      className="input h-11 sm:h-auto"
                      value={formLoja.instagramHandle}
                      onChange={(e) => {
                        const v = e.target.value
                        const limpo = v.startsWith('@') ? v : v ? `@${v}` : ''
                        setCampo('instagramHandle', limpo)
                        if (limpo && !formLoja.instagramUrl) {
                          setCampo('instagramUrl', `https://instagram.com/${limpo.replace('@', '')}`)
                        }
                      }}
                    />
                    <p className="mt-1.5 text-[11px] text-steel-500">
                      Preencha apenas com o @handle. A URL é preenchida automaticamente.
                    </p>
                  </div>
                </div>
                {avisoLoja && <Aviso tipo={avisoLoja.tipo}>{avisoLoja.texto}</Aviso>}
              </div>
            </section>
          )}

          {categoria === 'financiamento' && (
            <section className="card divide-y divide-white/5">
              <header className="p-4 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-wide text-paper uppercase">
                  <span className="text-brand-500">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  Página de financiamento
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-steel-500">
                  Textos da página /financiamento. Deixe um campo em branco para usar o texto
                  padrão do site.
                </p>
              </header>
              <div className="grid gap-5 p-4 sm:gap-6 sm:p-6">
                <div>
                  <Label htmlFor="fin-titulo">Título da página</Label>
                  <input
                    id="fin-titulo"
                    type="text"
                    className="input h-11 sm:h-auto"
                    value={formFin.titulo}
                    onChange={(e) => setCampoFin('titulo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fin-subtitulo">Subtítulo (frase de apoio abaixo do título)</Label>
                  <textarea
                    id="fin-subtitulo"
                    rows={3}
                    className="input resize-y"
                    value={formFin.subtitulo}
                    onChange={(e) => setCampoFin('subtitulo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fin-etapas-titulo">Título da seção "Como funciona"</Label>
                  <input
                    id="fin-etapas-titulo"
                    type="text"
                    className="input h-11 sm:h-auto"
                    value={formFin.etapasTitulo}
                    onChange={(e) => setCampoFin('etapasTitulo', e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-semibold tracking-wide text-steel-400 uppercase">
                    Etapas do processo
                  </p>
                  {Array.from({ length: QTD_ETAPAS }, (_, i) => (
                    <div key={i} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-3 font-display text-xs text-brand-500">
                        Etapa {String(i + 1).padStart(2, '0')}
                      </p>
                      <div className="grid gap-3">
                        <div>
                          <Label htmlFor={`fin-etapa-${i}-titulo`}>Título</Label>
                          <input
                            id={`fin-etapa-${i}-titulo`}
                            type="text"
                            className="input h-11 sm:h-auto"
                            value={formFin.etapas[i]?.titulo ?? ''}
                            onChange={(e) => setEtapaFin(i, 'titulo', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`fin-etapa-${i}-texto`}>Descrição</Label>
                          <textarea
                            id={`fin-etapa-${i}-texto`}
                            rows={2}
                            className="input resize-y"
                            value={formFin.etapas[i]?.texto ?? ''}
                            onChange={(e) => setEtapaFin(i, 'texto', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label htmlFor="fin-transp-titulo">Título da seção de transparência</Label>
                  <input
                    id="fin-transp-titulo"
                    type="text"
                    className="input h-11 sm:h-auto"
                    value={formFin.transparenciaTitulo}
                    onChange={(e) => setCampoFin('transparenciaTitulo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fin-transp-itens">Bullets de transparência (um por linha)</Label>
                  <textarea
                    id="fin-transp-itens"
                    rows={5}
                    className="input resize-y"
                    value={formFin.transparenciaItens}
                    onChange={(e) => setCampoFin('transparenciaItens', e.target.value)}
                  />
                  <p className="mt-1.5 text-[11px] text-steel-500">
                    Cada linha vira um bullet. Deixe em branco para usar os padrões.
                  </p>
                </div>
                {avisoLoja && <Aviso tipo={avisoLoja.tipo}>{avisoLoja.texto}</Aviso>}
              </div>
            </section>
          )}

          {categoria === 'localizacao' && (
            <section className="card divide-y divide-white/5">
              <header className="p-4 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-wide text-paper uppercase">
                  <span className="text-brand-500">
                    <MapPin className="size-5" aria-hidden="true" />
                  </span>
                  Localização
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-steel-500">
                  Endereço e link do Google Maps utilizados no rodapé e nos dados estruturados.
                </p>
              </header>
              <div className="grid gap-4 p-4 sm:gap-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="sm:col-span-2">
                    <Label htmlFor="cfg-rua">Endereço (rua e número)</Label>
                    <input
                      id="cfg-rua"
                      type="text"
                      placeholder="Av. Basílio da Gama, 139"
                      className="input h-11 sm:h-auto"
                      value={formLoja.enderecoRua}
                      onChange={(e) => setCampo('enderecoRua', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cfg-cidade">Cidade / UF</Label>
                    <input
                      id="cfg-cidade"
                      type="text"
                      placeholder="Belo Horizonte, MG"
                      className="input h-11 sm:h-auto"
                      value={formLoja.enderecoCidadeUf}
                      onChange={(e) => setCampo('enderecoCidadeUf', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cfg-maps">Link do Google Maps</Label>
                    <input
                      id="cfg-maps"
                      type="url"
                      placeholder="https://www.google.com/maps/search/?api=1&query=..."
                      className="input h-11 sm:h-auto"
                      value={formLoja.mapsUrl}
                      onChange={(e) => setCampo('mapsUrl', e.target.value)}
                    />
                    <p className="mt-1.5 text-[11px] text-steel-500">
                      Recomenda-se utilizar o link direto do Google Meu Negócio, quando
                      disponível.
                    </p>
                  </div>
                </div>
                {avisoLoja && <Aviso tipo={avisoLoja.tipo}>{avisoLoja.texto}</Aviso>}
              </div>
            </section>
          )}

          {categoria === 'seguranca' && (
            <section className="card divide-y divide-white/5">
              <header className="p-4 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-wide text-paper uppercase">
                  <span className="text-brand-500">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  </span>
                  Segurança da conta
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-steel-500">
                  Troque a senha usada para acessar <code>/admin</code>. A sessão atual
                  permanece válida.
                </p>
              </header>
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6">
                <SenhaInput
                  id="conta-senha"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="Nova senha"
                  rotulo="Nova senha"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    setAvisoConta(null)
                  }}
                />
                <SenhaInput
                  id="conta-confirmar"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="Confirmar nova senha"
                  rotulo="Confirmar nova senha"
                  value={confirmar}
                  onChange={(e) => {
                    setConfirmar(e.target.value)
                    setAvisoConta(null)
                  }}
                />
                {divergentes && (
                  <p className="text-xs text-steel-400 sm:col-span-2">
                    As senhas não coincidem. Verifique e tente novamente.
                  </p>
                )}
                {avisoConta && (
                  <div className="sm:col-span-2">
                    <Aviso tipo={avisoConta.tipo}>{avisoConta.texto}</Aviso>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Barra de salvar.
              `bottom: calc(nav + safe-area + 1rem)` porque a barra
              inferior do celular é `fixed`: um `bottom-4` aqui ficaria
              ATRÁS dela e o botão — a única forma de salvar no celular —
              ficaria inalcançável. No desktop a barra some e o `lg:`
              devolve o botão para o fluxo normal, junto do cabeçalho. */}
          {(alteradoLoja || alteradoConta || alteradoFin) && (
            <div
              className="fixed inset-x-0 z-30 px-4 sm:px-6 lg:static lg:z-auto lg:flex lg:justify-end lg:px-0"
              style={{
                bottom: 'calc(var(--spacing-nav-painel) + env(safe-area-inset-bottom, 0px) + 1rem)',
              }}
            >
              <div className="card flex w-full items-center justify-between gap-3 px-4 py-3 shadow-xl shadow-black/60 lg:w-auto">
                <p className="min-w-0 flex-1 text-xs text-steel-400">
                  {alteradoLoja && alteradoConta
                    ? 'Alterações na loja e na senha pendentes.'
                    : alteradoLoja || alteradoFin
                      ? 'Alterações nas configurações pendentes.'
                      : 'Alterações na senha pendentes.'}
                </p>
                <button
                  type="submit"
                  disabled={salvarDesabilitado}
                  className="btn btn-primary h-11 shrink-0 sm:h-auto"
                >
                  {salvarEmProgresso ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  {salvarEmProgresso ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}