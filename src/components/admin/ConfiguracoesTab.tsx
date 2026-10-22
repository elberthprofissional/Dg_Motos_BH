import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  RotateCcw,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { configPadrao, gravarConfig, lerConfig, limparConfig } from '../../lib/configLoja'
import type { ConfigLoja } from '../../lib/configLoja'
import { buildMapsRouteUrl } from '../../lib/maps'
import { InstagramIcon } from '../ui/InstagramIcon'
import { LinhaInstalarApp, PainelInstalarApp } from './InstalarApp'
import { Toast } from '../ui/Toast'
import type { Feedback } from '../ui/Toast'

/**
 * ============================================================
 * CONFIGURAÇÕES DA LOJA
 * ============================================================
 * Uma central de ajustes com dois arranjos, uma só lógica:
 *
 *   Desktop (lg+)  → navegação secundária à esquerda, painel de edição à
 *                    direita. A categoria ativa fica destacada e o
 *                    formulário aparece ao lado, sem recarregar nada.
 *   Celular/tablet → a lista compacta de sempre: toca na categoria,
 *                    abre a sub-tela com o "voltar" no topo.
 *
 * O estado (`config`) e as ações (salvar/restaurar) são únicos e vivem
 * no topo — os dois layouts leem dos mesmos dados e do mesmo `conteudo`.
 */

type Secao = 'contato' | 'instagram' | 'endereco' | 'horarios' | 'app'

interface DescricaoSecao {
  id: Secao
  rotulo: string
  /** Frase curta que explica o que a seção controla. */
  descricao: string
  /** Resumo do valor atual, exibido sob o título na lista e no nav. */
  resumo: (c: ConfigLoja) => string
  icone: ComponentType<{ className?: string }>
  grupo: 'loja' | 'atendimento' | 'app'
}

const SECOES: DescricaoSecao[] = [
  {
    id: 'contato',
    rotulo: 'Contato',
    descricao: 'WhatsApp e telefone que aparecem nos botões do site.',
    resumo: (c) => (c.whatsapp ? `WhatsApp ${c.whatsapp}` : 'Sem WhatsApp definido'),
    icone: MessageCircle,
    grupo: 'loja',
  },
  {
    id: 'instagram',
    rotulo: 'Instagram',
    descricao: 'O @ que o site usa no cabeçalho, rodapé e fichas.',
    resumo: (c) => c.instagramHandle || 'Sem perfil definido',
    icone: InstagramIcon,
    grupo: 'loja',
  },
  {
    id: 'endereco',
    rotulo: 'Endereço',
    descricao: 'Rua, cidade e o link do mapa usados na página de contato.',
    resumo: (c) => c.enderecoRua || 'Sem endereço definido',
    icone: MapPin,
    grupo: 'loja',
  },
  {
    id: 'horarios',
    rotulo: 'Horários de atendimento',
    descricao: 'As faixas de dia e hora mostradas no rodapé e na ficha de contato.',
    resumo: (c) =>
      c.horarios.length === 0
        ? 'Nenhum horário cadastrado'
        : `${c.horarios.length} ${c.horarios.length === 1 ? 'faixa' : 'faixas'}`,
    icone: Clock,
    grupo: 'atendimento',
  },
  {
    id: 'app',
    rotulo: 'Instalar o aplicativo',
    descricao: 'Acesse o painel como um app, em tela cheia, direto do celular.',
    resumo: () => 'App instalável neste aparelho',
    icone: Smartphone,
    grupo: 'app',
  },
]

const GRUPOS: { id: DescricaoSecao['grupo']; titulo: string }[] = [
  { id: 'loja', titulo: 'Loja' },
  { id: 'atendimento', titulo: 'Atendimento' },
  { id: 'app', titulo: 'Aplicativo' },
]

function Campo({
  id,
  label,
  dica,
  children,
}: {
  id: string
  label: string
  dica?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {dica ? <p className="mt-1.5 text-etiqueta leading-relaxed text-steel-500">{dica}</p> : null}
    </div>
  )
}

/** Botões de salvar/restaurar no pé de cada seção. */
function AcoesSecao({
  onSalvar,
  onRestaurar,
}: {
  onSalvar: () => void
  onRestaurar: () => void
}) {
  return (
    <div className="flex flex-wrap gap-3 border-t border-line pt-5"> /* taste-skill-ignore: painel */
      <button type="button" onClick={onSalvar} className="btn btn-primary h-11 sm:h-auto">
        Salvar
      </button>
      <button type="button" onClick={onRestaurar} className="btn btn-secondary h-11 sm:h-auto">
        <RotateCcw className="size-4" aria-hidden="true" />
        Restaurar padrão
      </button>
    </div>
  )
}

export function ConfiguracoesTab() {
  // A config nasce do storage: o componente é remontado a cada troca de
  // aba, então não há posição defasada entre abas.
  const [config, setConfig] = useState<ConfigLoja>(() => lerConfig())
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  // `null` = lista/hub (celular) ou nada selecionado (desktop abre o primeiro).
  const [secao, setSecao] = useState<Secao | null>(null)

  // Última versão gravada: serve para saber se há alterações pendentes.
  const [salvo, setSalvo] = useState<ConfigLoja>(config)
  const temAlteracoes = JSON.stringify(config) !== JSON.stringify(salvo)

  function set<K extends keyof ConfigLoja>(chave: K, valor: ConfigLoja[K]) {
    setConfig((c) => ({ ...c, [chave]: valor }))
  }

  function salvar() {
    gravarConfig(config)
    setSalvo(config)
    setFeedback({ tipo: 'ok', texto: 'Configurações salvas. O site já usa os novos valores.' })
  }

  function restaurar() {
    limparConfig()
    const padrao = configPadrao()
    setConfig(padrao)
    setSalvo(padrao)
    setFeedback({ tipo: 'ok', texto: 'Valores de fábrica restaurados (src/data/site.ts).' })
  }

  /**
   * Formulário de cada seção. É uma função (não componente) de propósito:
   * assim os campos não perdem foco a cada render do pai — identidade de
   * elemento estável entre desktop e mobile.
   */
  function conteudo(id: Secao): ReactNode {
    if (id === 'contato') {
      return (
        <fieldset className="space-y-5">
          <legend className="sr-only">Contato</legend>
          <Campo
            id="cfg-whatsapp"
            label="WhatsApp da loja"
            dica="Só dígitos, com DDI e DDD. Ex.: 5531987654321. Vazio = os botões do site caem na página de contato."
          >
            <input
              id="cfg-whatsapp"
              className="input"
              value={config.whatsapp ?? ''}
              inputMode="numeric"
              placeholder="5531987654321"
              onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, '') || null)}
            />
          </Campo>
          <Campo
            id="cfg-telefone"
            label="Telefone fixo (opcional)"
            dica="Exibido no rodapé. Deixe vazio se não quiser publicar linha fixa."
          >
            <input
              id="cfg-telefone"
              className="input"
              value={config.telefoneExibicao ?? ''}
              placeholder="(31) 3000-0000"
              onChange={(e) => set('telefoneExibicao', e.target.value.trim() || null)}
            />
          </Campo>
          <AcoesSecao onSalvar={salvar} onRestaurar={restaurar} />
        </fieldset>
      )
    }

    if (id === 'instagram') {
      return (
        <fieldset className="space-y-5">
          <legend className="sr-only">Instagram</legend>
          <Campo
            id="cfg-instagram"
            label="Perfil (@)"
            dica="Só o @ handle, sem URL. O link é montado automaticamente e vira o botão do rodapé."
          >
            <input
              id="cfg-instagram"
              className="input"
              value={config.instagramHandle}
              placeholder="@dgmotosbh"
              onChange={(e) => {
                const handle = e.target.value.trim().replace(/^https?:\/\/instagram\.com\//i, '')
                set('instagramHandle', handle)
                const limpo = handle.replace(/@/g, '')
                set('instagramUrl', limpo ? `https://instagram.com/${limpo}` : '')
              }}
            />
          </Campo>
          {config.instagramUrl ? (
            <p className="text-etiqueta text-steel-500">
              Link final:{' '}
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-steel-300 underline decoration-white/20 underline-offset-2 hover:text-paper"
              >
                {config.instagramUrl}
              </a>
            </p>
          ) : null}
          <AcoesSecao onSalvar={salvar} onRestaurar={restaurar} />
        </fieldset>
      )
    }

    if (id === 'endereco') {
      return (
        <fieldset className="space-y-5">
          <legend className="sr-only">Endereço</legend>
          <Campo id="cfg-rua" label="Rua e número">
            <input
              id="cfg-rua"
              className="input"
              value={config.enderecoRua}
              onChange={(e) => set('enderecoRua', e.target.value)}
            />
          </Campo>
          <Campo id="cfg-cidade" label="Cidade e estado">
            <input
              id="cfg-cidade"
              className="input"
              value={config.enderecoCidadeUf}
              onChange={(e) => set('enderecoCidadeUf', e.target.value)}
            />
          </Campo>
          {config.enderecoRua.trim() || config.enderecoCidadeUf.trim() ? (
            <p className="text-etiqueta text-steel-500">
              Link do Google Maps (montado automaticamente):{' '}
              <a
                href={buildMapsRouteUrl(config)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-steel-300 underline decoration-white/20 underline-offset-2 hover:text-paper"
              >
                testar rota →
              </a>
            </p>
          ) : null}
          <AcoesSecao onSalvar={salvar} onRestaurar={restaurar} />
        </fieldset>
      )
    }

    if (id === 'horarios') {
      return (
        <fieldset className="space-y-5">
          <legend className="sr-only">Horários</legend>
          {config.horarios.length === 0 ? (
            <p className="text-sm text-steel-500">
              Nenhum horário cadastrado. O site mostra um aviso discreto pedindo
              para confirmar antes de vir.
            </p>
          ) : (
            <ul className="space-y-2">
              {config.horarios.map((h, i) => (
                <li key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    className="input"
                    value={h.dias}
                    placeholder="Seg a Sex"
                    aria-label="Dias"
                    onChange={(e) => {
                      const nova = [...config.horarios]
                      nova[i] = { ...h, dias: e.target.value }
                      set('horarios', nova)
                    }}
                  />
                  <input
                    className="input"
                    value={h.horas}
                    placeholder="8h às 18h"
                    aria-label="Horas"
                    onChange={(e) => {
                      const nova = [...config.horarios]
                      nova[i] = { ...h, horas: e.target.value }
                      set('horarios', nova)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => set('horarios', config.horarios.filter((_, j) => j !== i))}
                    aria-label={`Remover horário ${h.dias || 'sem rótulo'}`}
                    className="btn-icone btn-icone-perigo"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => set('horarios', [...config.horarios, { dias: '', horas: '' }])}
            className="inline-flex items-center gap-2 text-sm font-medium text-steel-300 transition-colors hover:text-paper"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            Adicionar faixa de horário
          </button>
        </fieldset>
      )
    }

    return <PainelInstalarApp />
  }

  const ativa = SECOES.find((s) => s.id === secao) ?? null
  // No desktop nunca há "nada selecionado": sem escolha, abre a primeira
  // seção. No mobile `null` significa o hub (lista) — comportamento
  // aprovado, então a distinção entre os dois arranjos vem daqui.
  const ativaDesktop = ativa ?? SECOES[0]

  /* ==================================================================== */
  /* DESKTOP: navegação secundária + painel                               */
  /* ==================================================================== */
  const desktop = (
    <div className="hidden lg:block">
      <header className="border-b border-line pb-5"> /* taste-skill-ignore: painel */
        <h2 className="painel-h1">Configurações</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-steel-500">
          Ajuste o que aparece nos botões e no rodapé do site, além do
          aplicativo do painel. Escolha uma seção à esquerda.
        </p>
      </header>

      <div className="mt-6 flex gap-8">
        {/* Navegação secundária: subordinada à sidebar — mais leve, sem
            caixa própria, só divisores sutis e o fio vermelho no ativo. */}
        <nav aria-label="Seções de configuração" className="w-60 shrink-0">
          <div className="space-y-6">
            {GRUPOS.map((grupo) => {
              const itens = SECOES.filter((s) => s.grupo === grupo.id)
              if (itens.length === 0) return null
              return (
                <div key={grupo.id}>
                  <p className="px-3 pb-1.5 font-display text-micro font-semibold tracking-[0.18em] text-steel-600 uppercase">
                    {grupo.titulo}
                  </p>
                  <div className="space-y-0.5 border-l border-line"> /* taste-skill-ignore: painel */
                    {itens.map((s) => {
                      const selecionada = ativaDesktop.id === s.id
                      const Icone = s.icone
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSecao(s.id)}
                          aria-current={selecionada ? 'true' : undefined}
                          className={`foco-painel relative flex w-full items-center gap-3 rounded-r-lg py-2.5 pr-3 pl-3 text-left text-sm transition-colors ${
                            selecionada
                              ? 'bg-claro/[0.04] font-medium text-paper before:absolute before:inset-y-0 before:-left-px before:w-0.5 before:bg-brand-500'
                              : 'text-steel-400 hover:bg-claro/[0.03] hover:text-paper'
                          }`}
                        >
                          <Icone
                            className={`size-4 shrink-0 ${
                              selecionada ? 'text-brand-500' : 'text-steel-500'
                            }`}
                          />
                          <span className="min-w-0 flex-1 truncate">{s.rotulo}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        {/* Painel de edição: título, descrição e formulário. Largura
            máxima generosa para não virar coluna estreita no centro. */}
        <div className="min-w-0 flex-1">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-paper">{ativaDesktop.rotulo}</h3>
              {temAlteracoes ? (
                <span
                  role="status"
                  className="rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-etiqueta font-medium text-warn"
                >
                  Alterações não salvas
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-steel-500">{ativaDesktop.descricao}</p>
            <div className="mt-6">{conteudo(ativaDesktop.id)}</div>
          </div>
        </div>
      </div>
    </div>
  )

  /* ==================================================================== */
  /* CELULAR / TABLET: lista compacta → sub-tela com "voltar"             */
  /* ==================================================================== */
  if (ativa) {
    return (
      <>
        <div className="mx-auto max-w-2xl space-y-5 lg:hidden">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setSecao(null)}
              aria-label="Voltar para configurações"
              className="foco-painel btn-icone -ml-1 mt-0.5"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h2 className="painel-h1">{ativa.rotulo}</h2>
              <p className="mt-1 text-sm text-steel-500">{ativa.descricao}</p>
            </div>
          </div>
          {conteudo(ativa.id)}
        </div>

        {/* No desktop o mesmo estado mostra a navegação + painel. */}
        {desktop}

        <Toast feedback={feedback} onFechar={() => setFeedback(null)} />
      </>
    )
  }

  return (
    <>
      {/* Hub mobile: lista de seções. No desktop é escondido em favor do
          layout de duas colunas — uma navegação lateral basta. */}
      <div className="mx-auto max-w-2xl lg:hidden">
        <header>
          <h2 className="painel-h1">Configurações</h2>
          <p className="mt-1.5 text-sm text-steel-500">
            Toque numa seção para editar. Tudo o que aparece nos botões e no
            rodapé do site nasce daqui.
          </p>
        </header>

        <div className="mt-5 divide-y divide-line border-y border-line"> /* taste-skill-ignore: painel */
          {SECOES.filter((s) => s.id !== 'app').map((s) => {
            const Icone = s.icone
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSecao(s.id)}
                className="foco-painel item-linha group !px-4 !py-3.5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-night-800 text-steel-300 transition-colors group-hover:border-brand-500/50 group-hover:text-brand-500" /* taste-skill-ignore: painel */
                >
                  <Icone className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-paper">{s.rotulo}</span>
                  <span className="block truncate text-xs text-steel-500">{s.resumo(config)}</span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-steel-600 transition-colors group-hover:text-paper"
                  aria-hidden="true"
                />
              </button>
            )
          })}
          <LinhaInstalarApp />
        </div>
      </div>

      {desktop}

      <Toast feedback={feedback} onFechar={() => setFeedback(null)} />
    </>
  )
}
